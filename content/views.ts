/** The three views. Same dataset, three lenses, each separately linkable. */

export type ViewId = "operations" | "leadership" | "technical";

export interface ViewMeta {
  id: ViewId;
  /** Tab label. */
  name: string;
  /** Path, so the right person gets the right link. */
  path: string;
  eyebrow: string;
  h1: string;
  standfirst: string;
  /** Browser tab and share title. */
  title: string;
  description: string;
}

export const VIEWS: readonly ViewMeta[] = [
  {
    id: "operations",
    name: "Operations",
    path: "/operations",
    eyebrow: "Recorded on site · 3 September 2026",
    h1: "One caravan. Sixteen steps. Twenty times the same thing gets written out again.",
    standfirst:
      "This is how an order gets from a dealer to an invoice today, taken from the walkthrough. Switch between how it runs now and how it would run, and watch what disappears.",
    title: "Operations · Coachman Order Flow",
    description:
      "The process end to end, one caravan followed through it, and every point the same work gets done twice.",
  },
  {
    id: "leadership",
    name: "Leadership",
    path: "/leadership",
    eyebrow: "For the board",
    h1: "The system is not slow. It is a limit on how much business you can take.",
    standfirst:
      "Asked what would happen if orders doubled next year, the answer was that the business would turn the work away. That is the argument, and it sits above everything else in this document.",
    title: "Leadership · Coachman Order Flow",
    description:
      "The risks in order, the breaking point, what the manual work costs, and what we need from you.",
  },
  {
    id: "technical",
    name: "Technical",
    path: "/technical",
    eyebrow: "Architecture foundation",
    h1: "What it gets built on, and the three decisions that carry the weight.",
    standfirst:
      "No screens, no process. The foundation: what owns what, what the data hangs off, and what it runs on. Built as a product for this kind of manufacturer, with Coachman as the first customer.",
    title: "Technical · Coachman Order Flow",
    description:
      "The three decisions, the standard twelve stages, what the data hangs off, the stack, and what is still to settle.",
  },
];

export const DEFAULT_VIEW: ViewId = "operations";

export function viewById(id: ViewId): ViewMeta {
  const found = VIEWS.find((v) => v.id === id);
  if (!found) throw new Error(`Unknown view: ${id}`);
  return found;
}

export const MASTHEAD = {
  client: "Coachman",
  work: "Order flow",
};

export const FOOTER: readonly string[] = [
  "Gitwork Group",
  "Coachman FY26/27",
  "Working draft, needs checking",
];
