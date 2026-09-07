/**
 * What the business runs on, and who can get into it.
 * From the process record: three named systems, then a long tail of
 * spreadsheets, folders and paper that quietly does just as much of the work.
 */
export interface SystemRow {
  name: string;
  does: string;
  access: string;
  /** Named software, as opposed to a spreadsheet, a folder or a book. */
  named: boolean;
}

export const SYSTEMS: readonly SystemRow[] = [
  {
    name: "Pix",
    does: "Bespoke. Models, options, batches, dealer orders, works orders, delivery details, invoicing.",
    access: "Two people in the entire business.",
    named: true,
  },
  {
    name: "Sage",
    does: "Accounts and payroll.",
    access: "Accounts. Payments logged by hand.",
    named: true,
  },
  {
    name: "Factory Master",
    does: "Production side. Did not come up during the walkthrough at all.",
    access: "Unknown.",
    named: true,
  },
  {
    name: "Spreadsheets",
    does: "Delivery dates, appliance tracking, transport planning, daily reporting, season comparisons, a separate filtered version for Alex. A figure of fourteen was mentioned.",
    access: "Whoever has the file.",
    named: false,
  },
  {
    name: "A paper book",
    does: "Which van went to which dealer, and key numbers. Handwritten daily. The only record going back more than three seasons.",
    access: "One person, on paper.",
    named: false,
  },
  {
    name: "Local folders",
    does: "Invoices and acknowledgements saved as PDFs and Word files on the desktop, then attached to emails by hand. Years of them.",
    access: "One machine.",
    named: false,
  },
];

export const ACCESS_NOTES: readonly string[] = [
  "The factory has no access to the order system. None at all. Everything reaches them on paper and comes back by email.",
  "Dealers have no access either. They ring up, email, or wait for the weekly order bank.",
  "Both regular users are on the same setup with a lot of overlap, each seeing menus and data that have nothing to do with their own role.",
  "Alex is deliberately kept off the main spreadsheet, because it carries dealer complaints and damage reports that are not his to see. That is a requirement to keep, not an accident.",
  "IT and software support sits with Reality Solutions, outside the business.",
];
