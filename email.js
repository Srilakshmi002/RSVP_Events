import nodemailer from "nodemailer";
import { SITE_CONFIG, getEvent } from "./src/config.js";

export function emailConfig() {
  const user = (process.env.GMAIL_USER || "").trim();
  const password = (process.env.GMAIL_APP_PASSWORD || "").replace(/\s/g, "");
  const to = (process.env.RSVP_NOTIFY_EMAIL || "").trim();
  return { user, password, to, configured: Boolean(user && password && to) };
}

export function buildRsvpEmail(record, updated) {
  const event = getEvent(record.eventId);
  const fields = [
    ["Event", event.name],
    ["Date and time", `${event.date} at ${event.time}`],
    ["Guest", record.fullName],
    ["Contact", record.contact],
    ["Attendance", record.attending ? "Attending" : "Declined"],
    ["Total guests", record.guestCount],
    ["Message", record.message || "None provided"],
    ["Submitted", new Intl.DateTimeFormat("en-US", {
      dateStyle: "full", timeStyle: "long", timeZone: "America/Chicago"
    }).format(new Date(record.updatedAt))]
  ];
  const heading = `${updated ? "Updated" : "New"} ${event.name} RSVP for ${SITE_CONFIG.groomShort} and ${SITE_CONFIG.brideShort}`;
  const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
  return {
    subject: `${heading}: ${record.fullName.replace(/[\r\n]/g, " ")} (${record.attending ? "Attending" : "Declined"})`,
    text: [heading, "", ...fields.map(([label, value]) => `${label}: ${value}`)].join("\n"),
    html: `<h2>${escape(heading)}</h2><table>${fields.map(([label, value]) => `<tr><th align="left">${escape(label)}</th><td>${escape(value).replace(/\n/g, "<br>")}</td></tr>`).join("")}</table>`
  };
}

export async function sendRsvpEmail(record, updated, createTransport = nodemailer.createTransport) {
  const config = emailConfig();
  if (!config.configured) return { status: "unconfigured" };
  try {
    const transport = createTransport({
      host: "smtp.gmail.com", port: 465, secure: true,
      auth: { user: config.user, pass: config.password },
      connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 10000
    });
    const result = await transport.sendMail({
      from: config.user, to: config.to, ...buildRsvpEmail(record, updated)
    });
    return { status: "sent", messageId: result.messageId || null };
  } catch {
    return { status: "failed" };
  }
}
