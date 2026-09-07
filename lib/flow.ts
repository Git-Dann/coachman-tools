import { STEPS } from "@/content/steps";
import { STAGES } from "@/content/stages";
import { HANDOFF_STEP } from "@/content/people";

/**
 * Run a season and watch where it jams.
 *
 * A single-server queue per station. A caravan occupies a station for as long
 * as that station costs, and anything arriving behind it waits. Queues build
 * wherever the cost is high, which is the whole point: you do not have to be
 * told where the bottleneck is, you watch it form.
 *
 * THE ONE MODELLED NUMBER is how long a station takes. It is set to the number
 * of re-entry points counted inside that step, plus one for the work itself.
 * Those counts come straight off the process record. The conversion from
 * "re-entry points" to "time" is ours, and the app says so on screen. Nobody
 * was timed on the day, so no station is claiming to know its real duration.
 */

export interface Station {
  id: number;
  label: string;
  short: string;
  /** Ticks a caravan occupies this station. */
  cost: number;
  /** Re-entry points counted inside it. Zero in the proposed process. */
  reEntry: number;
  /** Runs on paper, so the trail breaks here. */
  paper: boolean;
  /** Only exists to move paper. Gone in the proposed process. */
  removed: boolean;
}

export function stationsFor(mode: "today" | "proposed"): Station[] {
  if (mode === "proposed") {
    return STAGES.map(([name], i) => ({
      id: i + 1,
      label: name,
      short: name,
      // Nothing is re-entered, so every stage costs the work itself and no more.
      cost: 1,
      reEntry: 0,
      paper: false,
      removed: false,
    }));
  }
  return STEPS.map((s) => {
    const reEntry = HANDOFF_STEP.filter((h) => h === s.n).length;
    return {
      id: s.n,
      label: s.t,
      short: shorten(s.t),
      cost: 1 + reEntry,
      reEntry,
      paper: s.c.some(([, tone]) => tone === "p"),
      removed: !s.keep,
    };
  });
}

/** Station labels have to read at a glance on a canvas. */
function shorten(t: string): string {
  const map: Record<string, string> = {
    "Set up the models": "Models",
    "Set up the options": "Options",
    "Create the batches": "Batches",
    "Allocate to dealers": "Allocate",
    "Print the works orders and take them to the factory": "Works order",
    "Barcodes and appliance tracking": "Barcodes",
    "Confirm build dates and work out delivery dates": "Dates",
    "The nightly build report and the delivery call": "Nightly",
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

export interface Sim {
  stations: Station[];
  /** Stations a caravan left on this tick. Used to animate the hop. */
  justLeft: number[];
  /** Caravans waiting at each station. */
  queue: number[];
  /** Ticks left on the caravan currently being handled, or 0 for idle. */
  busy: number[];
  /** True where a caravan is in hand. */
  active: boolean[];
  /** The worst queue each station has ever reached. */
  peak: number[];
  shipped: number;
  released: number;
  tick: number;
  /** Caravan-ticks spent actually being worked on. */
  workTicks: number;
  /** Caravan-ticks spent sitting in a queue, doing nothing. */
  waitTicks: number;
  /** Waiting time accumulated at each station. Where the loss actually is. */
  waitAt: number[];
}

export function newSim(mode: "today" | "proposed"): Sim {
  const stations = stationsFor(mode);
  const n = stations.length;
  return {
    stations,
    justLeft: [],
    queue: new Array(n).fill(0),
    busy: new Array(n).fill(0),
    active: new Array(n).fill(false),
    peak: new Array(n).fill(0),
    shipped: 0,
    released: 0,
    tick: 0,
    workTicks: 0,
    waitTicks: 0,
    waitAt: new Array(n).fill(0),
  };
}

/**
 * One tick.
 *
 * Walked backwards so a caravan cannot skip two stations in a single tick,
 * which would quietly hide the queue we are trying to show.
 */
export function step(sim: Sim, releaseEvery: number): Sim {
  const n = sim.stations.length;
  const queue = [...sim.queue];
  const busy = [...sim.busy];
  const active = [...sim.active];
  const peak = [...sim.peak];
  const justLeft: number[] = [];
  const waitAt = [...sim.waitAt];
  /* Who was already queueing when the tick began, and who got pulled in. */
  const startQueue = [...sim.queue];
  const servedFrom = new Array(n).fill(0);
  let shipped = sim.shipped;
  let released = sim.released;

  let workTicks = sim.workTicks;
  let waitTicks = sim.waitTicks;

  for (let i = n - 1; i >= 0; i--) {
    if (active[i]) {
      busy[i] -= 1;
      if (busy[i] <= 0) {
        active[i] = false;
        justLeft.push(i);
        if (i === n - 1) shipped += 1;
        else queue[i + 1] += 1;
      }
    }
    if (!active[i] && queue[i] > 0) {
      queue[i] -= 1;
      // Only counts as "served from the queue" if it was already waiting.
      if (startQueue[i] > 0) servedFrom[i] = 1;
      active[i] = true;
      busy[i] = sim.stations[i].cost;
    }
  }

  /*
   * A caravan counts as waiting only if it was already queueing when the tick
   * began and still did not get picked up.
   *
   * The distinction matters. Simply counting queue lengths charges a caravan
   * for the single tick it spends being handed from one station to the next,
   * which is transit, not waste, and made a completely free-flowing process
   * report fifty per cent wasted. Measured this way a process with no
   * congestion correctly reports zero, and everything above zero is a caravan
   * that was ready to be worked on while the station was busy with another.
   */
  for (let i = 0; i < n; i++) {
    if (active[i]) workTicks += 1;
    const blocked = Math.max(0, startQueue[i] - servedFrom[i]);
    if (blocked > 0) {
      waitTicks += blocked;
      waitAt[i] += blocked;
    }
  }

  const tick = sim.tick + 1;
  if (releaseEvery > 0 && tick % releaseEvery === 0) {
    queue[0] += 1;
    released += 1;
  }

  for (let i = 0; i < n; i++) peak[i] = Math.max(peak[i], queue[i]);

  return {
    ...sim,
    queue,
    busy,
    active,
    peak,
    justLeft,
    shipped,
    released,
    tick,
    workTicks,
    waitTicks,
    waitAt,
  };
}

/** The station holding everything up right now. */
export function worst(sim: Sim): { station: Station; queue: number } | null {
  let idx = -1;
  let max = 0;
  for (let i = 0; i < sim.queue.length; i++) {
    if (sim.queue[i] > max) {
      max = sim.queue[i];
      idx = i;
    }
  }
  return idx < 0 ? null : { station: sim.stations[idx], queue: max };
}

/** Caravans released but not yet out of the door. */
export function inProgress(sim: Sim): number {
  return sim.released - sim.shipped;
}

/**
 * The share of caravan time that is spent waiting rather than being worked on.
 *
 * This is the number worth putting on screen. It is a ratio taken straight out
 * of the model, so it does not require anybody to have been timed: it says how
 * much of a caravan's life in the process is queueing behind something else.
 */
export function wastedShare(sim: Sim): number {
  const total = sim.workTicks + sim.waitTicks;
  return total === 0 ? 0 : sim.waitTicks / total;
}

/** The station that has swallowed the most waiting so far. */
export function worstByWait(sim: Sim): { station: Station; ticks: number } | null {
  let idx = -1;
  let max = 0;
  for (let i = 0; i < sim.waitAt.length; i++) {
    if (sim.waitAt[i] > max) {
      max = sim.waitAt[i];
      idx = i;
    }
  }
  return idx < 0 ? null : { station: sim.stations[idx], ticks: max };
}
