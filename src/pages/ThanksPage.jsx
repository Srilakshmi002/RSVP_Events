import { Link, Navigate, useParams } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { getEvent, SITE_CONFIG, whenLabel } from "../config.js";
import { Motif } from "../components/Motif.jsx";
import { MealNote } from "../components/Shared.jsx";

export function ThanksPage() {
  const { eventId } = useParams();
  const event = getEvent(eventId);

  const saved = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("rsvp-last") || "null");
    } catch {
      return null;
    }
  }, [eventId]);

  useEffect(() => {
    if (event) document.title = `Response received · ${event.name}`;
  }, [event]);

  if (!event) return <Navigate to="/" replace />;

  const matches = saved && saved.eventId === event.id;
  const lead = matches
    ? saved.updated
      ? `We updated your response for the ${event.name}.`
      : saved.attending
        ? event.attendMessage
        : event.declineMessage
    : `Thank you. If you just replied, your response for the ${event.name} has been saved.`;

  return (
    <main id="main" className="page">
      <div className="wrap page-intro">
        <article className="thanks-card" aria-live="polite">
          <div className="motif">
            <Motif id={event.id} />
          </div>
          <h1>Your response is received</h1>
          <p className="confirm-when">
            {event.name} · {whenLabel(event)}
          </p>
          <p>{lead}</p>
          {matches ? (
            <dl className="recap">
              <div>
                <dt>Name</dt>
                <dd>{saved.fullName}</dd>
              </div>
              <div>
                <dt>Response</dt>
                <dd>{saved.attending ? "Joyfully attending" : "Unable to attend"}</dd>
              </div>
              {saved.attending ? (
                <div>
                  <dt>Guests</dt>
                  <dd>{saved.guestCount}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}
          <MealNote eventId={event.id} />
          <h2 className="section-title" style={{ fontSize: "1.8rem", marginTop: "1.4rem" }}>
            Respond to another celebration
          </h2>
          <div className="other-events">
            {SITE_CONFIG.events.map((item) =>
              item.id === event.id ? (
                <Link key={item.id} className="btn btn-secondary" to={`/rsvp/${item.id}`}>
                  Update this response
                </Link>
              ) : (
                <Link key={item.id} className={`btn btn--${item.id}`} to={`/rsvp/${item.id}`}>
                  RSVP for {item.name}
                </Link>
              )
            )}
          </div>
          <p>
            <Link className="back-link" to="/" style={{ justifyContent: "center" }}>
              Back to All Events
            </Link>
          </p>
        </article>
      </div>
    </main>
  );
}

export function NotFoundPage() {
  useEffect(() => {
    document.title = "Page not found";
  }, []);

  return (
    <main id="main" className="page">
      <div className="wrap not-found">
        <h1>This page has wandered off</h1>
        <p>The celebration you are looking for is back on the invitation.</p>
        <p>
          <Link className="btn" to="/" style={{ maxWidth: "18rem", marginInline: "auto" }}>
            Back to All Events
          </Link>
        </p>
      </div>
    </main>
  );
}
