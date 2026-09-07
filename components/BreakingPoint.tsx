"use client";

import { useState } from "react";
import {
  BP_CAVEAT,
  BP_CONTROLS,
  BP_DEFAULTS,
  BP_OUT,
  MACHINE_CEILING,
  ORDER_CEILING,
  filesMarkerPosition,
  filesPiled,
  gigabytes,
  machineVerdict,
  markerPosition,
  orderVerdict,
  platformRows,
  type Verdict,
} from "@/content/model";
import { LEAD } from "@/content/copy";
import { fmt, fmtRows } from "@/lib/format";
import { SectionHead } from "./Shell";

/**
 * Two ceilings on one pair of sliders.
 *
 * Both gauges recalculate on every input event. The sliders are uncontrolled in
 * the sense that they own no derived state, so the thumb never loses focus
 * while it is being dragged.
 */
export function BreakingPoint() {
  const [volume, setVolume] = useState(BP_DEFAULTS.volume);
  const [years, setYears] = useState(BP_DEFAULTS.years);

  const files = filesPiled(volume, years);
  const rows = platformRows(volume, years);
  const gb = gigabytes(files);
  const order = orderVerdict(volume);
  const machine = machineVerdict(files);

  const filesColour =
    files < 10000
      ? "var(--color-moss)"
      : files < 30000
        ? "var(--color-brass)"
        : "var(--color-flag)";

  return (
    <section aria-labelledby="bp-h">
      <SectionHead n={LEAD.breaking.n} title={LEAD.breaking.h2} id="bp-h" />
      <p className="lead">{LEAD.breaking.lead}</p>

      <div className="bp">
        <div className="bp-ctl">
          {/* Value shown above the track, never squeezed into a third column. */}
          <label>
            <span className="slab">
              <span>{BP_CONTROLS.volume.label}</span>
              <b>{fmt(volume)}</b>
            </span>
            <input
              type="range"
              min={BP_CONTROLS.volume.min}
              max={BP_CONTROLS.volume.max}
              step={BP_CONTROLS.volume.step}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label={BP_CONTROLS.volume.label}
              aria-valuetext={`${fmt(volume)} orders a year`}
            />
          </label>
          <label>
            <span className="slab">
              <span>{BP_CONTROLS.years.label}</span>
              <b>
                {years} {years === 1 ? "year" : "years"}
              </b>
            </span>
            <input
              type="range"
              min={BP_CONTROLS.years.min}
              max={BP_CONTROLS.years.max}
              step={BP_CONTROLS.years.step}
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              aria-label={BP_CONTROLS.years.label}
            />
          </label>
        </div>

        <Gauge
          title={ORDER_CEILING.title}
          zones={ORDER_CEILING.zones}
          marker={markerPosition(volume)}
          verdict={order}
        />

        <Gauge
          title={MACHINE_CEILING.title}
          zones={MACHINE_CEILING.zones}
          marker={filesMarkerPosition(files)}
          verdict={machine}
        />

        <dl className="bp-out">
          <div className="bp-cell">
            <dt>{BP_OUT.files.label}</dt>
            <dd style={{ color: filesColour }}>
              {fmt(files)}
              <small>{BP_OUT.files.unit(gb.toFixed(1))}</small>
            </dd>
          </div>
          <div className="bp-cell">
            <dt>{BP_OUT.historyOld.label}</dt>
            <dd style={{ color: "var(--color-flag)" }}>
              {BP_OUT.historyOld.value}
              <small>{BP_OUT.historyOld.unit}</small>
            </dd>
          </div>
          <div className="bp-cell">
            <dt>{BP_OUT.rows.label}</dt>
            <dd style={{ color: "var(--color-moss)" }}>
              {fmtRows(rows)}
              <small>{BP_OUT.rows.unit}</small>
            </dd>
          </div>
          <div className="bp-cell">
            <dt>{BP_OUT.historyNew.label}</dt>
            <dd style={{ color: "var(--color-moss)" }}>
              {BP_OUT.historyNew.value}
              <small>{BP_OUT.historyNew.unit}</small>
            </dd>
          </div>
        </dl>

        <p className="caveat">{BP_CAVEAT}</p>
      </div>
    </section>
  );
}

/** A zoned gauge with a live marker. The zones are labels, not measurements. */
function Gauge({
  title,
  zones,
  marker,
  verdict,
}: {
  title: string;
  zones: readonly {
    width: number;
    tone: "g" | "a" | "r";
    label: string;
    dim?: boolean;
  }[];
  marker: number;
  verdict: Verdict;
}) {
  return (
    <div className="gz">
      <div className="gz-h">
        <span className="gz-t">{title}</span>
        <span className={`pill ${verdict.tone}`}>{verdict.pill}</span>
      </div>
      <div className="track2" aria-hidden="true">
        {zones.map((z, i) => (
          <span
            key={i}
            className={`zone ${z.tone}${z.dim ? " dim" : ""}`}
            style={{ width: `${z.width}%` }}
          />
        ))}
        <span className="mark" style={{ left: `${marker}%` }} />
      </div>
      <div className="zlab" aria-hidden="true">
        {zones.map((z, i) => (
          <span key={i} style={{ width: `${z.width}%` }}>
            {z.label}
          </span>
        ))}
      </div>
      <p className="gz-note" aria-live="polite">
        {verdict.note}
        {verdict.emphasis ? <> <b>{verdict.emphasis}</b></> : null}
      </p>
    </div>
  );
}
