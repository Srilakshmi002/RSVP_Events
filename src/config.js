export const SITE_CONFIG = {
  groomShort: "Pradeep",
  brideShort: "Anusha",
  groomFull: "Pradeep Ajjampudi",
  brideFull: "Anusha Mandava",

  invitation:
    "With joyful hearts, our families welcome you to celebrate Pradeep and Anusha. We would be honored by your presence at these gatherings, and we invite you to share a separate response for each celebration you hope to attend.",

  closing: "With love from the Ajjampudi and Mandava families.",

  mealNote:
    "A vegetarian meal will be served. We look forward to celebrating with you!",

  events: [
    {
      id: "haldi",
      name: "Haldi",
      description:
        "A joyful turmeric ceremony to bless the couple with warmth, prosperity, and protection as the wedding celebrations begin.",
      date: "October 11, 2026",
      time: "10:30 AM",
      venue: "Our Home",
      address: "11305 Summer Rain Blvd, Aubrey, TX 76225",
      rsvpDeadline: "October 07, 2026",
      attendMessage:
        "We are so happy you will join the Haldi on October 11, 2026 at 10:30 AM. Your presence will brighten the turmeric ceremony, and a vegetarian meal will be served as we celebrate together.",
      declineMessage:
        "Thank you for telling us. You will be missed at the Haldi on October 11, 2026 at 10:30 AM, and we are grateful you took a moment to respond."
    },
    {
      id: "pelli",
      name: "Pelli Kuthuru & Pelli Koduku",
      description:
        "One combined celebration of the traditional Telugu ceremonies that prepare the bride and the groom.",
      date: "October 12, 2026",
      time: "5:00 PM",
      venue: "Our Home",
      address: "11305 Summer Rain Blvd, Aubrey, TX 76225",
      rsvpDeadline: "October 07, 2026",
      attendMessage:
        "We are delighted you will join Pelli Kuthuru & Pelli Koduku on October 12, 2026 at 5:00 PM. This is one combined ceremony, and a vegetarian meal will be served as both families celebrate together.",
      declineMessage:
        "Thank you for telling us. You will be missed at Pelli Kuthuru & Pelli Koduku on October 12, 2026 at 5:00 PM, and we are grateful you took a moment to respond."
    },
    {
      id: "vratham",
      name: "Sri Satyanarayana Swamy Vratham",
      description:
        "A serene puja invoking the blessings of Sri Satyanarayana Swamy for Pradeep, Anusha, and both families.",
      date: "October 15, 2026",
      time: "10:00 AM",
      venue: "Our Home",
      address: "11305 Summer Rain Blvd, Aubrey, TX 76225",
      rsvpDeadline: "October 07, 2026",
      attendMessage:
        "We are grateful you will join the Sri Satyanarayana Swamy Vratham on October 15, 2026 at 10:00 AM. Your presence will add to the devotion of the day, and a vegetarian meal will be served.",
      declineMessage:
        "Thank you for telling us. You will be missed at the Sri Satyanarayana Swamy Vratham on October 15, 2026 at 10:00 AM, and we are grateful you took a moment to respond."
    }
  ]
};

export function getEvent(id) {
  return SITE_CONFIG.events.find((event) => event.id === id);
}

export function isPlaceholder(value) {
  return /^\s*\[Add\b/i.test(String(value || ""));
}

export function whenLabel(event) {
  return `${event.date} at ${event.time}`;
}

export function shortNav(event) {
  if (event.id === "pelli") return "Pelli";
  if (event.id === "vratham") return "Vratham";
  return event.name;
}
