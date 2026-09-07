import type { Metadata } from "next";
import { Masthead } from "@/components/Masthead";
import { Deck } from "@/components/Deck";
import { viewById } from "@/content/views";

const meta = viewById("technical");

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
};

export default function Page() {
  return (
    <>
      <Masthead />
      <Deck start="technical" />
    </>
  );
}
