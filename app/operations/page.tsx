import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import { Operations } from "@/components/views/Operations";
import { viewById } from "@/content/views";

const meta = viewById("operations");

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
};

export default function Page() {
  return (
    <Shell view="operations">
      <Operations />
    </Shell>
  );
}
