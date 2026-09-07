import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import { Technical } from "@/components/views/Technical";
import { viewById } from "@/content/views";

const meta = viewById("technical");

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
};

export default function Page() {
  return (
    <Shell view="technical">
      <Technical />
    </Shell>
  );
}
