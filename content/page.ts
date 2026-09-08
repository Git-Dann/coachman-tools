import { TECH } from "./copy";

/**
 * The one-page site's own copy.
 *
 * Everything here was already said somewhere in the deck this replaced; it is
 * gathered rather than written, so the page and the record cannot drift apart.
 */

/** The three decisions, flattened to a heading and one paragraph each. */
export const DECISIONS = TECH.decisions.rows.map((r) => ({
  t: r.t,
  d: r.p[0],
}));

/** What we need from Coachman before the first migration. */
export const ASKS: readonly { t: string; d: string }[] = [
  {
    t: "The pack",
    d: "Screens, the reports and spreadsheets in use, example documents.",
  },
  {
    t: "Access, and a copy",
    d: "The current system, plus a copy so nothing is ever tested on live dealer data.",
  },
  {
    t: "The calendar",
    d: "Build times per model, the working week, this season's shutdown dates.",
  },
  {
    t: "The accounts version",
    d: "Which one is in use. It is the only permanent integration.",
  },
  { t: "A decision", d: "The 2027 season as the changeover." },
];

/** Said in the room, and the reason the plan is shaped the way it is. */
export const QUOTE = {
  text: "We are building a car. Get the shell in first, then the suspension and the intricate bits come later.",
  cite: "Said in the room",
};
