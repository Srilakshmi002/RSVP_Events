export function Motif({ id }) {
  if (id === "haldi") {
    return (
      <svg viewBox="0 0 86 78" aria-hidden="true">
        <g transform="translate(43,36)">
          <g className="sway">
            <g fill="#D86A16">
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                <ellipse key={deg} cx="0" cy="-18" rx="6" ry="13" transform={`rotate(${deg})`} />
              ))}
            </g>
            <g fill="#F0A202">
              {[15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345].map((deg) => (
                <ellipse key={deg} cx="0" cy="-11" rx="4.2" ry="9" transform={`rotate(${deg})`} />
              ))}
            </g>
            <circle r="7.5" fill="#F6D365" />
            <circle r="3.2" fill="#B85A12" />
          </g>
        </g>
      </svg>
    );
  }

  if (id === "pelli") {
    return (
      <svg viewBox="0 0 86 78" aria-hidden="true">
        <ellipse cx="28" cy="62" rx="16" ry="5" fill="#D7B56A" opacity="0.45" />
        <path d="M14 46c2 12 10 16 14 16s12-4 14-16c-4 6-10 8-14 8s-10-2-14-8z" fill="#C4922A" />
        <path d="M13 44c8-4 22-4 30 0-3 5-11 8-15 8s-12-3-15-8z" fill="#E6C36A" />
        <ellipse cx="28" cy="43" rx="8" ry="3.5" fill="#F4C430" />
        <ellipse cx="60" cy="62" rx="16" ry="5" fill="#E7B4A4" opacity="0.4" />
        <path d="M46 46c2 12 10 16 14 16s12-4 14-16c-4 6-10 8-14 8s-10-2-14-8z" fill="#A8483C" />
        <path d="M45 44c8-4 22-4 30 0-3 5-11 8-15 8s-12-3-15-8z" fill="#C4372F" />
        <circle cx="60" cy="42" r="5" fill="#E23B32" />
        <path d="M43 18c2 6 1 12 0 16-1-4-2-10 0-16z" fill="#F6E27A" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 86 78" aria-hidden="true">
      <g fill="#F4C9D4" stroke="#C4372F" strokeWidth="0.6">
        <path d="M43 34c6-10 14-12 16-4-6 2-12 4-16 4z" />
        <path d="M43 34c-6-10-14-12-16-4 6 2 12 4 16 4z" />
        <path d="M43 36c10-2 16 2 14 8-6-1-11-3-14-8z" />
        <path d="M43 36c-10-2-16 2-14 8 6-1 11-3 14-8z" />
      </g>
      <circle cx="43" cy="36" r="3.2" fill="#E2B23A" />
      <ellipse cx="43" cy="66" rx="18" ry="5" fill="#E7C27A" opacity="0.55" />
      <path d="M27 54c2 9 11 12 16 12s14-3 16-12c-5 5-11 7-16 7s-11-2-16-7z" fill="#C4922A" />
      <path d="M25 52c10-4 26-4 36 0-4 6-13 8-18 8s-14-2-18-8z" fill="#E0B04A" />
      <g className="flame">
        <path d="M43 50c3-8 2-16 0-24-2 8-3 16 0 24z" fill="#F6E27A" />
        <path d="M43 48c1.5-5 1-11 0-15-1 4-1.5 10 0 15z" fill="#E07A1F" />
      </g>
    </svg>
  );
}
