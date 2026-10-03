import { handleRsvp } from "../lib/rsvp.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.statusCode = 405;
    return res.end(JSON.stringify({ ok: false, error: "Method not allowed." }));
  }
  try {
    await handleRsvp(req, res);
  } catch (error) {
    res.statusCode = error instanceof SyntaxError ? 400 : error.status || 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: false, error: "Unable to process your response. Please try again." }));
  }
}
