import type { Metadata } from "next";
import { Masthead } from "@/components/Masthead";
import { Deck } from "@/components/Deck";

export const metadata: Metadata = {
  title: "Coachman Order Flow",
  description:
    "How an order gets from a dealer to an invoice, and what we would build instead.",
};

export default function Page() {
  return (
    <>
      <Masthead />
      <Deck start="operations" />
    </>
  );
}
