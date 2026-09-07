import type { Fault } from "./types";

/** Four things that are broken, not missing. */
export const FAULTS: readonly Fault[] = [
  [
    "It crashes",
    "First priority",
    "Adding chassis numbers on its own can bring it down. Copy and paste is unreliable, so things get counted and entered manually to avoid triggering it.",
    "Named as the number one item on the wish list, ahead of everything else. Nothing is worth automating on top of a system that falls over.",
  ],
  [
    "The price does not reach the invoice print",
    "Fault",
    "The price is on the system. The serial number and model code exist on both sides, so there is a way to link them. It still gets handwritten onto every sheet.",
    "",
  ],
  [
    "The finance company address will not stick",
    "Fault",
    "On every invoice, for every dealer, the address has to be found and re-entered. Support have reportedly said they do not know why, so it has never been fixed.",
    "Hit many times a day rather than occasionally, which makes it a bigger prize than it sounds. It also says something about the current support arrangement.",
  ],
  [
    "Moving units between batches drops the options",
    "Fault",
    "The move works. The options do not travel with the units, so every move has to be verified by hand. Which is why moves are done cautiously.",
    "",
  ],
];
