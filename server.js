import http from "http";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 4321;
const IS_PROD = process.env.NODE_ENV === "production";
const ROOT = path.join(__dirname, IS_PROD ? "dist" : "public");
const DATA_DIR = path.join(__dirname, "data");
const RSVP_FILE = path.join(DATA_DIR, "rsvps.json");
const EVENT_IDS = ["haldi", "pelli", "vratham"];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json; charset=utf-8"
};

function ensureStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(RSVP_FILE)) {
    const empty = { haldi: [], pelli: [], vratham: [] };
    fs.writeFileSync(RSVP_FILE, JSON.stringify(empty, null, 2));
  }
}

function readStore() {
  ensureStore();
  const parsed = JSON.parse(fs.readFileSync(RSVP_FILE, "utf8"));
  for (const id of EVENT_IDS) {
    if (!Array.isArray(parsed[id])) parsed[id] = [];
  }
  return parsed;
}

function writeStore(data) {
  const tmp = `${RSVP_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, RSVP_FILE);
}

let writeQueue = Promise.resolve();
function withStore(mutator) {
  const run = writeQueue.then(async () => {
    const data = readStore();
    const result = await mutator(data);
    writeStore(data);
    return result;
  });
  writeQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

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

async function handleRsvp(req, res) {
  const ip = req.socket.remoteAddress || "local";
  if (tooManyPosts(ip)) {
    send(res, 429, JSON.stringify({ ok: false, error: "Please wait a moment and try again." }));
    return;
  }
  notePost(ip);

  const body = await readBody(req);
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

  const result = await withStore((data) => {
    const list = data[eventId];
    const key = contactKey(contact);
    const now = new Date().toISOString();
    const existing = list.find((item) => item.contactKey === key);
    if (existing) {
      existing.fullName = fullName;
      existing.contact = contact;
      existing.attending = attending;
      existing.guestCount = guestCount;
      existing.message = message;
      existing.updatedAt = now;
      return { updated: true, id: existing.id };
    }
    const record = {
      id: crypto.randomUUID(),
      fullName,
      contact,
      contactKey: key,
      attending,
      guestCount,
      message,
      submittedAt: now,
      updatedAt: now
    };
    list.push(record);
    return { updated: false, id: record.id };
  });

  send(res, 200, JSON.stringify({ ok: true, updated: result.updated, id: result.id }));
}

function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith("/")) pathname += "index.html";
  const filePath = path.normalize(path.join(ROOT, pathname));
  if (!filePath.startsWith(ROOT)) {
    send(res, 403, "Forbidden", "text/plain; charset=utf-8");
    return;
  }
  fs.readFile(filePath, (err, buf) => {
    if (err) {
      if (!IS_PROD) {
        send(res, 404, "Not found", "text/plain; charset=utf-8");
        return;
      }
      const index = path.join(ROOT, "index.html");
      fs.readFile(index, (indexErr, indexBuf) => {
        if (indexErr) {
          send(res, 404, "Not found", "text/plain; charset=utf-8");
          return;
        }
        send(res, 200, indexBuf, MIME[".html"]);
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, buf, MIME[ext] || "application/octet-stream");
  });
}

ensureStore();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  try {
    if (req.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      });
      res.end();
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/rsvp") {
      await handleRsvp(req, res);
      return;
    }
    if (req.method === "GET") {
      if (!IS_PROD && url.pathname.startsWith("/api/")) {
        send(res, 404, JSON.stringify({ ok: false, error: "Not found." }));
        return;
      }
      serveStatic(req, res, url);
      return;
    }
    send(res, 405, JSON.stringify({ ok: false, error: "Method not allowed." }));
  } catch (err) {
    const status = err.status || 500;
    send(res, status, JSON.stringify({ ok: false, error: "Something went wrong. Please try again." }));
  }
});

server.listen(PORT, () => {
  if (IS_PROD) {
    console.log(`Wedding RSVP site at http://localhost:${PORT}`);
  } else {
    console.log(`RSVP API at http://localhost:${PORT}`);
  }
});
