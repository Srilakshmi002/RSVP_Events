import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { emailConfig } from "./email.js";
import { handleRsvp } from "./lib/rsvp.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 4321;
const IS_PROD = process.env.NODE_ENV === "production";
const ROOT = path.join(__dirname, IS_PROD ? "dist" : "public");
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

if (IS_PROD && !emailConfig().configured) {
  console.warn("RSVP email notifications require GMAIL_USER, GMAIL_APP_PASSWORD, and RSVP_NOTIFY_EMAIL.");
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
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
