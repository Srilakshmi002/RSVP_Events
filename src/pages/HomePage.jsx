import { Link } from "react-router-dom";
import { useEffect } from "react";
import { SITE_CONFIG, isPlaceholder } from "../config.js";
import { Motif } from "../components/Motif.jsx";
import { EventFacts, Flourish, MealNote } from "../components/Shared.jsx";

function Value({ children }) {
  return <span className={isPlaceholder(children) ? "ph" : undefined}>{children}</span>;
}

export function HomePage() {
  useEffect(() => {
    document.title = `${SITE_CONFIG.groomShort} & ${SITE_CONFIG.brideShort} | Wedding Celebrations`;
  }, []);

  return (
    <main id="main">
      <section className="welcome wrap">
        <div className="welcome-hero">
          <div className="hero-icons" aria-hidden="true">
            <Motif id="vratham" />
          </div>
          <p className="eyebrow">Shubha Vivaham</p>
          <p className="couple-names">
            {SITE_CONFIG.groomShort} <span>&amp;</span> {SITE_CONFIG.brideShort}
          </p>
          <p className="full-names">
            {SITE_CONFIG.groomFull} <span>&amp;</span> {SITE_CONFIG.brideFull}
          </p>
          <h1>Join Our Wedding Celebrations</h1>
          <p className="invite">{SITE_CONFIG.invitation}</p>
          <p className="closing">{SITE_CONFIG.closing}</p>
        </div>
      </section>

      <section className="section wrap" aria-labelledby="events-heading">
        <div className="section-head">
          <h2 id="events-heading" className="section-title">
            The Celebrations
          </h2>
          <Flourish />
          <p className="section-lead">
            Each gathering has its own response. Choose a celebration to tell us if you can come.
          </p>
        </div>
        <div className="event-grid">
          {SITE_CONFIG.events.map((event, index) => {
            const span = index === SITE_CONFIG.events.length - 1 ? " event-card--span" : "";
            return (
              <article key={event.id} className={`event-card event-card--${event.id}${span}`}>
                <div className="accent-bar" aria-hidden="true" />
                <div className="card-body">
                  <div className="motif">
                    <Motif id={event.id} />
                  </div>
                  <h2>{event.name}</h2>
                  <p className="desc">{event.description}</p>
                  <EventFacts event={event} />
                  <MealNote eventId={event.id} />
                  <p className="deadline">
                    Kindly respond by <Value>{event.rsvpDeadline}</Value>
                  </p>
                  <div className="card-actions">
                    <Link className={`btn btn--${event.id}`} to={`/rsvp/${event.id}`}>
                      RSVP for This Event
                      <span className="sr-only">: {event.name}</span>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
