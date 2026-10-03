# RSVP Events

## Supabase and Vercel setup

1. Run `database/001_event_rsvp_tables.sql` in your Supabase SQL Editor.
2. Add the following server-side environment variables in Vercel, selecting Production. Add them to Preview if needed, preferably with a separate test database and email recipient.
3. Deploy/redeploy after saving the variables. Use the Vite preset, `npm run build`, and output directory `dist`. `api/rsvp.js` runs as a Vercel Node function.

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | Project URL, e.g. `https://your-project.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase service role key |
| `GMAIL_USER` | Gmail account sending notifications |
| `GMAIL_APP_PASSWORD` | Google app password for that account |
| `RSVP_NOTIFY_EMAIL` | Organizer email address, or comma-separated addresses |

No `PORT`, manual `NODE_ENV`, Supabase anon key, or `VITE_*` variables are needed on Vercel. Keep credentials server-side.

| Event | Table |
| --- | --- |
| Haldi (`haldi`) | `public.haldi_rsvps` |
| Pelli Kuthuru & Pelli Koduku (`pelli`) | `public.pelli_rsvps` |
| Sri Satyanarayana Swamy Vratham (`vratham`) | `public.vratham_rsvps` |

Each table stores name, contact, normalized contact key, attendance, guest count, message, timestamps, revision, and notification status. The same contact updates its existing response for that event, and can respond independently to the other events. Database upserts are atomic. RLS is enabled with no public policies, public/anon/authenticated access revoked, and service-role access granted.

Every valid submission, including updates and declines, sends an organizer email after saving. Failed email delivery leaves the response saved and records `failed` or `unconfigured`; automatic retry is not implemented. A notification status write failure is logged. Database failures return an error without reporting success. No filesystem storage fallback is used.

The migration does not import existing `data/rsvps.json` responses or modify the previous project's tables. It can be rerun for the schema it creates; it does not upgrade unrelated preexisting tables with these names.

## Local development

Copy `.env.example` to `.env` and fill in credentials. With Node 22, run `node --env-file=.env server.js` and, in another terminal, `npm run dev:web`. Alternatively export variables and run `npm run dev`.

Standalone Node deployment: `npm ci`, `npm run build`, `npm start`. `PORT` defaults to 4321. All deployments now use Supabase storage.

Checks: `node --test email.test.js lib/*.test.js` and `npm run build`.
