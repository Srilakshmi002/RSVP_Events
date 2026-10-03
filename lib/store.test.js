import test from 'node:test';
import assert from 'node:assert/strict';
import { saveRsvp, recordNotification, EVENT_TABLES } from './store.js';
import handler from '../api/rsvp.js';

test('event routing, update semantics, notification isolation, and save failures', async () => {
  const originalFetch = global.fetch;
  const saved = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'GMAIL_USER', 'GMAIL_APP_PASSWORD', 'RSVP_NOTIFY_EMAIL'].map(key => [key, process.env[key]]);
  const calls = [];
  try {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    delete process.env.GMAIL_USER;
    delete process.env.GMAIL_APP_PASSWORD;
    delete process.env.RSVP_NOTIFY_EMAIL;
    global.fetch = async (url, options) => {
      calls.push({ url, ...options, data: JSON.parse(options.body) });
      return { ok: true, json: async () => url.includes('/rpc/') ? { id: 'test-id', revision: 2, submitted_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-03T00:00:00Z' } : [] };
    };
    for (const [eventId, table] of Object.entries(EVENT_TABLES)) {
      const result = await saveRsvp({ eventId, fullName: 'Test Guest', contact: 'test@example.com', contactKey: 'test@example.com', attending: true, guestCount: 2, message: '' });
      assert.equal(calls.at(-1).data.event_id, eventId);
      assert.equal(result.updated, true);
      await recordNotification(eventId, result.id, 2, { status: 'sent', messageId: 'mail-id' });
      assert.match(calls.at(-1).url, new RegExp(`/rest/v1/${table}\\?id=eq.test-id&revision=eq.2`));
    }
    await assert.rejects(saveRsvp({ eventId: 'constructor' }), /Invalid event/);
    function response() {
      return { headers: {}, setHeader(key, value) { this.headers[key] = value; }, writeHead(code, headers) { this.statusCode = code; Object.assign(this.headers, headers); }, end(body) { this.payload = JSON.parse(body); } };
    }
    const body = { eventId: 'haldi', fullName: 'Test Guest', contact: 'TEST@example.com', attending: false, guestCount: 15, message: '' };
    const res = response();
    await handler({ method: 'POST', body, socket: { remoteAddress: 'test' } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.ok, true);
    assert.equal(res.payload.notification, 'unconfigured');
    const save = calls.at(-2).data.response;
    assert.equal(save.guest_count, 0);
    assert.equal(save.contact_key, 'test@example.com');
    global.fetch = async () => ({ ok: false, status: 503 });
    const failed = response();
    await handler({ method: 'POST', body, socket: { remoteAddress: 'test' } }, failed);
    assert.equal(failed.statusCode, 503);
    assert.equal(failed.payload.ok, false);
    const invalid = response();
    await handler({ method: 'POST', body: { ...body, eventId: 'unknown' }, socket: { remoteAddress: 'test' } }, invalid);
    assert.equal(invalid.statusCode, 400);
    const malformed = response();
    await handler({ method: 'POST', body: '{', socket: { remoteAddress: 'test' } }, malformed);
    assert.equal(malformed.statusCode, 400);
    const get = response();
    await handler({ method: 'GET' }, get);
    assert.equal(get.statusCode, 405);
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    await assert.rejects(saveRsvp({ eventId: 'haldi' }), /not configured/);
  } finally {
    global.fetch = originalFetch;
    saved.forEach(([key, value]) => value === undefined ? delete process.env[key] : process.env[key] = value);
  }
});
