import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getEvent } from "../config.js";
import { EventPanel } from "../components/Shared.jsx";

function validContact(value) {
  const text = value.trim();
  if (text.includes("@")) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
  const digits = text.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export function RsvpPage() {
  const { eventId } = useParams();
  const event = getEvent(eventId);
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [attending, setAttending] = useState("");
  const [guestCount, setGuestCount] = useState(1);
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (event) document.title = `RSVP · ${event.name}`;
  }, [event]);

  useEffect(() => {
    setFullName("");
    setContact("");
    setAttending("");
    setGuestCount(1);
    setMessage("");
    setWebsite("");
    setErrors({});
    setFormError("");
    setSending(false);
  }, [eventId]);

  if (!event) return <Navigate to="/" replace />;

  function clearFieldError(key) {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setFormError("");
  }

  async function onSubmit(e) {
    e.preventDefault();
    const nextErrors = {};
    if (!fullName.trim() || fullName.trim().length < 2) {
      nextErrors.fullName = "Please enter your full name.";
    }
    if (!contact.trim() || !validContact(contact)) {
      nextErrors.contact = "Enter an email address or a phone number.";
    }
    if (attending !== "yes" && attending !== "no") {
      nextErrors.attending = "Please choose Joyfully attending or Unable to attend.";
    }
    const willAttend = attending === "yes";
    const count = Number(guestCount);
    if (willAttend && (!Number.isInteger(count) || count < 1 || count > 30)) {
      nextErrors.guestCount = "Enter the number of guests attending, including yourself.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setFormError("Please check the highlighted details and try again.");
      return;
    }

    setSending(true);
    setFormError("");
    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          fullName: fullName.trim(),
          contact: contact.trim(),
          attending: willAttend,
          guestCount: willAttend ? count : 0,
          message: message.trim(),
          website
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Unable to save");
      }
      sessionStorage.setItem(
        "rsvp-last",
        JSON.stringify({
          eventId: event.id,
          fullName: fullName.trim(),
          attending: willAttend,
          guestCount: willAttend ? count : 0,
          updated: Boolean(payload.updated)
        })
      );
      navigate(`/rsvp/${event.id}/thank-you`);
    } catch (err) {
      setSending(false);
      setFormError(err.message || "We could not save your response. Please try again.");
    }
  }

  return (
    <main id="main" className="page">
      <div className="rsvp-layout wrap">
        <EventPanel event={event} />
        <section className="form-card" aria-labelledby="form-title">
          <p className="form-kicker">RSVP</p>
          <h2 id="form-title">Your response</h2>
          <p className="form-note">
            This response is only for the {event.name}. You can reply to each celebration separately.
          </p>
          <form onSubmit={onSubmit} noValidate>
            {formError ? <div className="form-error">{formError}</div> : null}

            <div className="field">
              <label htmlFor="fullName">
                Full name <span className="req" aria-hidden="true">*</span>
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                maxLength={80}
                value={fullName}
                placeholder="Your full name"
                aria-invalid={errors.fullName ? "true" : undefined}
                onChange={(e) => {
                  setFullName(e.target.value);
                  clearFieldError("fullName");
                }}
              />
              {errors.fullName ? <p className="field-error">{errors.fullName}</p> : null}
            </div>

            <div className="field">
              <label htmlFor="contact">
                Email or phone number <span className="req" aria-hidden="true">*</span>
              </label>
              <input
                id="contact"
                name="contact"
                type="text"
                autoComplete="on"
                required
                maxLength={80}
                value={contact}
                placeholder="Email address or phone number"
                aria-invalid={errors.contact ? "true" : undefined}
                onChange={(e) => {
                  setContact(e.target.value);
                  clearFieldError("contact");
                }}
              />
              {errors.contact ? <p className="field-error">{errors.contact}</p> : null}
            </div>

            <fieldset>
              <legend>
                Will you attend? <span className="req" aria-hidden="true">*</span>
              </legend>
              <div className="choices">
                <label className="choice">
                  <input
                    type="radio"
                    name="attending"
                    value="yes"
                    checked={attending === "yes"}
                    onChange={() => {
                      setAttending("yes");
                      clearFieldError("attending");
                    }}
                  />
                  <span>Joyfully attending</span>
                </label>
                <label className="choice">
                  <input
                    type="radio"
                    name="attending"
                    value="no"
                    checked={attending === "no"}
                    onChange={() => {
                      setAttending("no");
                      clearFieldError("attending");
                    }}
                  />
                  <span>Unable to attend</span>
                </label>
              </div>
              {errors.attending ? <p className="field-error">{errors.attending}</p> : null}
            </fieldset>

            {attending === "yes" ? (
              <div className="field guest-field">
                <label htmlFor="guestCount">
                  Number of guests attending, including yourself{" "}
                  <span className="req" aria-hidden="true">*</span>
                </label>
                <div className="stepper">
                  <button
                    type="button"
                    aria-label="Fewer guests"
                    onClick={() => setGuestCount((n) => Math.max(1, Number(n) - 1))}
                  >
                    −
                  </button>
                  <input
                    id="guestCount"
                    name="guestCount"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={30}
                    value={guestCount}
                    aria-invalid={errors.guestCount ? "true" : undefined}
                    onChange={(e) => {
                      setGuestCount(e.target.value);
                      clearFieldError("guestCount");
                    }}
                  />
                  <button
                    type="button"
                    aria-label="More guests"
                    onClick={() => setGuestCount((n) => Math.min(30, Number(n) + 1))}
                  >
                    +
                  </button>
                </div>
                {errors.guestCount ? <p className="field-error">{errors.guestCount}</p> : null}
              </div>
            ) : null}

            <div className="field">
              <label htmlFor="message">
                A message for the family <span className="quiet">(optional)</span>
              </label>
              <textarea
                id="message"
                name="message"
                maxLength={500}
                placeholder="Share a blessing or note for the families"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="hp" aria-hidden="true">
              <label>
                Website
                <input
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </label>
            </div>

            <div className="form-actions">
              <button className={`btn btn--${event.id}`} type="submit" disabled={sending}>
                {sending ? "Sending…" : "Submit RSVP"}
              </button>
              <p className="quiet">
                Sending again with the same email or phone number updates your response for this
                celebration.
              </p>
              <Link className="back-link" to="/" style={{ justifyContent: "center" }}>
                Back to All Events
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
