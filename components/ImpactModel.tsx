"use client";

import { useState } from "react";
import {
  HOURS_PER_PERSON,
  IMPACT_CAVEAT,
  IMPACT_OUT,
  IMPACT_ROWS,
  VOLUMES,
} from "@/content/model";
import { LEAD } from "@/content/copy";
import { fmt } from "@/lib/format";
import { SectionHead } from "./Shell";

/**
 * Four adjustable rows using only the volumes given on the day.
 *
 * The volumes are fixed because they are theirs. The minutes are ours, and the
 * sliders say so. Their own twenty per cent estimate sits alongside for
 * comparison rather than being derived from the sliders.
 */
export function ImpactModel() {
  const [minutes, setMinutes] = useState<Record<string, number>>(() =>
    Object.fromEntries(IMPACT_ROWS.map((r) => [r.key, r.defaultMinutes])),
  );

  const rows = IMPACT_ROWS.map((r) => {
    const mins = minutes[r.key] ?? r.defaultMinutes;
    return { row: r, mins, hours: (r.count(VOLUMES) * mins) / 60 };
  });

  const total = rows.reduce((n, r) => n + r.hours, 0);
  const share = Math.round((total / HOURS_PER_PERSON) * 100);

  return (
    <section aria-labelledby="impact-h">
      <SectionHead n={LEAD.impact.n} title={LEAD.impact.h2} id="impact-h" />
      <p className="lead">{LEAD.impact.lead}</p>

      <div className="model">
        {rows.map(({ row, mins, hours }) => (
          <div className="mrow" key={row.key}>
            <div className="mrow-l">
              {row.label}
              <small>{row.basis(VOLUMES, fmt)}</small>
            </div>
            <div className="mrow-s">
              {/* Value above the track, so it reads on a phone. */}
              <div className="slab">
                <span>
                  {mins} {IMPACT_OUT.eachSuffix}
                </span>
                <span>
                  {fmt(hours)} {IMPACT_OUT.perYearSuffix}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={row.maxMinutes}
                step={1}
                value={mins}
                onChange={(e) =>
                  setMinutes((m) => ({ ...m, [row.key]: Number(e.target.value) }))
                }
                aria-label={IMPACT_OUT.minutesLabel(row.label)}
                aria-valuetext={`${mins} minutes each, ${fmt(hours)} hours a year`}
              />
            </div>
            <div className="mrow-v">{fmt(hours)}</div>
          </div>
        ))}

        <dl className="total" aria-live="polite">
          <div>
            <dt>{IMPACT_OUT.hours}</dt>
            <dd>{fmt(total)}</dd>
          </div>
          <div>
            <dt>{IMPACT_OUT.share}</dt>
            <dd className="hl">{share}%</dd>
          </div>
          <div>
            <dt>{IMPACT_OUT.theirs}</dt>
            <dd>{IMPACT_OUT.theirsValue}</dd>
          </div>
        </dl>

        <p className="caveat">{IMPACT_CAVEAT}</p>
      </div>
    </section>
  );
}
