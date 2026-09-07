import type { Entity } from "./types";

/** What the data hangs off. The unit is the centre of everything. */
export const ENTITIES: readonly Entity[] = [
  [
    "Season",
    "The business runs in seasons, not calendar years. Models, options, prices and dealer commitments all reset. Most off-the-shelf systems handle this badly, which is part of why nobody has served this market properly.",
  ],
  [
    "Model version",
    "A product specification belonging to a season, carried forward with changes.",
  ],
  [
    "Options",
    "A priced catalogue, carried forward each season, attached to models.",
  ],
  [
    "Batch",
    "A production group with a quantity and a slot, created before anything is promised to a customer. Units move between batches.",
  ],
  [
    "Unit",
    "The individual physical item with a serial number. The backbone of the whole system.",
  ],
  [
    "Dealer, branch, allocation",
    "A quantity a dealer commits to for a season, drawn down over time. Not the same as an order.",
  ],
  [
    "Fitted component",
    "Serial-numbered parts inside the unit. Warranty and recalls depend on it.",
  ],
  ["Dispatch", "Where it went, who moved it, when it arrived."],
  ["Document", "Scans, certificates and photos, attached to any of the above."],
];
