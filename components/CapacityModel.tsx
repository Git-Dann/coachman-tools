"use client";

import { useMemo } from "react";
import {
  BASE_UNITS,
  STRAIN_RAMP,
  capacity,
  filesPiled,
  strainStep,
  strainVerdict,
} from "@/lib/model";
import { fmt } from "@/lib/format";
import { useLocal } from "@/lib/useLocal";
import { usePublishStatus } from "./SlideStatus";

const TONE_VAR = {
  moss: "var(--color-moss)",
  brass: "var(--color-brass)",
  flag: "var(--color-flag)",
} as const;

/**
 * Add caravans. Add build capacity. Add hands.
 *
 * The point it makes: build capacity multiplies, the order desk does not. Add a
 * line and the factory ceiling lifts while the admin ceiling stays exactly
 * where it was, so the binding constraint moves to the desk and stays there.
 */
export function CapacityModel() {
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
  const ramp = STRAIN_RAMP[strainStep(cap.strain)];

  const ceiling = Math.max(cap.demand, cap.factory, cap.admin, BASE_UNITS * 2);
  const pct = (v: number) => `${Math.min(100, (v / ceiling) * 100)}%`;

  usePublishStatus({
    headline: cap.binding === "admin"
      ? "The order desk is the ceiling, not the factory."
      : cap.binding === "factory"
        ? "The factory is the ceiling here."
        : "Everything demanded gets out.",
    detail: verdict.said,
    tone: cap.turnedAway > 0 ? "flag" : "moss",
    figures: [
      { value: fmt(cap.throughput), label: "get out" },
      { value: fmt(cap.turnedAway), label: "turned away", tone: cap.turnedAway ? "flag" : "moss" },
      { value: fmt(cap.factory), label: "the factory could build", tone: "moss" },
    ],
  });

  const set = (k: keyof typeof state, v: number) =>
    setState((s) => ({ ...s, [k]: v }));

  return (
    <div className="model-block model-split">
      <div className="ms-main">
        <p className="ctl-label">What each side can take, same scale</p>
        <ul className="caps">
          <li>
            <span className="cap-n">Demand</span>
            <span className="cap-bar">
              <i style={{ width: pct(cap.demand), background: "var(--color-text-3)" }} />
            </span>
            <span className="cap-v">{fmt(cap.demand)}</span>
          </li>
          <li>
            <span className="cap-n">
              The factory
              {cap.binding === "factory" ? <em>binding</em> : null}
            </span>
            <span className="cap-bar">
              <i style={{ width: pct(cap.factory), background: "var(--color-moss)" }} />
            </span>
            <span className="cap-v">{fmt(cap.factory)}</span>
          </li>
          <li>
            <span className="cap-n">
              The order desk
              {cap.binding === "admin" ? <em>binding</em> : null}
            </span>
            <span className="cap-bar">
              <i style={{ width: pct(cap.admin), background: ramp }} />
            </span>
            <span className="cap-v">{fmt(cap.admin)}</span>
          </li>
        </ul>

        <div className="verdict">
          <div className="v-cell">
            <b>{fmt(cap.throughput)}</b>
            <span>get out</span>
          </div>
          <div className={`v-cell ${cap.turnedAway > 0 ? "bad" : "ok"}`}>
            <b>{fmt(cap.turnedAway)}</b>
            <span>turned away</span>
          </div>
          <div className="v-cell">
            <b>{fmt(filesPiled(cap.throughput, 5))}</b>
            <span>files piled up in 5 years</span>
          </div>
        </div>

        <div>
          <p className="ctl-label">Strain on the order system</p>
          <div className="strain" aria-hidden="true">
            {STRAIN_RAMP.map((c, n) => (
              <i
                key={c}
                style={{ background: c }}
                className={n === strainStep(cap.strain) ? "at" : ""}
              />
            ))}
          </div>
          <p className="strain-say">
            <b style={{ color: TONE_VAR[verdict.tone] }}>{verdict.label}.</b>{" "}
            {verdict.said}
          </p>
        </div>
      </div>

      <div className="ms-side">
        <div className="steppers">
          <Stepper
            label="Caravans a year"
            value={state.demand}
            display={fmt(state.demand)}
            min={1000}
            max={8000}
            step={250}
            onChange={(v) => set("demand", v)}
          />
          <Stepper
            label="Production lines"
            value={state.lines}
            display={`${state.lines} ${state.lines === 1 ? "line" : "lines"}`}
            min={1}
            max={4}
            step={1}
            onChange={(v) => set("lines", v)}
          />
          <Stepper
            label="People on the order desk"
            value={state.hands}
            display={`${state.hands}`}
            min={1}
            max={8}
            step={1}
            onChange={(v) => set("hands", v)}
          />
        </div>
      </div>
    </div>
  );
}

function Stepper({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="stepper">
      <div className="stepper-h">
        <span>{label}</span>
        <b>{display}</b>
      </div>
      <div className="stepper-c">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          disabled={value <= min}
          aria-label={`Fewer: ${label}`}
        >
          &#8722;
        </button>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={label}
          aria-valuetext={display}
        />
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + step))}
          disabled={value >= max}
          aria-label={`More: ${label}`}
        >
          &#43;
        </button>
      </div>
    </div>
  );
}
