/**
 * Types for the Coachman content set.
 *
 * Every string and number on screen comes from the modules in this folder.
 * Nothing is hardcoded in the components. This is a Coachman-specific build,
 * but keeping the content separate means the next client is a data file rather
 * than a rebuild.
 */

/**
 * Chip tone on a step.
 *   s  the current system
 *   r  retyping, a re-entry point
 *   p  paper
 *   "" neither, just where it lives
 */
export type ChipTone = "s" | "r" | "p" | "";

export type Chip = readonly [label: string, tone: ChipTone];

export interface Step {
  /** Step number, 1 to 16. */
  n: number;
  /** Title. */
  t: string;
  /** Where it happens. The system's own words. */
  w: string;
  /** What actually happens. */
  d: string;
  /** Chips marking paper, retyping, or the current system. */
  c: readonly Chip[];
  /** 1 if the step survives into the proposed process, 0 if it disappears. */
  keep: 0 | 1;
  /** What replaces it, or what changes about it. */
  why?: string;
}

/** [name, meaning] */
export type Stage = readonly [name: string, meaning: string];

/** [title, detail] */
export type Handoff = readonly [title: string, detail: string];

/** [headline, tag, detail, consequence] */
export type Risk = readonly [
  headline: string,
  tag: string,
  detail: string,
  consequence: string,
];

/** [name, tag, detail, consequence] */
export type Fault = readonly [
  name: string,
  tag: string,
  detail: string,
  consequence: string,
];

/** [name, why it applies to any manufacturer like this] */
export type Entity = readonly [name: string, why: string];

/** [part, choice, why] */
export type StackRow = readonly [part: string, choice: string, why: string];

/** [stage, what happens, lives in, handled by, re-entry points] */
export type VanStage = readonly [
  stage: string,
  detail: string,
  livesIn: string,
  handledBy: string,
  reEntry: string,
];
