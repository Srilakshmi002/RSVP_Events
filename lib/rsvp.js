import { sendRsvpEmail } from "../email.js";
import { saveRsvp, recordNotification, EVENT_TABLES } from "./store.js";
const EVENT_IDS = Object.keys(EVENT_TABLES);

function contactKey(value) {
  const text = String(value || "").trim();
  if (text.includes("@")) return text.toLowerCase();
  const digits = text.replace(/\D/g, "");
  return digits ? `tel:${digits}` : text.toLowerCase();
}

function validContact(value) {
  const text = String(value || "").trim();
  if (text.includes("@")) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
  const digits = text.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

function send(res, status, body, type) {
  res.writeHead(status, {
    "Content-Type": type || "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store"
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 20000) {
        reject(Object.assign(new Error("too_large"), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8") || "{}";
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(Object.assign(new Error("bad_json"), { status: 400 }));
      }
    });
    req.on("error", reject);
  });
}

const posts = new Map();
function tooManyPosts(ip) {
  const now = Date.now();
  const recent = (posts.get(ip) || []).filter((t) => now - t < 60 * 1000);
  posts.set(ip, recent);
  return recent.length >= 12;
}
function notePost(ip) {
  const recent = posts.get(ip) || [];
  recent.push(Date.now());
  posts.set(ip, recent);
}

export async function handleRsvp(req, res) {
  const ip = req.socket.remoteAddress || "local";
  if (tooManyPosts(ip)) {
    send(res, 429, JSON.stringify({ ok: false, error: "Please wait a moment and try again." }));
    return;
  }
  notePost(ip);

  const body = req.body === undefined ? await readBody(req) :
    typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    send(res, 400, JSON.stringify({ ok: false, error: "Please provide a valid response." }));
    return;
  }
  if (Buffer.byteLength(JSON.stringify(body)) > 20000) {
    send(res, 413, JSON.stringify({ ok: false, error: "Response is too large." }));
    return;
  }
  if (String(body.website || "").trim()) {
    send(res, 200, JSON.stringify({ ok: true, updated: false }));
    return;
  }

  const eventId = String(body.eventId || "");
  const fullName = String(body.fullName || "").trim().replace(/\s+/g, " ");
  const contact = String(body.contact || "").trim();
  const attending = body.attending === true;
  const message = String(body.message || "").trim();
  let guestCount = Number(body.guestCount);

  if (!EVENT_IDS.includes(eventId)) {
    send(res, 400, JSON.stringify({ ok: false, error: "Choose one of the celebrations." }));
    return;
  }
  if (fullName.length < 2 || fullName.length > 80) {
    send(res, 400, JSON.stringify({ ok: false, error: "Please enter your full name." }));
    return;
  }
  if (!validContact(contact) || contact.length > 80) {
    send(res, 400, JSON.stringify({ ok: false, error: "Please enter a valid email address or phone number." }));
    return;
  }
  if (typeof body.attending !== "boolean") {
    send(res, 400, JSON.stringify({ ok: false, error: "Please tell us whether you will attend." }));
    return;
  }
  if (attending) {
    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 30) {
      send(res, 400, JSON.stringify({ ok: false, error: "Please enter the number of guests attending, including yourself." }));
      return;
    }
  } else {
    guestCount = 0;
  }
  if (message.length > 500) {
    send(res, 400, JSON.stringify({ ok: false, error: "Please keep the message under 500 characters." }));
    return;
  }

  let result;
  try {
    result = await saveRsvp({ eventId, fullName, contact, contactKey: contactKey(contact), attending, guestCount, message });
  } catch {
    send(res, 503, JSON.stringify({ ok: false, error: "Your response could not be saved. Please try again." }));
    return;
  }

  const notification = await sendRsvpEmail(result.record, result.updated);
  try {
    await recordNotification(eventId, result.id, result.record.revision, notification);
  } catch {
    console.warn(`RSVP ${result.id} saved; notification status could not be recorded.`);
  }
  if (notification.status !== "sent") {
    console.warn(`RSVP ${result.id} saved; email notification ${notification.status}.`);
  }
  send(res, 200, JSON.stringify({ ok: true, updated: result.updated, id: result.id, notification: notification.status }));
}

