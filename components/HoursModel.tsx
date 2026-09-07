"use client";

import {
  HOURS_PER_PERSON,
  IMPACT_CAVEAT,
  IMPACT_OUT,
  IMPACT_ROWS,
  VOLUMES,
} from "@/content/model";
import { fmt } from "@/lib/format";
import { useLocal } from "@/lib/useLocal";

/**
 * Four adjustable rows off the volumes given on the day.
 * The volumes are theirs. The minutes are ours, and the sliders say so.
 */
export function HoursModel() {
  const [minutes, setMinutes] = useLocal<Record<string, number>>(
    "hours",
    Object.fromEntries(IMPACT_ROWS.map((r) => [r.key, r.defaultMinutes])),
  );

  const rows = IMPACT_ROWS.map((r) => {
    const mins = minutes[r.key] ?? r.defaultMinutes;
    return { row: r, mins, hours: (r.count(VOLUMES) * mins) / 60 };
  });
  const total = rows.reduce((n, r) => n + r.hours, 0);
  const share = Math.round((total / HOURS_PER_PERSON) * 100);

  return (
    <div className="model-block">
      {rows.map(({ row, mins, hours }) => (
        <div className="mrow" key={row.key}>
          <div className="mrow-l">
            {row.label}
            <small>{row.basis(VOLUMES, fmt)}</small>
          </div>
          <div className="mrow-s">
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
        </div>
      ))}

      <div className="verdict" aria-live="polite">
        <div className="v-cell">
          <b>{fmt(total)}</b>
          <span>hours a year</span>
        </div>
        <div className="v-cell warn">
          <b>{share}%</b>
          <span>of one person</span>
        </div>
        <div className="v-cell">
          <b>20%</b>
          <span>their own estimate</span>
        </div>
      </div>

      <p className="caveat">{IMPACT_CAVEAT}</p>
    </div>
  );
}
