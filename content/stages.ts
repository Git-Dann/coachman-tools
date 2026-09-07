import type { Stage } from "./types";

/**
 * The standard twelve stages, built into the product.
 * Coachman runs sixteen steps. This is twelve, and the gap is the whole point.
 */
export const STAGES: readonly Stage[] = [
  ["Planned", "Season, models and options set up."],
  ["Batched", "Unit exists in a batch, promised to nobody."],
  ["Allocated", "Committed to a dealer."],
  ["Specified", "Spec and options confirmed and priced."],
  ["Released", "Production can see it and start."],
  ["In build", "On the line."],
  ["Built", "Off the line, fitted components recorded."],
  ["Inspected", "Checks done, faults logged."],
  ["Ready", "Pre-delivery checks complete."],
  ["Dispatched", "Left the factory, haulier and destination recorded."],
  ["Invoiced", "Billed to the dealer."],
  ["Delivered", "Confirmed received."],
];
