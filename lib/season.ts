import { stationsFor, type Station } from "./flow";

/**
 * Run a season, one caravan at a time.
 *
 * The old model tracked totals: how many were queued at each station, how many
 * caravan-ticks had been spent working or waiting. That is enough to print a
 * percentage, and it was the reason the slide never explained itself. You were
 * shown a number and asked to believe it.
 *
 * This tracks each caravan separately and keeps a tick-by-tick record of what
 * it was doing, so the percentage is not a claim, it is the red in a picture
 * you can count. Every caravan is a row and every tick is a cell: working, or
 * waiting behind something else.
 *
 * A station handles one caravan at a time and holds it for as long as that
 * station costs. Anything arriving behind it queues. That is the entire model.
 *
 * THE ONE MODELLED NUMBER is still how long a station takes: the re-entry
 * points counted inside that step, plus one for the work itself. The counts are
 * off the process record; turning "re-entry points" into "time" is ours, and
 * the app says so on screen. Nobody was timed on the day.
 */

export type Doing = "work" | "wait";

export interface Unit {
  id: number;
  /** Station index. -1 before release, stations.length once out of the door. */
  at: number;
  /** The tick it was released on, so rows can be drawn against the clock. */
  from: number;
  /** What it was doing on each tick since release, oldest first. */
  log: { station: number; doing: Doing }[];
}

export interface Season {
  stations: Station[];
  units: Unit[];
  /** Queues per station, and the one caravan each is holding. */
  queues: number[][];
  serving: (number | null)[];
  left: number[];
  tick: number;
  shipped: number;
  released: number;
  /** Caravan-ticks, counted off the rows rather than tallied separately. */
  workTicks: number;
  waitTicks: number;
  waitAt: number[];
}

export function newSeason(mode: "today" | "proposed"): Season {
  const stations = stationsFor(mode);
  const n = stations.length;
  return {
    stations,
    units: [],
    queues: Array.from({ length: n }, () => []),
    serving: new Array(n).fill(null),
    left: new Array(n).fill(0),
    tick: 0,
    shipped: 0,
    released: 0,
    workTicks: 0,
    waitTicks: 0,
    waitAt: new Array(n).fill(0),
  };
}

/** How many caravans a season runs before it stops releasing more. */
export const SEASON_UNITS = 22;

/**
 * One tick.
 *
 * Finishing is walked backwards through the line so a caravan cannot clear two
 * stations in a single tick, which would hide the queue this exists to show.
 */
export function advance(prev: Season, releaseEvery: number): Season {
  const n = prev.stations.length;
  const s: Season = {
    ...prev,
    units: prev.units.map((u) => ({ ...u, log: u.log })),
    queues: prev.queues.map((q) => [...q]),
    serving: [...prev.serving],
    left: [...prev.left],
    waitAt: [...prev.waitAt],
    tick: prev.tick + 1,
  };
  const byId = new Map(s.units.map((u) => [u.id, u]));

  /* --- finish, from the far end back --------------------------------- */
  for (let i = n - 1; i >= 0; i--) {
    const id = s.serving[i];
    if (id === null) continue;
    s.left[i] -= 1;
    if (s.left[i] > 0) continue;
    s.serving[i] = null;
    const u = byId.get(id)!;
    if (i + 1 >= n) {
      u.at = n;
      s.shipped += 1;
    } else {
      u.at = i + 1;
      s.queues[i + 1].push(id);
    }
  }

  /* --- release ------------------------------------------------------- */
  if (
    releaseEvery > 0 &&
    s.released < SEASON_UNITS &&
    s.tick % releaseEvery === 1
  ) {
    const u: Unit = { id: s.released, at: 0, from: s.tick, log: [] };
    s.units = [...s.units, u];
    byId.set(u.id, u);
    s.queues[0].push(u.id);
    s.released += 1;
  }

  /* --- start whatever a free station can take ------------------------ */
  for (let i = 0; i < n; i++) {
    if (s.serving[i] !== null) continue;
    const id = s.queues[i].shift();
    if (id === undefined) continue;
    s.serving[i] = id;
    s.left[i] = Math.max(1, s.stations[i].cost);
  }

  /* --- write down what everybody did -------------------------------- */
  for (const u of s.units) {
    if (u.at < 0 || u.at >= n) continue;
    const doing: Doing = s.serving[u.at] === u.id ? "work" : "wait";
    u.log = [...u.log, { station: u.at, doing }];
    if (doing === "work") s.workTicks += 1;
    else {
      s.waitTicks += 1;
      s.waitAt[u.at] += 1;
    }
  }

  return s;
}

/** True once every caravan released is out of the door. */
export function finished(s: Season): boolean {
  return s.released >= SEASON_UNITS && s.shipped >= SEASON_UNITS;
}

/**
 * The share of a caravan's life in the process that is spent waiting.
 *
 * It is the red share of the picture, counted off the same rows the picture is
 * drawn from, so there is nothing to take on trust.
 */
export function wastedShare(s: Season): number {
  const total = s.workTicks + s.waitTicks;
  return total === 0 ? 0 : s.waitTicks / total;
}

/** The station that has swallowed the most waiting. */
export function worstStation(
  s: Season,
): { station: Station; ticks: number } | null {
  let idx = -1;
  let max = 0;
  for (let i = 0; i < s.waitAt.length; i++) {
    if (s.waitAt[i] > max) {
      max = s.waitAt[i];
      idx = i;
    }
  }
  return idx < 0 ? null : { station: s.stations[idx], ticks: max };
}

/** Caravans released but not yet out of the door. */
export function inProgress(s: Season): number {
  return s.released - s.shipped;
}
