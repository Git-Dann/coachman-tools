import { STEPS } from "@/content/steps";
import { STAGES } from "@/content/stages";
import { HANDOFF_STEP } from "@/content/people";

/**
 * The throttle model.
 *
 * One caravan in the middle, every job that touches it arranged around it, and
 * a dial for how many caravans a year the business takes on. Add volume and the
 * admin work grows in a straight line while the desk that absorbs it does not,
 * so the ring warms from green through amber to red.
 *
 * WHAT IS TRACEABLE, AND WHAT IS OURS
 *
 *   traceable  the sixteen steps, the twenty re-entry points and which step
 *              each one sits in, two people on the order desk, around two
 *              thousand units a year, and that it already crashes there
 *   ours       how many minutes a step takes per caravan
 *
 * Only four of the sixteen were discussed in enough detail to estimate
 * directly. The rest start from a rule stated on screen: a minute for the job,
 * plus two more for every re-entry point counted inside it. Every one of them
 * is adjustable, and the app says so wherever a number appears.
 */

/** One turn of the dial is another year's worth of their current volume. */
export const UNITS_PER_STEP = 2000;

/** Two people, and a working year of 1,600 hours each. */
export const DESK_PEOPLE = 2;
export const HOURS_PER_PERSON = 1600;

export interface Job {
  id: number;
  name: string;
  /** Re-entry points counted inside this step. Straight off the record. */
  duplication: number;
  /** Minutes per caravan. Our estimate, adjustable. */
  minutes: number;
  /** Runs on paper. */
  paper: boolean;
  /** Only exists to move paper, so it does not get rebuilt. */
  removed: boolean;
}

/** A minute for the job, plus two for every time the work is entered again. */
export function defaultMinutes(duplication: number): number {
  return 1 + duplication * 2;
}

export function todayJobs(): Job[] {
  return STEPS.map((s) => {
    const duplication = HANDOFF_STEP.filter((h) => h === s.n).length;
    return {
      id: s.n,
      name: short(s.t),
      duplication,
      minutes: defaultMinutes(duplication),
      paper: s.c.some(([, tone]) => tone === "p"),
      removed: !s.keep,
    };
  });
}

/** The proposed process: twelve stages, nothing entered twice. */
export function proposedJobs(): Job[] {
  return STAGES.map(([name], i) => ({
    id: i + 1,
    name,
    duplication: 0,
    minutes: 1,
    paper: false,
    removed: false,
  }));
}

export interface Load {
  units: number;
  /** Hours a year of order-desk work, across every job. */
  hours: number;
  /** Hours a year that exist only because the work is entered again. */
  duplicatedHours: number;
  /** What two people can actually absorb in a year. */
  capacity: number;
  /** Hours needed over hours available. Above 1 the business is throttled. */
  ratio: number;
  /** How many people it would take to do it at all. */
  peopleNeeded: number;
  /** Caravans a year that cannot get through the desk. */
  throttled: number;
}

export function load(jobs: Job[], units: number, people: number): Load {
  const minutes = jobs.reduce((t, j) => t + j.minutes, 0);
  const dupMinutes = jobs.reduce((t, j) => t + j.duplication * 2, 0);
  const hours = (minutes * units) / 60;
  const duplicatedHours = (dupMinutes * units) / 60;
  const capacity = people * HOURS_PER_PERSON;
  const ratio = capacity === 0 ? Infinity : hours / capacity;
  const perUnitHours = minutes / 60;
  const canDo = perUnitHours === 0 ? units : Math.floor(capacity / perUnitHours);
  return {
    units,
    hours,
    duplicatedHours,
    capacity,
    ratio,
    peopleNeeded: perUnitHours === 0 ? 0 : Math.ceil(hours / HOURS_PER_PERSON),
    throttled: Math.max(0, units - canDo),
  };
}

/**
 * Green through amber to red.
 *
 * The scale is anchored to what was actually said: at their current volume the
 * system already falls over, and double was described as the point it
 * collapses. So one turn of the dial is already warm, and two is red.
 */
export function heat(ratio: number): number {
  // Eased rather than linear, so every turn of the dial is a visible step
  // instead of saturating at red the moment the volume doubles.
  const t = Math.max(0, Math.min(1, ratio / 2.4));
  return Math.pow(t, 0.8);
}

/** A hex on the green to red ramp, for a heat of 0 to 1. */
export function heatColour(h: number): number {
  const stops: [number, [number, number, number]][] = [
    [0.0, [0x6f, 0xae, 0x7f]],
    [0.5, [0xd9, 0xa2, 0x4b]],
    [1.0, [0xe4, 0x59, 0x3c]],
  ];
  const t = Math.max(0, Math.min(1, h));
  let a = stops[0];
  let b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i][0] && t <= stops[i + 1][0]) {
      a = stops[i];
      b = stops[i + 1];
      break;
    }
  }
  const span = b[0] - a[0] || 1;
  const k = (t - a[0]) / span;
  const c = [0, 1, 2].map((i) => Math.round(a[1][i] + (b[1][i] - a[1][i]) * k));
  return (c[0] << 16) | (c[1] << 8) | c[2];
}

/**
 * What this level of load is called, in words.
 *
 * Kept strictly about hours. The system falling over is a separate problem from
 * the desk running out of time, and running the two together would overstate
 * both. At today's volume the hours are absorbable; it is the software that is
 * unstable. Past double, the hours stop adding up as well.
 */
export function verdict(ratio: number): { label: string; said: string } {
  if (ratio <= 0.35) {
    return {
      label: "Inside what the desk can absorb",
      said: "Below any volume that was discussed. Nothing was said about running the business here.",
    };
  }
  if (ratio <= 0.8) {
    return {
      label: "Over half of two people's year",
      said: "Roughly today. The hours can be absorbed, just about, but most of the desk's year goes on it. Separately, the system already crashes at this volume.",
    };
  }
  if (ratio <= 1.05) {
    return {
      label: "Almost the whole desk, on admin alone",
      said: "Nothing left for anything else, and no room for anyone to be off.",
    };
  }
  if (ratio <= 2.1) {
    return {
      label: "Throttled: more hours than the desk has",
      said: "Asked what would happen if orders doubled, the answer was that they would turn the business away, because the system would not cope.",
    };
  }
  return {
    label: "Past anything that was imagined",
    said: "Double the current intake was described as the point it collapses. Beyond that nobody had a view, because nobody expected to be there.",
  };
}

function short(t: string): string {
  const map: Record<string, string> = {
    "Set up the models": "Models",
    "Set up the options": "Options",
    "Create the batches": "Batches",
    "Allocate to dealers": "Allocate",
    "Print the works orders and take them to the factory": "Works order",
    "Barcodes and appliance tracking": "Barcodes",
    "Confirm build dates and work out delivery dates": "Dates",
    "The nightly build report and the delivery call": "Nightly report",
    "The weekly order bank to dealers": "Order bank",
    "Order acknowledgements to dealers": "Acknowledge",
    "Arrange the transport": "Transport",
    "Pre-delivery checks": "PDI checks",
    Invoice: "Invoice",
    "Send it to accounts and log the payment": "Ledger",
    "Email the invoices out to the dealers": "Email out",
    "Write it in the book": "The book",
  };
  return map[t] ?? t;
}

export const HUB_CAVEAT =
  "The sixteen jobs, the twenty re-entry points and the two people on the desk all come from the walkthrough. How many minutes a job takes is ours: a minute for the work, plus two for every re-entry point counted inside it. Only four of the sixteen were discussed in enough detail to estimate directly, so treat the shape as the finding and the minutes as a starting point to correct.";
