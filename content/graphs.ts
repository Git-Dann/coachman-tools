import { PEOPLE, ASSIGNMENTS, HANDOFF_STEP } from "./people";
import { STEPS } from "./steps";
import { SYSTEMS } from "./systems";
import type { Graph, Link3D, Node3D } from "@/lib/graph3d";
import { fibonacciSphere, helix } from "@/lib/graph3d";
import type { Impact } from "@/lib/model";

export type MapMode = "people" | "flow" | "unit";

export const MAP_MODES: { id: MapMode; name: string; question: string }[] = [
  {
    id: "people",
    name: "The people",
    question: "Who holds the work, and what happens when they are not there?",
  },
  {
    id: "flow",
    name: "The flow",
    question: "Where does the digital trail stop and start again?",
  },
  {
    id: "unit",
    name: "One caravan",
    question: "Where does one caravan actually live?",
  },
];

/* ----------------------------------------------------------- the people */

/**
 * People sized by how many of the sixteen steps they hold, linked to whoever
 * could cover them. Size is load, colour is status. No hue is used to say
 * "this is a different person", because that would need nine distinguishable
 * hues and the palette does not have them.
 */
export function peopleGraph(impact: Impact): Graph {
  const held = new Map<string, number>();
  const absorbed = new Map<string, number>();
  for (const l of impact.loads) {
    held.set(l.personId, l.steps.length);
    absorbed.set(l.personId, l.absorbed.length);
  }

  // Anyone who owns a step, is named as cover for one, or is marked away.
  // Cover-only people matter: without them the threads have nothing to join.
  const involved = new Set<string>();
  for (const a of ASSIGNMENTS) {
    involved.add(a.ownerId);
    for (const c of a.cover) involved.add(c.personId);
  }
  const shown = PEOPLE.filter(
    (p) => involved.has(p.id) || impact.awayIds.includes(p.id),
  );

  const max = Math.max(
    1,
    ...shown.map((p) => (held.get(p.id) ?? 0) + (absorbed.get(p.id) ?? 0)),
  );

  const nodes: Node3D[] = shown.map((p, i) => {
    const own = held.get(p.id) ?? 0;
    const extra = absorbed.get(p.id) ?? 0;
    const total = own + extra;
    const away = impact.awayIds.includes(p.id);
    // No cover anywhere for something they hold is the thing worth seeing.
    const uncovered = ASSIGNMENTS.some(
      (a) => a.ownerId === p.id && a.cover.length === 0,
    );
    const [x, y, z] = fibonacciSphere(i, shown.length);
    return {
      id: p.id,
      label: p.name,
      sub: `${total} of 16 steps${extra ? `, ${extra} picked up` : ""}`,
      // Pull the heaviest holder towards the middle. Load reads as gravity.
      x: x * (1 - (total / max) * 0.45),
      y: y * (1 - (total / max) * 0.45),
      z: z * (1 - (total / max) * 0.45),
      size: total / max,
      tone: away ? "muted" : extra > 0 ? "flag" : uncovered ? "brass" : "steel",
      kind: "person",
      faded: away,
      // Always label the heaviest desk, anyone picking work up, and whoever
      // is missing: the gap is the point of the picture.
      pinned: away || extra > 0 || total === max,
    };
  });

  const ids = new Set(nodes.map((n) => n.id));
  const seen = new Set<string>();
  const links: Link3D[] = [];
  for (const a of ASSIGNMENTS) {
    for (const c of a.cover) {
      if (!ids.has(a.ownerId) || !ids.has(c.personId)) continue;
      const key = [a.ownerId, c.personId].sort().join(">");
      if (seen.has(key)) continue;
      seen.add(key);
      links.push({
        from: a.ownerId,
        to: c.personId,
        // A partial cover is a thin thread, not a safety net.
        broken: c.level === "partial",
        active:
          impact.awayIds.includes(a.ownerId) && !impact.awayIds.includes(c.personId),
      });
    }
  }

  return {
    nodes,
    links,
    legend: [
      { tone: "steel", label: "Holds work, has some cover" },
      { tone: "brass", label: "Holds something nobody else can do" },
      { tone: "flag", label: "Picking up someone else's work" },
      { tone: "muted", label: "Away" },
    ],
    caption:
      "Bigger means more of the sixteen steps. A dashed thread is partial cover: somebody could do it, but not often enough to be quick.",
  };
}

/* ------------------------------------------------------------- the flow */

/**
 * The sixteen steps as a chain. Where a step runs on paper, the link into it is
 * drawn broken, because that is literally where the digital trail stops.
 */
export function flowGraph(selectedStep: number | null): Graph {
  const nodes: Node3D[] = STEPS.map((s, i) => {
    const [x, y, z] = helix(i, STEPS.length);
    const re = HANDOFF_STEP.filter((h) => h === s.n).length;
    const paper = s.c.some(([, tone]) => tone === "p");
    return {
      id: `step-${s.n}`,
      label: `${s.n < 10 ? "0" : ""}${s.n}`,
      sub: s.t,
      x,
      y,
      z,
      size: Math.min(1, re / 5),
      tone: !s.keep ? "flag" : paper ? "brass" : "steel",
      kind: "step",
      pinned: selectedStep === s.n,
    };
  });

  const links: Link3D[] = [];
  for (let i = 0; i < STEPS.length - 1; i++) {
    const next = STEPS[i + 1];
    links.push({
      from: `step-${STEPS[i].n}`,
      to: `step-${next.n}`,
      // The trail breaks wherever the next step is done on paper.
      broken: next.c.some(([, tone]) => tone === "p"),
    });
  }

  return {
    nodes,
    links,
    legend: [
      { tone: "steel", label: "Runs on the system" },
      { tone: "brass", label: "Runs on paper" },
      { tone: "flag", label: "Only exists to move paper" },
      { tone: "muted", label: "Dashed link: the trail stops here" },
    ],
    caption:
      "Bigger means more re-entry points inside that step. Every dashed link is a place the information leaves the system and has to be put back in by hand.",
  };
}

/* -------------------------------------------------------- one caravan */

/**
 * One unit at the centre, and everything holding a piece of it around the
 * outside. This is the "nowhere to look one van up" argument, drawn.
 */
export function unitGraph(): Graph {
  const holders: { label: string; sub: string; tone: Node3D["tone"] }[] = [
    { label: "Pix", sub: "Models, batches, dealer orders, invoicing", tone: "steel" },
    { label: "Sage", sub: "Accounts, payment logged by hand", tone: "steel" },
    { label: "Factory Master", sub: "Never came up. The biggest gap in the map", tone: "muted" },
    { label: "Works order", sub: "Printed and carried to the factory", tone: "brass" },
    { label: "Barcode sheet", sub: "Scanned into a separate spreadsheet", tone: "brass" },
    { label: "Appliance tracking", sub: "Scanned documents, keyed back in", tone: "brass" },
    { label: "Delivery dates", sub: "A spreadsheet, not the system", tone: "brass" },
    { label: "Nightly report", sub: "Handwritten, scanned, emailed, retyped", tone: "flag" },
    { label: "Order bank", sub: "Copied out and emailed weekly", tone: "brass" },
    { label: "Acknowledgement", sub: "Printed, ticked, scanned, emailed", tone: "flag" },
    { label: "Transport plan", sub: "Printed report, dates handwritten on", tone: "brass" },
    { label: "PDI checklist", sub: "Two pages of paper per van", tone: "brass" },
    { label: "Invoice PDF", sub: "A folder on one desktop", tone: "flag" },
    { label: "The book", sub: "Handwritten. The only record past three seasons", tone: "flag" },
  ];

  const nodes: Node3D[] = [
    {
      id: "unit",
      label: "One caravan",
      sub: "A serial number, and nothing that represents it",
      x: 0,
      y: 0,
      z: 0,
      size: 1,
      tone: "moss",
      kind: "unit",
      pinned: true,
    },
    ...holders.map((h, i) => {
      const [x, y, z] = fibonacciSphere(i, holders.length);
      return {
        id: `h-${i}`,
        label: h.label,
        sub: h.sub,
        x,
        y,
        z,
        size: 0.32,
        tone: h.tone,
        kind: "system" as const,
      };
    }),
  ];

  const links: Link3D[] = holders.map((_, i) => ({
    from: "unit",
    to: `h-${i}`,
    broken: holders[i].tone !== "steel",
  }));

  return {
    nodes,
    links,
    legend: [
      { tone: "moss", label: "The caravan itself" },
      { tone: "steel", label: "Held in a system" },
      { tone: "brass", label: "Held on paper or a spreadsheet" },
      { tone: "flag", label: "Held by hand, or on one machine" },
    ],
    caption:
      "Fourteen places hold a piece of one caravan, and none of them is the caravan. That is why there is nowhere to look one van up.",
  };
}

/** Used by the detail sheet behind the unit map. */
export const SYSTEM_COUNT = SYSTEMS.length;
