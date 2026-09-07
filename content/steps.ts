import type { Step } from "./types";

/**
 * The sixteen steps, as walked through on site.
 *
 * Five have keep:0. Those only ever existed to move paper between systems that
 * could not talk to each other, so they are not stages in building a caravan
 * and they do not get rebuilt.
 */
export const STEPS: readonly Step[] = [
  {
    n: 1,
    t: "Set up the models",
    w: "Pix · Model Maintenance",
    d: "Models created on the system first. Prototypes configured, so you know what is being built and what the serial numbers are.",
    c: [["Pix", "s"]],
    keep: 1,
  },
  {
    n: 2,
    t: "Set up the options",
    w: "Pix",
    d: "Options carried forward from the previous season. Provided rather than worked out from scratch. If an option is wrong here nothing downstream catches it, because the check at the end only confirms what was ordered has been fitted.",
    c: [["Pix", "s"]],
    keep: 1,
  },
  {
    n: 3,
    t: "Create the batches",
    w: "Pix · Maintain Batches",
    d: "Batches produced by hand: a batch number, a model, a quantity. Nothing allocated to anyone yet. Forward and stock batches hold units not going into production. Moving units between batches works, but the options do not travel with them, so every move gets checked by hand.",
    c: [
      ["Pix", "s"],
      ["Manual check", "r"],
    ],
    keep: 1,
  },
  {
    n: 4,
    t: "Allocate to dealers",
    w: "Pix · Maintain Dealer Orders",
    d: "Dealers set up with the quantity they have committed to for the season, from four or five up to a hundred and fifty. Demo units come out of the batch separately. The balance is drawn down by hand as units sell. The delivery date is the same for the whole batch but gets typed into each dealer record one at a time, about seventeen times in the example given.",
    c: [
      ["Pix", "s"],
      ["Same date re-typed", "r"],
      ["Email", "p"],
    ],
    keep: 1,
  },
  {
    n: 5,
    t: "Print the works orders and take them to the factory",
    w: "Pix, then paper",
    d: "One line per unit. The full batch printed off, collated, and physically carried to the factory with the supporting documents. The factory has no access to the system at all, so from here the build runs off paper.",
    c: [
      ["Printed", "p"],
      ["Hand delivered", "p"],
    ],
    keep: 0,
    why: "Production sees the release on screen.",
  },
  {
    n: 6,
    t: "Barcodes and appliance tracking",
    w: "Printed in house, then a spreadsheet",
    d: "Barcodes printed against the serial number, scanned on the floor with a handheld. The scan data comes back into a separate spreadsheet, not the main system. Appliance tracking codes are stored per unit so an appliance can be traced later, and that has to be keyed in before invoicing.",
    c: [
      ["Scanner", ""],
      ["Spreadsheet", ""],
      ["Keyed in again", "r"],
    ],
    keep: 1,
  },
  {
    n: 7,
    t: "Confirm build dates and work out delivery dates",
    w: "Pix · Maintain Batch Orders, and Excel",
    d: "The factory confirms build dates. Estimates are worked out in someone's head: about ten days for the larger model, less for smaller, working days only, Fridays not worked, bank holidays removed. Every week all the batches get re-checked before the order bank goes out, because a wrong day or month reaches the customer before anyone notices.",
    c: [
      ["Pix", "s"],
      ["Spreadsheet", ""],
      ["Worked out by hand", "r"],
    ],
    keep: 1,
  },
  {
    n: 8,
    t: "The nightly build report and the delivery call",
    w: "Clipboard, scanner, email, then Pix",
    d: "An inspector walks the floor with a clipboard and handwrites which units are complete and any faults. That sheet is scanned and emailed over. Someone then reads every line of the handwriting and retypes it in, which produces the printed delivery call. The typing is quick. Waiting for the email is the bottleneck, and it all rests on the handwriting being readable.",
    c: [
      ["Handwritten", "p"],
      ["Retyped", "r"],
      ["Printed daily", "p"],
    ],
    keep: 1,
    why: "The floor records completion once, at source.",
  },
  {
    n: 9,
    t: "The weekly order bank to dealers",
    w: "Copied out of Pix, sent by email",
    d: "Every week each dealer is emailed their order bank showing where their units stand. It is copied out of the system rather than generated and sent by it.",
    c: [
      ["Copied out", "r"],
      ["Email", "p"],
    ],
    keep: 0,
    why: "Dealers see it live in the portal.",
  },
  {
    n: 10,
    t: "Order acknowledgements to dealers",
    w: "Printed, ticked, scanned, emailed",
    d: "Van details and additional spec, printed, ticked, dated, scanned, then emailed to each dealer one at a time. Currently weeks behind, because there is no time to keep printing and scanning while specs keep changing. It has to be done eventually because the auditors need it.",
    c: [
      ["Printed", "p"],
      ["One at a time", "r"],
      ["Behind", "r"],
    ],
    keep: 0,
    why: "Sent automatically when something changes.",
  },
  {
    n: 11,
    t: "Arrange the transport",
    w: "Printed report, phone, spreadsheet",
    d: "Arranged about a week and a half ahead, mainly through one haulier. Dates handwritten onto the printed report. Changes checked verbally with the factory, hand-updated on the list and re-sent to everyone. Keeping it straight means the system on one monitor and the spreadsheet on the other, compared by eye.",
    c: [
      ["Handwritten", "p"],
      ["Checked by eye", "r"],
    ],
    keep: 1,
  },
  {
    n: 12,
    t: "Pre-delivery checks",
    w: "Paper checklist, one per unit",
    d: "The things that are not part of the build: spare wheel, handbook and documentation pack, and confirmation the specified options are fitted. At around two thousand units a year and two pages each, roughly four thousand sheets of paper annually for this step alone.",
    c: [["Paper, per unit", "p"]],
    keep: 1,
    why: "Same check, on a screen, against the order.",
  },
  {
    n: 13,
    t: "Invoice",
    w: "Pix · Generate, then Invoice Entry",
    d: "Serial numbers written down by hand off a list. A private notes print produced per unit. Then, one sheet at a time: the price written on although the system already holds it, the £50 marketing contribution written on although it is a flat annual figure, option prices written on, the nominal code typed from a yellow sticky note on the desk, and the finance company address found and re-entered.",
    c: [
      ["Pix", "s"],
      ["Price by hand", "r"],
      ["Levy by hand", "r"],
      ["Code from a sticky note", "r"],
    ],
    keep: 1,
    why: "Prints complete, nothing handwritten.",
  },
  {
    n: 14,
    t: "Send it to accounts and log the payment",
    w: "Pix · Sales Ledger Update, then Sage",
    d: "Once invoices are printed a sales ledger update is triggered by hand and sends the information to accounts, daily. So the two systems are not completely disconnected, it just needs a person to press the button, and accounts then log the payment by hand at the other end.",
    c: [
      ["Triggered by hand", "r"],
      ["Logged by hand", "r"],
    ],
    keep: 1,
    why: "Pushed automatically to the ledger.",
  },
  {
    n: 15,
    t: "Email the invoices out to the dealers",
    w: "Desktop folders, then email",
    d: "Saved as PDFs or Word files into folders on the desktop, grouped by dealer, attached to an email by hand and sent one dealer at a time. About weekly in practice, even though dispatches happen daily.",
    c: [
      ["Saved locally", ""],
      ["Attached by hand", "r"],
    ],
    keep: 0,
    why: "Issued to the dealer with the invoice.",
  },
  {
    n: 16,
    t: "Write it in the book",
    w: "A paper book",
    d: "Every day, by hand: which unit went to which dealer, and the key numbers. Not belt and braces. The system only holds about three seasons, and older dealer records cannot even be amended. The book is the only long-term history the business has.",
    c: [
      ["Handwritten daily", "p"],
      ["Only long-term record", "r"],
    ],
    keep: 0,
    why: "Every unit keeps its own permanent record.",
  },
];

/** Re-entry points inside a step: the chips tagged as retyping. */
export function reEntryCount(step: Step): number {
  return step.c.filter(([, tone]) => tone === "r").length;
}

export const STEP_NOTE = {
  today:
    "Sixteen steps, and around five of them are not really about building a caravan at all.",
  proposed:
    "Five steps disappear entirely. They only ever existed to move paper between systems that could not talk to each other, so they are not stages in building a caravan and they do not get rebuilt.",
};
