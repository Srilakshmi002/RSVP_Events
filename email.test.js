import test from "node:test";
import assert from "node:assert/strict";
import { buildRsvpEmail, sendRsvpEmail } from "./email.js";

const record = {
  eventId: "haldi", fullName: "Guest <script>", contact: "guest@example.com",
  attending: false, guestCount: 0, message: "Hello & thanks",
  updatedAt: "2026-10-03T17:00:00.000Z"
};

test("notification contains event and decline details and escapes guest HTML", () => {
  const email = buildRsvpEmail(record, true);
  assert.match(email.subject, /Updated Haldi RSVP/);
  assert.match(email.text, /Attendance: Declined/);
  assert.match(email.text, /Total guests: 0/);
  assert.match(email.html, /Guest &lt;script&gt;/);
  assert.doesNotMatch(email.html, /<script>/);
});

test("delivery uses organizer configuration and reports failures", async () => {
  const keys = ["GMAIL_USER", "GMAIL_APP_PASSWORD", "RSVP_NOTIFY_EMAIL"];
  const saved = keys.map((key) => process.env[key]);
  try {
    keys.forEach((key) => delete process.env[key]);
    assert.equal((await sendRsvpEmail(record, false)).status, "unconfigured");
    process.env.GMAIL_USER = "sender@gmail.com";
    process.env.GMAIL_APP_PASSWORD = "abcd efgh";
    process.env.RSVP_NOTIFY_EMAIL = "organizer@example.com";
    const sent = await sendRsvpEmail(record, false, (config) => {
      assert.equal(config.auth.pass, "abcdefgh");
      return { sendMail: async (payload) => {
        assert.equal(payload.to, "organizer@example.com");
        assert.equal(payload.from, "sender@gmail.com");
        return { messageId: "test-id" };
      } };
    });
    assert.deepEqual(sent, { status: "sent", messageId: "test-id" });
    const failed = await sendRsvpEmail(record, false, () => ({
      sendMail: async () => { throw new Error("SMTP failure"); }
    }));
    assert.equal(failed.status, "failed");
  } finally {
    keys.forEach((key, index) => {
      if (saved[index] === undefined) delete process.env[key];
      else process.env[key] = saved[index];
    });
  }
});
