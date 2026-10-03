import { Link, NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import { useEffect } from "react";
import { shortNav, SITE_CONFIG } from "../config.js";

const THEME_COLORS = {
  home: "#FBF6EE",
  haldi: "#FBF6EA",
  pelli: "#FBF4EC",
  vratham: "#F7F3EA"
};

function themeFromPath(pathname) {
  const match = pathname.match(/^\/rsvp\/(haldi|pelli|vratham)/);
  return match ? match[1] : "home";
}

export function Layout() {
  const location = useLocation();
  const theme = themeFromPath(location.pathname);
  const showBack = location.pathname !== "/";

  useEffect(() => {
    document.body.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", THEME_COLORS[theme] || THEME_COLORS.home);
  }, [theme]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div id="app">
      <header className="topbar">
        <div className="wrap topbar-inner">
          <Link className="brand" to="/">
            {SITE_CONFIG.groomShort} <span>&amp;</span> {SITE_CONFIG.brideShort}
          </Link>
          {showBack ? (
            <div className="topbar-back">
              <Link className="back-link" to="/">
                All events
              </Link>
            </div>
          ) : null}
          <nav aria-label="Celebrations">
            {SITE_CONFIG.events.map((event) => (
              <NavLink
                key={event.id}
                to={`/rsvp/${event.id}`}
                end={false}
              >
                {shortNav(event)}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <div className="toranam" aria-hidden="true">
        <img src="/art/toranam.png" alt="" />
      </div>
      <Outlet />
      <div className="footer-decor" aria-hidden="true">
        <img src="/art/footer-decor.png" alt="" />
      </div>
      <footer className="site-footer wrap">
        <p>{SITE_CONFIG.closing}</p>
      </footer>
    </div>
  );
}

export function useEventParam() {
  const { eventId } = useParams();
  return eventId;
}
