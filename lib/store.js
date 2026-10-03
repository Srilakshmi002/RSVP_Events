export const EVENT_TABLES = Object.freeze({
  haldi: "haldi_rsvps", pelli: "pelli_rsvps", vratham: "vratham_rsvps"
});

function tableFor(eventId) {
  if (!Object.hasOwn(EVENT_TABLES, eventId)) throw new Error("Invalid event.");
  return EVENT_TABLES[eventId];
}

async function request(endpoint, method, body) {
  const url = (process.env.SUPABASE_URL || "").trim().replace(/\/$/, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !key) throw new Error("Supabase is not configured.");
  const response = await fetch(`${url}/rest/v1/${endpoint}`, {
    method,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(body), signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error(`Supabase request failed (${response.status}).`);
  return response.json();
}

export async function saveRsvp(record) {
  tableFor(record.eventId);
  const row = await request("rpc/save_event_rsvp", "POST", {
    event_id: record.eventId,
    response: {
      full_name: record.fullName, contact: record.contact, contact_key: record.contactKey,
      attending: record.attending, guest_count: record.guestCount, message: record.message
    }
  });
  if (!row?.id || !row.updated_at || !Number.isInteger(row.revision)) throw new Error("Invalid saved response.");
  return {
    id: row.id, updated: row.revision > 1,
    record: { ...record, id: row.id, updatedAt: row.updated_at, submittedAt: row.submitted_at, revision: row.revision }
  };
}

export async function recordNotification(eventId, id, revision, notification) {
  return request(`${tableFor(eventId)}?id=eq.${encodeURIComponent(id)}&revision=eq.${revision}`, "PATCH", {
    notification_status: notification.status,
    notification_message_id: notification.messageId || null,
    notified_at: notification.status === "sent" ? new Date().toISOString() : null
  });
}
