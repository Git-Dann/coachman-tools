/**
 * The two interactive models on the Leadership view.
 *
 * Both use only volumes given on the day. Where something is an estimate it
 * says so on screen, and the caveats are kept as written. Neither model claims
 * to know where the current system actually fails, because nobody does.
 */

/* --------------------------------------------------------- breaking point */

export const BP_DEFAULTS = { volume: 2000, years: 5 };

export const BP_CONTROLS = {
  volume: {
    key: "volume" as const,
    label: "Orders a year",
    min: 1000,
    max: 6000,
    step: 250,
  },
  years: {
    key: "years" as const,
    label: "Years from now",
    min: 1,
    max: 15,
    step: 1,
  },
};

export type Tone = "ok" | "warn" | "bad";

export interface Verdict {
  tone: Tone;
  pill: string;
  /** Note, split so the emphasised sentence keeps its weight. */
  note: string;
  emphasis?: string;
}

/** Ceiling one: the order system. */
export const ORDER_CEILING = {
  title: "Ceiling one: the order system",
  /** Widths are the zones drawn on the gauge, in per cent. */
  zones: [
    { width: 20, tone: "a" as const, label: "Today, with crashes" },
    { width: 40, tone: "r" as const, label: "Work gets turned away", dim: true },
    { width: 40, tone: "r" as const, label: "Stated collapse" },
  ],
};

export function orderVerdict(volume: number): Verdict {
  if (volume <= 2000) {
    return {
      tone: "warn",
      pill: "Already crashing",
      note: "At today's volume the system already falls over. Adding chassis numbers on its own can bring it down, and copy and paste is unreliable enough that things get counted by hand to avoid triggering it.",
      emphasis: "This is the ceiling being touched now, not a future problem.",
    };
  }
  if (volume <= 4000) {
    return {
      tone: "bad",
      pill: "Past what would be accepted",
      note: "Asked what would happen at this kind of volume, the answer was that the work would be turned away.",
      emphasis:
        "The constraint is not the factory. It is the admin system behind it.",
    };
  }
  return {
    tone: "bad",
    pill: "Stated collapse",
    note: "Double the current intake was described directly as the point the system collapses.",
    emphasis:
      "At this volume there is no version of the current setup that copes.",
  };
}

/** Ceiling two: the machines. */
export const MACHINE_CEILING = {
  title: "Ceiling two: the machines",
  zones: [
    { width: 16, tone: "g" as const, label: "Coping" },
    { width: 34, tone: "a" as const, label: "Slowing" },
    { width: 50, tone: "r" as const, label: "Hardware limits the work" },
  ],
};

export function machineVerdict(files: number): Verdict {
  if (files < 10000) {
    return {
      tone: "ok",
      pill: "Coping",
      note: "Manageable for now, but nothing ever gets removed, so this only travels in one direction.",
    };
  }
  if (files < 30000) {
    return {
      tone: "warn",
      pill: "Slowing down",
      note: "Already the reported experience: years of files in desktop folders, and the machines are slower for it.",
      emphasis:
        "Archiving them and working in a browser would make the hardware feel new without buying any.",
    };
  }
  return {
    tone: "bad",
    pill: "The machine is the bottleneck",
    note: "At this point the hardware limits the work regardless of what the software does.",
    emphasis:
      "Every invoice and acknowledgement is still being saved to a folder by hand and never leaves.",
  };
}

/** Derived figures. Kept as functions so nothing is stored pre-calculated. */
export function markerPosition(volume: number): number {
  return clamp(((volume - 1000) / 5000) * 100);
}

export function filesPiled(volume: number, years: number): number {
  return volume * 2 * years + 250 * years;
}

export function filesMarkerPosition(files: number): number {
  return clamp((files / 60000) * 100);
}

export function gigabytes(files: number): number {
  return (files * 0.4) / 1024;
}

export function platformRows(volume: number, years: number): number {
  return volume * 100 * years;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}

export const BP_OUT = {
  files: { label: "Files piled up locally", unit: (gb: string) => `about ${gb} GB` },
  historyOld: {
    label: "History the current system keeps",
    value: "3",
    unit: "seasons, then gone",
  },
  rows: { label: "Records on the new platform", unit: "comfortable, no changes" },
  historyNew: {
    label: "History the new platform keeps",
    value: "All",
    unit: "of it, permanently",
  },
};

export const BP_CAVEAT =
  "The order volume zones come from what was said on the day, not from a measurement: crashes happen at current volume, and double the intake was described as collapse. The exact failure point is unknown and would need testing. File counts are derived from around two saved documents per unit plus a daily report, at an assumed 400KB average, so treat the gigabytes as an estimate and the direction as the point. Platform records assume roughly a hundred logged events across a unit's life.";

/* ------------------------------------------------------------ impact model */

/** Volumes given on the day. Not adjustable, because they are theirs. */
export const VOLUMES = { batches: 17, units: 2000, workingDays: 250 };

export interface ImpactRow {
  key: string;
  label: string;
  /** How the count is arrived at, shown under the label. */
  basis: (v: typeof VOLUMES, fmt: (n: number) => string) => string;
  /** How many times a year it happens. */
  count: (v: typeof VOLUMES) => number;
  /** Minutes each. Adjustable. */
  defaultMinutes: number;
  maxMinutes: number;
}

export const IMPACT_ROWS: readonly ImpactRow[] = [
  {
    key: "dates",
    label: "Delivery dates typed into each dealer record",
    basis: (v) => `17 entries per batch × ${v.batches} batches`,
    count: (v) => 17 * v.batches,
    defaultMinutes: 2,
    maxMinutes: 10,
  },
  {
    key: "invoice",
    label: "Invoice details written on by hand",
    basis: (v, fmt) =>
      `Price, levy, options, code and address × ${fmt(v.units)} units`,
    count: (v) => v.units,
    defaultMinutes: 4,
    maxMinutes: 15,
  },
  {
    key: "checklist",
    label: "Paper pre-delivery checklist",
    basis: (v, fmt) => `2 pages × ${fmt(v.units)} units`,
    count: (v) => v.units,
    defaultMinutes: 3,
    maxMinutes: 15,
  },
  {
    key: "retype",
    label: "Nightly build report retyped from handwriting",
    basis: (v) => `Once a day × ${v.workingDays} working days`,
    count: (v) => v.workingDays,
    defaultMinutes: 25,
    maxMinutes: 90,
  },
];

/** One person is taken as 1,600 working hours a year. */
export const HOURS_PER_PERSON = 1600;

export const IMPACT_OUT = {
  hours: "Hours a year",
  share: "As a share of one person",
  theirs: "Their own estimate",
  theirsValue: "20%",
  eachSuffix: "min each",
  perYearSuffix: "hrs/yr",
  minutesLabel: (task: string) => `Minutes for ${task}`,
};

export const IMPACT_CAVEAT =
  "Volumes are the ones given on the day: around 2,000 units a year, seventeen batch entries in the example shown, four thousand checklist pages. The minutes per task are estimates for you to correct, not figures anyone has measured. One person is taken as 1,600 working hours a year. Their own estimate of what the first three wish-list items would give back was around 20%, which is shown for comparison rather than derived from the sliders.";
