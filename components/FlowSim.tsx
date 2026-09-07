"use client";

import { useEffect, useRef, useState } from "react";
import {
  inProgress,
  newSim,
  step as advance,
  worst,
  type Sim,
} from "@/lib/flow";
import { STRAIN_RAMP } from "@/lib/model";

type Mode = "today" | "proposed";

const COLOUR = {
  system: "#74A8C4",
  paper: "#D9A24B",
  removed: "#E4593C",
  ink: "#0C1116",
  line: "#35424E",
  text: "#E9EFF3",
  dim: "#6C7D89",
};

/**
 * Run the season.
 *
 * Press play, release caravans, and watch the queue build somewhere specific.
 * It jams at invoicing, because invoicing is where five of the twenty re-entry
 * points sit. Switch to the proposed process and the same release rate flows.
 *
 * Nobody has to be told where the bottleneck is. They watch it happen.
 */
export function FlowSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>("today");
  const [running, setRunning] = useState(false);
  const [rate, setRate] = useState(3);
  const [view, setView] = useState<Sim>(() => newSim("today"));

  const simRef = useRef<Sim>(view);
  const runRef = useRef(running);
  const rateRef = useRef(rate);
  runRef.current = running;
  rateRef.current = rate;

  const reset = (m: Mode) => {
    const s = newSim(m);
    simRef.current = s;
    setView(s);
  };

  useEffect(() => {
    reset(mode);
    // A fresh process is a fresh run. Carrying the old queues over would lie.
  }, [mode]);

  /* -------------------------------------------------------- the loop */
  useEffect(() => {
    let raf = 0;
    let acc = 0;
    let last = performance.now();
    const TICK = 110; // ms per tick, slow enough to watch

    const loop = (now: number) => {
      const dt = now - last;
      last = now;
      if (runRef.current) {
        acc += dt;
        let guard = 0;
        while (acc >= TICK && guard < 8) {
          simRef.current = advance(simRef.current, rateRef.current);
          acc -= TICK;
          guard++;
        }
        setView(simRef.current);
      } else {
        acc = 0;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ------------------------------------------------------- the canvas */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const sim = view;
    const n = sim.stations.length;
    /*
     * Serpentine. Rows are chosen from the height available so the pipeline
     * fills the canvas instead of sitting in a band across the middle, and
     * columns follow from that, bounded so labels still fit side by side.
     */
    const QUEUE_HEAD = 118; // headroom a full queue stack needs above a station
    const rows = Math.max(1, Math.min(5, Math.round(h / (QUEUE_HEAD + 42))));
    const cols = Math.max(2, Math.ceil(n / rows));
    const cw = w / cols;
    const rh = h / rows;
    const top = rh / 2 + Math.min(28, rh * 0.12);

    const at = (i: number) => {
      const r = Math.floor(i / cols);
      let c = i % cols;
      if (r % 2 === 1) c = cols - 1 - c; // snake back along odd rows
      return { x: cw * c + cw / 2, y: top + rh * r, r };
    };

    // Connectors first.
    ctx.save();
    for (let i = 0; i < n - 1; i++) {
      const a = at(i);
      const bb = at(i + 1);
      const next = sim.stations[i + 1];
      ctx.beginPath();
      ctx.strokeStyle = COLOUR.line;
      ctx.lineWidth = 1;
      ctx.setLineDash(next.paper ? [3, 5] : []);
      if (a.r === bb.r) {
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(bb.x, bb.y);
      } else {
        // Drop to the next row round the outside.
        const edge = a.x + (a.x < w / 2 ? -cw / 2.4 : cw / 2.4);
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(edge, a.y);
        ctx.lineTo(edge, bb.y);
        ctx.lineTo(bb.x, bb.y);
      }
      ctx.stroke();
    }
    ctx.restore();

    const peakQueue = Math.max(1, ...sim.queue);

    for (let i = 0; i < n; i++) {
      const s = sim.stations[i];
      const { x, y } = at(i);
      const q = sim.queue[i];
      const base = s.removed
        ? COLOUR.removed
        : s.paper
          ? COLOUR.paper
          : COLOUR.system;

      // The queue, stacked above the station. This is the thing to watch.
      const dots = Math.min(q, 14);
      for (let d = 0; d < dots; d++) {
        const depth = Math.min(4, Math.floor((d / 14) * 5));
        ctx.beginPath();
        ctx.arc(x, y - 20 - d * 7, 2.6, 0, Math.PI * 2);
        ctx.fillStyle = STRAIN_RAMP[Math.max(1, depth)];
        ctx.fill();
      }
      if (q > 14) {
        ctx.fillStyle = COLOUR.removed;
        ctx.font = "600 10px ui-monospace, monospace";
        ctx.textAlign = "center";
        ctx.fillText(`+${q - 14}`, x, y - 128);
      }

      // The station.
      const r = 11;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = sim.active[i] ? base : COLOUR.ink;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = base;
      ctx.globalAlpha = q > 0 || sim.active[i] ? 1 : 0.45;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // A ring where the pile is worst, so the eye goes straight there.
      if (q > 0 && q === peakQueue && q > 2) {
        ctx.beginPath();
        ctx.arc(x, y, r + 6, 0, Math.PI * 2);
        ctx.strokeStyle = COLOUR.removed;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.fillStyle = q > 0 ? COLOUR.text : COLOUR.dim;
      ctx.font = "500 10px ui-sans-serif, system-ui, sans-serif";
      ctx.textAlign = "center";
      const label = s.short.length > 13 ? s.short.slice(0, 12) + "…" : s.short;
      ctx.fillText(label, x, y + r + 14);
    }
  }, [view]);

  const jam = worst(view);
  const flowing = view.shipped > 0;

  return (
    <div className="sim">
      <canvas ref={canvasRef} className="sim-canvas" aria-hidden="true" />

      <div className="sim-read" aria-live="polite">
        <div className="sr-cell">
          <b>{view.released}</b>
          <span>released</span>
        </div>
        <div className={`sr-cell ${flowing ? "ok" : ""}`}>
          <b>{view.shipped}</b>
          <span>out of the door</span>
        </div>
        <div className={`sr-cell ${inProgress(view) > 8 ? "bad" : ""}`}>
          <b>{inProgress(view)}</b>
          <span>stuck in the system</span>
        </div>
        <div className={`sr-cell wide ${jam && jam.queue > 2 ? "bad" : ""}`}>
          <b>{jam && jam.queue > 0 ? jam.station.short : "—"}</b>
          <span>
            {jam && jam.queue > 0
              ? `holding up ${jam.queue}`
              : "nothing queueing"}
          </span>
        </div>
      </div>

      <div className="sim-ctl">
        <button
          type="button"
          className={`play${running ? " on" : ""}`}
          onClick={() => setRunning((r) => !r)}
        >
          {running ? "Pause" : view.tick ? "Resume" : "Run the season"}
        </button>
        <button type="button" className="mini big" onClick={() => reset(mode)}>
          Reset
        </button>
        <div className="tgl inline compact" role="group" aria-label="Process">
          <button
            type="button"
            aria-pressed={mode === "today"}
            onClick={() => setMode("today")}
          >
            Today
          </button>
          <button
            type="button"
            aria-pressed={mode === "proposed"}
            onClick={() => setMode("proposed")}
          >
            Proposed
          </button>
        </div>
        <label className="rate">
          <span>Orders in</span>
          <input
            type="range"
            min={1}
            max={6}
            step={1}
            value={7 - rate}
            onChange={(e) => setRate(7 - Number(e.target.value))}
            aria-label="How fast orders come in"
            aria-valuetext={`one every ${rate} ticks`}
          />
        </label>
      </div>
    </div>
  );
}
