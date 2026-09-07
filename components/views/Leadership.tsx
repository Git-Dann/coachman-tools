import { BreakingPoint } from "@/components/BreakingPoint";
import { ImpactModel } from "@/components/ImpactModel";
import { Faults, Risks } from "@/components/Cards";
import { Hero, Quote, SectionHead } from "@/components/Shell";
import { LEAD } from "@/content/copy";
import { viewById } from "@/content/views";

/** For the board. */
export function Leadership() {
  const meta = viewById("leadership");
  return (
    <div className="wrap">
      <Hero eyebrow={meta.eyebrow} h1={meta.h1} standfirst={meta.standfirst} />
      <Risks />
      <BreakingPoint />
      <ImpactModel />
      <Faults />

      <section aria-labelledby="lands-h">
        <SectionHead n={LEAD.lands.n} title={LEAD.lands.h2} id="lands-h" />
        <Quote {...LEAD.lands.quote} />
        <ul className="pl y">
          {LEAD.lands.points.map((p) => (
            <li key={p.strong}>
              <span>
                <strong>{p.strong}</strong> {p.rest}
              </span>
            </li>
          ))}
        </ul>
        <h3>{LEAD.lands.needH3}</h3>
        <ul className="pl q">
          {LEAD.lands.need.map((n) => (
            <li key={n}>
              <span>{n}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
