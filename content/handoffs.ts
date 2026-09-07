import type { Handoff } from "./types";

/**
 * Every point the work gets done twice.
 * Not twenty inefficiencies in general terms. Twenty specific, nameable ones,
 * in the order they happen.
 */
export const HANDOFFS: readonly Handoff[] = [
  [
    "Dealer orders arrive by phone or email",
    "Then get entered by hand. There is no portal.",
  ],
  [
    "One batch date, typed into every dealer record",
    "The same date, entered separately around seventeen times.",
  ],
  [
    "Moving units between batches loses the options",
    "So every move gets checked by hand afterwards.",
  ],
  [
    "Works orders printed and walked to the factory",
    "The factory cannot see the system, so the build runs off paper.",
  ],
  [
    "Barcode scan data lands in a spreadsheet",
    "A second silo between the floor and the invoice.",
  ],
  [
    "Appliance tracking codes keyed in",
    "Off scanned documents, before invoicing can happen.",
  ],
  [
    "Delivery estimates worked out in someone's head",
    "Build days per model, working days only, bank holidays removed.",
  ],
  [
    "The nightly build report is handwritten",
    "Then scanned, emailed, and read line by line into a screen.",
  ],
  [
    "All batch dates re-checked every week",
    "Because typos reach the customer if they are not caught.",
  ],
  ["The order bank is copied out", "Then emailed to each dealer."],
  [
    "Acknowledgements printed, ticked, scanned, emailed",
    "One dealer at a time, and currently behind.",
  ],
  [
    "Transport dates handwritten onto a printed report",
    "Then hand-updated and re-sent when anything moves.",
  ],
  [
    "System and spreadsheet compared across two monitors",
    "Reconciled by eye rather than by the system.",
  ],
  [
    "A paper pre-delivery checklist per unit",
    "Roughly four thousand sheets a year.",
  ],
  [
    "Serial numbers written down by hand for invoicing",
    "Off a list, one at a time.",
  ],
  [
    "The price written onto every printed invoice",
    "Even though the system already holds it.",
  ],
  [
    "The £50 levy and option prices written on too",
    "A flat annual figure, entered per unit.",
  ],
  [
    "The nominal code typed off a sticky note",
    "The same code every time, documented nowhere.",
  ],
  [
    "The finance company address re-entered every invoice",
    "A known fault nobody has been able to explain.",
  ],
  [
    "Invoices saved locally and attached to emails by hand",
    "Then the payment logged into accounts by hand.",
  ],
];
