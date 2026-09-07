import type { VanStage } from "./types";

/** Follow one caravan. Same unit, all the way through. */
export const VAN_UNIT = "Unit 78412";
export const VAN_UNIT_NOTE = "Example unit";

export const VAN: readonly VanStage[] = [
  [
    "Batched",
    "Unit exists in batch B-24 with a quantity and a slot. Promised to nobody yet.",
    "Pix",
    "Sales admin",
    "0",
  ],
  [
    "Allocated",
    "Committed to a dealer against their season quantity. Stock balance drawn down by hand.",
    "Pix",
    "Sales admin",
    "1",
  ],
  [
    "Specified",
    "Spec and options confirmed. The order shows an option was added, but not what it is.",
    "Pix",
    "Sales admin",
    "1",
  ],
  [
    "Date set",
    "Delivery date typed into the dealer record by hand, then re-checked the following week.",
    "Pix + Excel",
    "Sales admin",
    "3",
  ],
  [
    "Released",
    "Works order printed, collated and physically carried to the factory.",
    "Paper",
    "Sales admin",
    "1",
  ],
  [
    "In build",
    "On the line. Barcode scanned against the serial number into a separate spreadsheet.",
    "Spreadsheet",
    "Factory",
    "1",
  ],
  [
    "Built",
    "Inspector handwrites completion and faults on a clipboard. Scanned, emailed, retyped in.",
    "Paper, email",
    "Factory, then admin",
    "2",
  ],
  [
    "Inspected",
    "Appliance tracking codes keyed in. Has to happen before the unit can be invoiced.",
    "Spreadsheet",
    "Factory, then admin",
    "1",
  ],
  [
    "Ready",
    "Paper pre-delivery checklist. Spare wheel, handbook pack, options confirmed fitted.",
    "Paper",
    "Factory",
    "1",
  ],
  [
    "Dispatched",
    "Transport arranged by phone. Date handwritten onto the printed report and re-sent.",
    "Paper, phone",
    "Sales admin",
    "2",
  ],
  [
    "Invoiced",
    "Price, levy, option prices and nominal code all written on by hand. Address re-entered.",
    "Pix, paper",
    "Sales admin",
    "5",
  ],
  [
    "Paid",
    "Ledger update triggered by hand. Payment logged in accounts by hand. Written in the book.",
    "Sage, paper",
    "Admin, accounts",
    "3",
  ],
];
