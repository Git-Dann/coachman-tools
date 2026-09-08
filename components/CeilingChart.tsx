"use client";

import { useMemo } from "react";
import { BASE_UNITS, capacity, filesPiled, strainVerdict } from "@/lib/model";
import { fmt } from "@/lib/format";
import { useLocal } from "@/lib/useLocal";
import { usePublishStatus } from "./SlideStatus";

/**
 * Add caravans. Find the ceiling.
 *
 * This was three bars beside three sliders: a control panel, and you had to
 * read all six things and hold them in your head to get the point. The point is
 * one shape. There are two ceilings, the factory's and the order desk's, and
 * only one of them moves when you spend money on the factory.
 *
 * So it is drawn as two ceilings on one axis with demand as a bar rising
 * against them. Add a production line and the factory ceiling jumps. Add a
 * person to the desk and the desk ceiling jumps. Whichever is lower is the one
 * that decides, and everything above it is work turned away, shaded.
 */

const MAX_DEMAND = BASE_UNITS * 4;

/* --------------------------------------------------------------- geometry */

const W = 1180;
const H = 470;
const PAD_L = 108;
const PAD_R = 232;
const PAD_T = 34;
const PAD_B = 46;

export function CeilingChart() {
  const [state, setState] = useLocal("capacity", {
    demand: BASE_UNITS,
    lines: 1,
    hands: 2,
  });

  const cap = useMemo(
    () => capacity(state.demand, state.lines, state.hands),
    [state],
  );
  const verdict = strainVerdict(cap.strain);

  /** The scale is fixed, so the ceilings visibly move rather than rescaling. */
  const top = MAX_DEMAND;
  const y = (v: number) => PAD_T + (1 - Math.min(v, top) / top) * (H - PAD_T - PAD_B);
  const barX = PAD_L + 60;
  const barW = 132;

  /*
   * At one line and two people the two ceilings are the same number, so their
   * labels land on top of each other. Whichever is not the binding one gets
   * moved clear.
   */
  const gap = Math.abs(y(cap.factory) - y(cap.admin));
  const nudge = gap < 40 ? 40 - gap : 0;
  const yFactory = y(cap.factory) - (cap.factory >= cap.admin ? nudge : 0);
  const yDesk = y(cap.admin) + (cap.factory >= cap.admin ? 0 : nudge);

  usePublishStatus({
    headline:
      cap.binding === "admin"
        ? "The order desk is the ceiling, not the factory."
        : cap.binding === "factory"
          ? "The factory is the ceiling here."
          : "Everything demanded gets out.",
    detail: verdict.said,
    tone: cap.turnedAway > 0 ? "flag" : "moss",
    figures: [
      { value: fmt(cap.throughput), label: "get out" },
      {
        value: fmt(cap.turnedAway),
        label: "turned away",
        tone: cap.turnedAway ? "flag" : "moss",
      },
      {
        value: fmt(cap.factory),
        label: "the factory could build",
        tone: "moss",
      },
    ],
  });

  const set = (k: "demand" | "lines" | "hands") => (v: number) =>
    setState((p) => ({ ...p, [k]: v }));

  return (
    <div className="ceil">
      <div className="ceil-view">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="ceil-svg"
          role="img"
          aria-label={`Demand ${fmt(cap.demand)} a year. The factory could build ${fmt(cap.factory)}. The order desk can process ${fmt(cap.admin)}. ${fmt(cap.throughput)} get out and ${fmt(cap.turnedAway)} are turned away.`}
        >
          {/* the scale */}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <g key={f}>
              <line
                x1={PAD_L}
                x2={W - PAD_R}
                y1={y(top * f)}
                y2={y(top * f)}
                className="c-grid"
              />
              <text
                x={PAD_L - 14}
                y={y(top * f) + 4}
                className="c-tick"
                textAnchor="end"
              >
                {fmt(Math.round(top * f))}
              </text>
            </g>
          ))}

          {/* demand, as a column standing against the ceilings */}
          <rect
            x={barX}
            y={y(cap.demand)}
            width={barW}
            height={y(0) - y(cap.demand)}
            className="c-demand"
          />
          {/* the part of it that never gets built */}
          {cap.turnedAway > 0 ? (
            <rect
              x={barX}
              y={y(cap.demand)}
              width={barW}
              height={y(cap.throughput) - y(cap.demand)}
              className="c-away"
            />
          ) : null}
          <text x={barX + barW / 2} y={y(0) + 26} className="c-axis" textAnchor="middle">
            Demand
          </text>

          {/* the two ceilings */}
          <g className="c-ceiling factory">
            <line x1={PAD_L} x2={W - PAD_R} y1={y(cap.factory)} y2={y(cap.factory)} />
            <text x={W - PAD_R + 14} y={yFactory - 6} className="c-lab">
              The factory could build
            </text>
            <text x={W - PAD_R + 14} y={yFactory + 17} className="c-val">
              {fmt(cap.factory)}
            </text>
          </g>
          <g
            className={`c-ceiling desk${cap.binding === "admin" ? " binding" : ""}`}
          >
            <line x1={PAD_L} x2={W - PAD_R} y1={y(cap.admin)} y2={y(cap.admin)} />
            <text x={W - PAD_R + 14} y={yDesk - 6} className="c-lab">
              The order desk can process
            </text>
            <text x={W - PAD_R + 14} y={yDesk + 17} className="c-val">
              {fmt(cap.admin)}
            </text>
            {/* Said out loud rather than crammed onto the end of the label,
                where it ran off the edge of the frame. */}
            {cap.binding === "admin" ? (
              <text x={W - PAD_R + 14} y={yDesk + 36} className="c-note">
                This is the ceiling
              </text>
            ) : null}
          </g>

          <text x={PAD_L} y={PAD_T - 14} className="c-unit">
            Caravans a year
          </text>
        </svg>
      </div>

      <div className="ceil-hud">
        <div className="hud-cell">
          <b>{fmt(cap.throughput)}</b>
          <span>get out</span>
        </div>
        <div className="hud-cell">
          <b className={cap.turnedAway ? "bad" : "ok"}>{fmt(cap.turnedAway)}</b>
          <span>turned away</span>
        </div>
        <div className="hud-cell">
          <b className="ok">{fmt(cap.factory)}</b>
          <span>the factory could have built</span>
        </div>
        <div className="hud-cell">
          <b className="bad">{fmt(filesPiled(cap.demand, 5))}</b>
          <span>files piled up in five years</span>
        </div>
      </div>

      <div className="ceil-ctl">
        <Dial
          label="Caravans a year"
          value={state.demand}
          shown={fmt(state.demand)}
          min={500}
          max={MAX_DEMAND}
          step={250}
          onChange={set("demand")}
        />
        <Dial
          label="Production lines"
          value={state.lines}
          shown={`${state.lines} line${state.lines === 1 ? "" : "s"}`}
          min={1}
          max={4}
          step={1}
          onChange={set("lines")}
        />
        <Dial
          label="People on the order desk"
          value={state.hands}
          shown={String(state.hands)}
          min={1}
          max={10}
          step={1}
          onChange={set("hands")}
        />
      </div>
    </div>
  );
}

/** One slider, with its reading where you are already looking. */
function Dial({
  label,
  value,
  shown,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  shown: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="dial">
      <span>
        {label}
        <b>{shown}</b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
