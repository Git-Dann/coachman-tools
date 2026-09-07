import { MASTHEAD } from "@/content/views";

/** A thin lockup above the deck. Deliberately small: the slide is the point. */
export function Masthead() {
  return (
    <header className="mast">
      <div className="lock">
        <b>{MASTHEAD.client}</b>
        <span>{MASTHEAD.work}</span>
      </div>
      <span className="mast-by">Gitwork · working draft</span>
    </header>
  );
}
