import { redirect } from "next/navigation";

/**
 * The deck's three views are one page now. Anybody holding a link to this one
 * gets taken to it rather than a dead end.
 */
export default function Page() {
  redirect("/");
}
