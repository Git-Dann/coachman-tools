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

/**
 * How the build is sequenced, in the terms of the thing being built.
 *
 * The sentiment came out of the room, said about a car. It is our line rather
 * than theirs, because putting words in somebody's mouth is not worth a
 * metaphor, and a caravan has a chassis of its own to talk about.
 */
export const QUOTE = {
  text: "Get the shell on the chassis first. One caravan, one record, one place to look it up. The trim and the intricate bits come after, once there is something to fit them to.",
  cite: "How we would sequence it",
};
