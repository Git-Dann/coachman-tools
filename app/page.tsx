import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import { Operations } from "@/components/views/Operations";
import { DEFAULT_VIEW, viewById } from "@/content/views";

/**
 * The default view. Operations, for the people doing the work.
 *
 * Each view is also reachable at its own path, so the right person gets the
 * right link.
 */
const meta = viewById(DEFAULT_VIEW);

export const metadata: Metadata = {
  title: "Coachman Order Flow",
  description: meta.description,
};

export default function Page() {
  return (
    <Shell view={DEFAULT_VIEW}>
      <Operations />
    </Shell>
  );
}
