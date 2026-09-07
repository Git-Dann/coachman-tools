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
}

export function newSim(mode: "today" | "proposed"): Sim {
  const stations = stationsFor(mode);
  const n = stations.length;
  return {
    stations,
    queue: new Array(n).fill(0),
    busy: new Array(n).fill(0),
    active: new Array(n).fill(false),
    peak: new Array(n).fill(0),
    shipped: 0,
    released: 0,
    tick: 0,
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
  let shipped = sim.shipped;
  let released = sim.released;

  for (let i = n - 1; i >= 0; i--) {
    if (active[i]) {
      busy[i] -= 1;
      if (busy[i] <= 0) {
        active[i] = false;
        if (i === n - 1) shipped += 1;
        else queue[i + 1] += 1;
      }
    }
    if (!active[i] && queue[i] > 0) {
      queue[i] -= 1;
      active[i] = true;
      busy[i] = sim.stations[i].cost;
    }
  }

  const tick = sim.tick + 1;
  if (releaseEvery > 0 && tick % releaseEvery === 0) {
    queue[0] += 1;
    released += 1;
  }

  for (let i = 0; i < n; i++) peak[i] = Math.max(peak[i], queue[i]);

  return { ...sim, queue, busy, active, peak, shipped, released, tick };
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
