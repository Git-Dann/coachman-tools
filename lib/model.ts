import { ASSIGNMENTS, HANDOFF_STEP, PEOPLE, type Cover } from "@/content/people";
import { STEPS } from "@/content/steps";

/* ------------------------------------------------------------------ people */

export interface Load {
  personId: string;
  name: string;
  role: string;
  /** Steps they hold today. */
  steps: number[];
  /** Re-entry points inside those steps. */
  reEntry: number;
  /** Steps picked up because somebody else is away. */
  absorbed: number[];
  /** Re-entry points inside the absorbed steps. */
  absorbedReEntry: number;
  /** True when they are the one marked away. */
  away: boolean;
}

export interface Impact {
  loads: Load[];
  /** Steps with nobody described as able to do them. */
  stopped: number[];
  /** Steps that carry on, but slower, on partial cover. */
  slowed: number[];
  /** Everyone currently marked away. */
  awayIds: string[];
}

function reEntryIn(stepIds: number[]): number {
  return HANDOFF_STEP.filter((s) => stepIds.includes(s)).length;
}

/**
 * Work out what happens when a set of people are not there.
 *
 * A step whose owner is away moves to the best cover available. Full cover
 * moves it cleanly. Partial cover moves it but marks it slowed, which is what
 * the notes describe: others can do some of it, but not often enough to be
 * quick or confident. No cover means the step stops.
 */
export function absenceImpact(awayIds: string[]): Impact {
  const away = new Set(awayIds);
  const stopped: number[] = [];
  const slowed: number[] = [];

  const base = new Map<string, number[]>();
  const extra = new Map<string, number[]>();
  for (const p of PEOPLE) {
    base.set(p.id, []);
    extra.set(p.id, []);
  }

  const rank: Record<Cover, number> = { full: 2, partial: 1, none: 0 };

  for (const a of ASSIGNMENTS) {
    if (!away.has(a.ownerId)) {
      base.get(a.ownerId)?.push(a.stepId);
      continue;
    }
    // Owner is away. Find the best cover who is also present.
    const candidates = a.cover
      .filter((c) => !away.has(c.personId) && c.level !== "none")
      .sort((x, y) => rank[y.level] - rank[x.level]);

    const best = candidates[0];
    if (!best) {
      stopped.push(a.stepId);
      continue;
    }
    extra.get(best.personId)?.push(a.stepId);
    if (best.level === "partial") slowed.push(a.stepId);
  }

  const loads: Load[] = PEOPLE.map((p) => {
    const steps = base.get(p.id) ?? [];
    const absorbed = extra.get(p.id) ?? [];
    return {
      personId: p.id,
      name: p.name,
      role: p.role,
      steps,
      reEntry: reEntryIn(steps),
      absorbed,
      absorbedReEntry: reEntryIn(absorbed),
      away: away.has(p.id),
    };
  })
    // Only show people who actually carry process steps.
    .filter((l) => l.steps.length + l.absorbed.length > 0 || l.away);

  loads.sort(
    (a, b) =>
      b.steps.length + b.absorbed.length - (a.steps.length + a.absorbed.length),
  );

  return { loads, stopped, slowed, awayIds };
}

/** Steps nobody can cover, before anyone is away. The standing exposure. */
export const NO_COVER_STEPS = ASSIGNMENTS.filter((a) => a.cover.length === 0).map(
  (a) => a.stepId,
);

export function stepTitle(id: number): string {
  return STEPS.find((s) => s.n === id)?.t ?? `Step ${id}`;
}

/* ---------------------------------------------------------------- capacity */

/**
 * The two capacities, and which one binds.
 *
 * The factory scales with lines. The order desk does not: it is two people and
 * a system that already falls over at today's volume. That gap is the whole
 * argument, and it is why adding build capacity on its own does nothing.
 */
export interface Capacity {
  demand: number;
  factory: number;
  admin: number;
  throughput: number;
  /** Orders that would have to be turned away. */
  turnedAway: number;
  /** Which capacity is the binding constraint. */
  binding: "factory" | "admin" | "none";
  /** 0 to 1, how far past its own ceiling the order desk is being pushed. */
  strain: number;
}

/** Their current volume, and the only operating point we were given. */
export const BASE_UNITS = 2000;
/** One line at today's output. Adding lines multiplies build capacity. */
export const UNITS_PER_LINE = 2000;

export function capacity(
  demand: number,
  lines: number,
  adminHands: number,
): Capacity {
  const factory = UNITS_PER_LINE * lines;
  // Two people is today's setup, and today's setup already crashes at 2,000.
  const admin = BASE_UNITS * (adminHands / 2);
  const throughput = Math.min(demand, factory, admin);
  const binding =
    throughput === demand
      ? "none"
      : admin <= factory
        ? "admin"
        : "factory";
  return {
    demand,
    factory,
    admin,
    throughput,
    turnedAway: Math.max(0, demand - throughput),
    strain: admin > 0 ? demand / admin : 0,
    binding,
  };
}

/** Five steps of strain, single hue, luminance monotonic. */
export const STRAIN_RAMP = [
  "#2f1d1c",
  "#552923",
  "#81382b",
  "#ac4632",
  "#d9553a",
] as const;

export function strainStep(strain: number): number {
  if (strain <= 0.5) return 0;
  if (strain <= 0.85) return 1;
  if (strain <= 1.0) return 2;
  if (strain <= 1.6) return 3;
  return 4;
}

/**
 * What was actually said, at each level of strain. Not a measurement, and the
 * app says so. Below and at today's volume it already crashes, and double was
 * described directly as collapse.
 */
export function strainVerdict(strain: number): {
  label: string;
  said: string;
  tone: "moss" | "brass" | "flag";
} {
  if (strain < 0.6)
    return {
      label: "Below anything discussed",
      said: "Nothing was said about running below current volume. It was never on the table.",
      tone: "moss",
    };
  if (strain <= 1.05)
    return {
      label: "Already crashing",
      said: "This is today. The system falls over at this volume: adding chassis numbers on its own can bring it down, and copy and paste is unreliable enough that things get counted by hand to avoid triggering it.",
      tone: "brass",
    };
  if (strain <= 2.05)
    return {
      label: "Work gets turned away",
      said: "Asked what would happen if orders doubled next year, the answer was that they would turn the business away, because the system would not cope.",
      tone: "flag",
    };
  return {
    label: "Past stated collapse",
    said: "Double the current intake was described directly as the point the system collapses. Past that, nothing was discussed, because nobody imagined it.",
    tone: "flag",
  };
}

/** Files saved to a desktop folder and never removed. */
export function filesPiled(units: number, years: number): number {
  return units * 2 * years + 250 * years;
}

/* ------------------------------------------------------------- headlines */

/**
 * Figures quoted in slide copy are derived here, never typed into the copy.
 *
 * An earlier draft said "thirteen of the sixteen steps" while the data said
 * twelve. Deriving it means the sentence and the picture cannot disagree.
 */
export const BASELINE = absenceImpact([]);

/** The desk carrying the most of the process. */
export const HEAVIEST = BASELINE.loads[0];

export const TOTAL_STEPS = 16;

const WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
  "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
  "sixteen", "seventeen", "eighteen", "nineteen", "twenty",
];

/** Small numbers read better as words in a headline. */
export function word(n: number): string {
  return WORDS[n] ?? String(n);
}
