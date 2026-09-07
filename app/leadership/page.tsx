import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import { Leadership } from "@/components/views/Leadership";
import { viewById } from "@/content/views";

const meta = viewById("leadership");

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
};

export default function Page() {
  return (
    <Shell view="leadership">
      <Leadership />
    </Shell>
  );
}
