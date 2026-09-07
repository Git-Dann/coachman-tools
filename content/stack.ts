import type { StackRow } from "./types";

/** What it runs on. Nothing unusual. */
export const STACK: readonly StackRow[] = [
  [
    "Database",
    "PostgreSQL, managed, one per client",
    "Boring, proven, handles far more than will ever be needed. Managed so backups and recovery are not our problem.",
  ],
  [
    "Language",
    "TypeScript, one repository",
    "Same language front and back. One place to change a business rule.",
  ],
  [
    "Structure",
    "Business rules kept separate from anything web-related",
    "So they can be tested properly and reused across both apps.",
  ],
  [
    "Apps",
    "Two Next.js applications, one design system",
    "The dealer portal will diverge from the internal app. Forcing both through one set of pages gets messy.",
  ],
  [
    "Background work",
    "A job runner on the same database",
    "Nightly imports, emails, report building. No extra infrastructure until something forces it.",
  ],
  [
    "Files",
    "Cloud object storage, separated per client",
    "Scans and photos will take far more space than the data. Cheap and effectively unlimited.",
  ],
  [
    "Logins",
    "Bought in, not built",
    "Business customers ask for single sign-on within a couple of years. Building that is a poor use of time.",
  ],
];

/** Headroom, since it comes up. */
export const HEADROOM: readonly (readonly [
  volume: string,
  events: string,
  needs: string,
])[] = [
  ["Today, 2,000/yr", "~2 million", "Nothing. A small managed instance."],
  ["Ten times", "~20 million", "Still nothing. No design changes."],
  [
    "A hundred times",
    "~200 million",
    "Split the history by year. Add a read replica for reporting.",
  ],
];
