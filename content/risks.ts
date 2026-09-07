import type { Risk } from "./types";

/** The risks, in order. */
export const RISKS: readonly Risk[] = [
  [
    "The business cannot take on more work",
    "Growth ceiling",
    "Asked what would happen if orders doubled next year, the answer was that they would turn the business away, because the system would not cope.",
    "This is not about saving admin time. It is a cap on how much business can be accepted, and any argument about payback should start here.",
  ],
  [
    "The business is losing its own history",
    "Data loss",
    "About three seasons are held. Beyond that the record is unreachable and older dealer records cannot be amended. What survives does so because someone writes it in a book by hand every day.",
    "For a manufacturer with warranty obligations and appliance traceability, not being able to look up a unit from four seasons ago is a problem waiting to be found at the worst moment.",
  ],
  [
    "If one person is off, invoicing stops",
    "Key person",
    "Put plainly on the day: she can never really go on holiday. Training others has not stuck, because nobody else does it often enough to build confidence and everyone is already stretched.",
    "This is not a training problem to solve with a document. The process is too intricate to hand over safely in its current form.",
  ],
  [
    "Knowledge the business needs is on sticky notes",
    "Undocumented",
    "The nominal code needed to post invoices is written on a yellow note on the desk. A new starter would have no way of finding it.",
    "Codes, dealer quirks and depot rules all live in people's heads or on paper around the desk.",
  ],
  [
    "There is nowhere safe to test anything",
    "No test system",
    "No test or training environment. Everything runs on live data, so experimentation and training happen on real dealer and order records.",
    "A copy is a prerequisite before anyone touches anything, and needs sorting early rather than discovered halfway into a build.",
  ],
  [
    "Too much depends on handwriting",
    "Accuracy",
    "The nightly build report, the fault notes and parts of the transport plan all arrive handwritten, and legibility varies.",
    "Everything downstream, including dates that reach customers, depends on someone reading it correctly.",
  ],
];
