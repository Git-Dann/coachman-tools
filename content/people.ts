/**
 * Who holds what, and what stops when they are not there.
 *
 * PROVENANCE MATTERS HERE. The walkthrough named some people and described some
 * roles. It did not hand us an org chart. So every person and every assignment
 * below carries a `source`:
 *
 *   "stated"   said on the day, or in the notes taken with it
 *   "inferred" our reading of which role must be doing a step, from the process
 *
 * Anything marked inferred is shown on screen as needing confirmation. Nobody
 * gets a job title we invented and presented as fact.
 */

export type Source = "stated" | "inferred";

/** How well someone else can pick a step up. */
export type Cover = "full" | "partial" | "none";

export interface Person {
  id: string;
  /** Name where one was given, otherwise the role. */
  name: string;
  role: string;
  source: Source;
  /** What the day told us about them, verbatim in substance. */
  note: string;
  /** Whether they can get into the order system at all. */
  pixAccess: "edit" | "view" | "none";
  /** Set where the notes flag the name or role as needing checking. */
  check?: string;
}

export const PEOPLE: readonly Person[] = [
  {
    id: "sales-admin",
    name: "Sales admin",
    role: "The order desk",
    source: "stated",
    note: "The desk the whole walkthrough followed. Sets up models, options and batches, allocates to dealers, works out dates, retypes the nightly report, chases transport, and does the invoicing. It was put plainly on the day: she can never really go on holiday, and invoicing does not happen without her.",
    pixAccess: "edit",
    check:
      "Not named in the notes. A name, Paul, came up in connection with invoicing but the role was unclear.",
  },
  {
    id: "second-user",
    name: "Second system user",
    role: "The other order-system account",
    source: "stated",
    note: "Two people in the entire business can get into the order system. Both are on the same setup with a lot of overlap, each seeing menus and data that have nothing to do with their own role. Cover exists in principle, but training others has not stuck because nobody else does the work often enough to build confidence.",
    pixAccess: "edit",
  },
  {
    id: "helen",
    name: "Helen",
    role: "Factory side and the record",
    source: "stated",
    note: "Scans on the factory side. Holds the haulier details, the inspection details and the key numbers. Handwrites the daily book, which is the only record the business has going back more than three seasons.",
    pixAccess: "none",
  },
  {
    id: "production-manager",
    name: "Production manager",
    role: "The factory",
    source: "stated",
    note: "At the factory. The point of contact for works order queries, and confirms build dates back to the order desk.",
    pixAccess: "none",
    check: "Name heard as Jane.",
  },
  {
    id: "inspector",
    name: "Factory inspector",
    role: "Nightly build report",
    source: "stated",
    note: "Walks the floor every night with a clipboard and handwrites which units are complete and any faults. That sheet is scanned and emailed to the order desk to be read back in by hand.",
    pixAccess: "none",
  },
  {
    id: "accounts",
    name: "Accounts",
    role: "The ledger",
    source: "stated",
    note: "Receives the sales ledger update and logs the payment by hand at the other end. Also runs payroll.",
    pixAccess: "none",
  },
  {
    id: "alex",
    name: "Alex",
    role: "Works from a filtered view",
    source: "stated",
    note: "Deliberately kept off the main spreadsheet and given a separate one, because the main one carries dealer complaints and damage reports that are not his to see. That is a real requirement to keep, not an accident.",
    pixAccess: "none",
  },
  {
    id: "elliot",
    name: "Elliot",
    role: "Coachman side",
    source: "stated",
    note: "Raised the dealer portal need independently. Position on approach: get started, then meet to agree what is wanted.",
    pixAccess: "none",
  },
  {
    id: "reality",
    name: "Reality Solutions",
    role: "External IT and software",
    source: "stated",
    note: "Outside the business. Looks after the IT and the software, including the order system. Steve Shipley named as the person to speak to, Clive mentioned regarding how the platform is installed. When a fault has no explanation, it does not get resolved.",
    pixAccess: "edit",
  },
];

export interface Assignment {
  stepId: number;
  /** Who does this step today. */
  ownerId: string;
  /** Anyone else who could take it, and how well. */
  cover: { personId: string; level: Cover }[];
  source: Source;
  /** Why we say this person owns it. */
  because: string;
}

/**
 * The sixteen steps, mapped to whoever holds them.
 *
 * Steps 1 to 4, 7, 9, 10, 13, 14 and 15 are explicitly the order desk in the
 * walkthrough. The factory-side ones are explicit too. The cover levels come
 * straight from what was said about training not sticking.
 */
export const ASSIGNMENTS: readonly Assignment[] = [
  {
    stepId: 1,
    ownerId: "sales-admin",
    cover: [{ personId: "second-user", level: "partial" }],
    source: "stated",
    because: "Set up on the system at the start of the season, from the order desk.",
  },
  {
    stepId: 2,
    ownerId: "sales-admin",
    cover: [{ personId: "second-user", level: "partial" }],
    source: "stated",
    because: "Options carried forward on the system, from the order desk.",
  },
  {
    stepId: 3,
    ownerId: "sales-admin",
    cover: [{ personId: "second-user", level: "partial" }],
    source: "stated",
    because: "Batches produced by hand on the system.",
  },
  {
    stepId: 4,
    ownerId: "sales-admin",
    cover: [{ personId: "second-user", level: "partial" }],
    source: "stated",
    because: "Dealer orders typed in and allocated by hand.",
  },
  {
    stepId: 5,
    ownerId: "sales-admin",
    cover: [{ personId: "second-user", level: "partial" }],
    source: "stated",
    because:
      "Printed from the system and physically carried to the factory, so it starts at the order desk.",
  },
  {
    stepId: 6,
    ownerId: "helen",
    cover: [{ personId: "sales-admin", level: "partial" }],
    source: "stated",
    because:
      "Helen does the scanning on the factory side. The tracking codes then have to be keyed in at the desk before invoicing.",
  },
  {
    stepId: 7,
    ownerId: "sales-admin",
    cover: [{ personId: "production-manager", level: "partial" }],
    source: "stated",
    because:
      "The factory confirms build dates, but the estimate is worked out in someone's head at the desk and re-checked weekly.",
  },
  {
    stepId: 8,
    ownerId: "inspector",
    cover: [{ personId: "sales-admin", level: "partial" }],
    source: "stated",
    because:
      "The inspector handwrites it. The desk reads every line back in, so it takes two people to move one report.",
  },
  {
    stepId: 9,
    ownerId: "sales-admin",
    cover: [{ personId: "second-user", level: "partial" }],
    source: "stated",
    because: "Copied out of the system and emailed to each dealer.",
  },
  {
    stepId: 10,
    ownerId: "sales-admin",
    cover: [{ personId: "second-user", level: "partial" }],
    source: "stated",
    because:
      "Printed, ticked, scanned and emailed one dealer at a time. Already behind because there is no time for it.",
  },
  {
    stepId: 11,
    ownerId: "sales-admin",
    cover: [{ personId: "helen", level: "partial" }],
    source: "stated",
    because:
      "Arranged from the desk, but Helen holds the haulier details, the inspection details and the key numbers.",
  },
  {
    stepId: 12,
    ownerId: "inspector",
    cover: [{ personId: "production-manager", level: "full" }],
    source: "inferred",
    because:
      "A paper checklist done before the unit goes out. The walkthrough did not say who signs it, so this is our reading.",
  },
  {
    stepId: 13,
    ownerId: "sales-admin",
    cover: [],
    source: "stated",
    because:
      "The one that was named outright: invoicing does not happen without her, and attempts to train others have not stuck. No cover.",
  },
  {
    stepId: 14,
    ownerId: "sales-admin",
    cover: [{ personId: "accounts", level: "partial" }],
    source: "stated",
    because:
      "The ledger update is triggered by hand at the desk. Accounts log the payment at the other end.",
  },
  {
    stepId: 15,
    ownerId: "sales-admin",
    cover: [],
    source: "stated",
    because:
      "Saved to a desktop folder on one machine and attached to emails by hand. Tied to that desk and that machine.",
  },
  {
    stepId: 16,
    ownerId: "helen",
    cover: [],
    source: "stated",
    because:
      "Helen handwrites the book. Nobody else was described as doing it, and it is the only long-term record.",
  },
];

/**
 * Which of the twenty re-entry points sits inside which step.
 *
 * OUR MAPPING, not something said on the day. The twenty were counted straight
 * off the process, so each one belongs to a step, but the pairing is ours and
 * the app says so where it matters.
 */
export const HANDOFF_STEP: readonly number[] = [
  4, 4, 3, 5, 6, 6, 7, 8, 7, 9, 10, 11, 11, 12, 13, 13, 13, 13, 13, 15,
];

export const PEOPLE_CAVEAT =
  "Roles come from the walkthrough. Where the notes did not say who does something, it is marked as our reading and needs confirming. Nobody here has been given a job title we made up.";

export const ABSENCE_CAVEAT =
  "What stops is taken from the process itself: a step with no cover has nobody else described as able to do it. The knock-on load is a model, not a measurement, and it counts steps and re-entry points rather than hours, because nobody was timed on the day.";
