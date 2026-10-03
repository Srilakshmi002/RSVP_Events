import { isPlaceholder, SITE_CONFIG } from "../config.js";
import { Motif } from "./Motif.jsx";

function Value({ children }) {
  return <span className={isPlaceholder(children) ? "ph" : undefined}>{children}</span>;
}

export function EventFacts({ event }) {
  return (
    <dl className="facts">
      <div>
        <dt>Date</dt>
        <dd>
          <Value>{event.date}</Value>
        </dd>
      </div>
      <div>
        <dt>Time</dt>
        <dd>
          <Value>{event.time}</Value>
        </dd>
      </div>
      <div>
        <dt>Venue</dt>
        <dd>
          <Value>{event.venue}</Value>
        </dd>
      </div>
      <div>
        <dt>Address</dt>
        <dd>
          <Value>{event.address}</Value>
        </dd>
      </div>
    </dl>
  );
}

export function MealNote({ eventId }) {
  return <p className={`meal-note meal-note--${eventId}`}>{SITE_CONFIG.mealNote}</p>;
}

export function EventPanel({ event, headingLevel = "h1" }) {
  const Heading = headingLevel;
  return (
    <section className="event-panel" aria-labelledby="event-title">
      <div className="motif">
        <Motif id={event.id} />
      </div>
      <Heading id="event-title">{event.name}</Heading>
      <p className="desc">{event.description}</p>
      <EventFacts event={event} />
      <MealNote eventId={event.id} />
      <p className="deadline">
        Kindly respond by <Value>{event.rsvpDeadline}</Value>
      </p>
    </section>
  );
}

export function Flourish() {
  return (
    <div className="flourish" aria-hidden="true">
      <span />
      <svg width="18" height="18" viewBox="0 0 18 18">
        <path d="M9 1c1 3 2 5 5 6-3 1-4 3-5 6-1-3-2-5-5-6 3-1 4-3 5-6z" fill="#C4A35A" />
      </svg>
      <span />
    </div>
  );
}
