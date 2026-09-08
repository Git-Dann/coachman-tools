"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SEASON_UNITS,
  advance,
  finished,
  inProgress,
  newSeason,
  replay,
  wastedShare,
  worstStation,
  type Season,
} from "@/lib/season";
import { usePublishStatus } from "./SlideStatus";

/**
 * Run the season, and see the waiting.
 *
 * This was a three-dimensional production line with caravans hopping between
 * pads. It looked like something, and it explained nothing: you could not tell
 * what was happening, and the number underneath it was a claim you had to take
 * on trust.
 *
 * The question the slide asks is how much of a caravan's time is spent waiting
 * rather than being worked on. The honest picture of that is a timeline. Every
 * caravan is a row, every tick is a cell, and a cell is either blue because
 * somebody is working on it or red because it is sitting behind something else.
 * The percentage is then not a claim at all: it is the red, and you can count
 * it. Where the red lines up into a vertical band, that is the bottleneck, and
 * the bars underneath name it.
 *
 * Switch to Proposed and run the same twenty-two caravans. The rows go solid.
 */

const TICK = 260;
const RELEASE_EVERY = 2;
const MAX_TICKS = 150;

/* --------------------------------------------------------------- geometry */

const ROW_H = 15;
const ROW_GAP = 2;
const LEFT = 46;
const TOP = 16;
const BARS_H = 62;

export function SeasonTimeline({ drive }: { drive?: number } = {}) {
  const [mode, setMode] = useState<"today" | "proposed">("today");
  const [running, setRunning] = useState(false);
  const [own, setOwn] = useState<Season>(() => newSeason("today"));
  const ref = useRef(own);
  ref.current = own;

  /*
   * On the page the scroll runs the season, so the state comes out of a replay
   * indexed by how far through the section you are. Scrolling goes both ways,
   * which a machine you can only push forwards cannot do.
   */
  const frames = useMemo(() => (drive === undefined ? null : replay(mode)), [
    drive === undefined,
    mode,
  ]);
  const season =
    frames && drive !== undefined
      ? frames[Math.min(frames.length - 1, Math.round(drive * (frames.length - 1)))]
      : own;
  const driven = drive !== undefined;
  const setSeason = setOwn;

  const reset = useCallback((m: "today" | "proposed") => {
    const s = newSeason(m);
    ref.current = s;
    setSeason(s);
    setRunning(false);
  }, []);

  const step = useCallback(() => {
    if (ref.current.tick >= MAX_TICKS || finished(ref.current)) return false;
    const next = advance(ref.current, RELEASE_EVERY);
    ref.current = next;
    setSeason(next);
    return true;
  }, []);

  useEffect(() => {
    if (!running || driven) return;
    const id = window.setInterval(() => {
      if (!step()) setRunning(false);
    }, TICK);
    return () => window.clearInterval(id);
  }, [running, step, driven]);

  const wasted = wastedShare(season);
  const worst = worstStation(season);
  const done = finished(season);

  /* --------------------------------------------------------- the drawing */

  const ticks = Math.max(24, Math.min(MAX_TICKS, season.tick + 4));
  const cellW = 1180 / ticks;
  const rows = season.units.length;
  const chartTop = TOP + BARS_H + 22;
  const H = chartTop + Math.max(6, rows) * (ROW_H + ROW_GAP) + 26;
  const W = LEFT + 1180 + 14;

  const maxWait = Math.max(1, ...season.waitAt);

  usePublishStatus({
    headline:
      season.tick === 0
        ? "Twenty-two caravans, one process."
        : `${Math.round(wasted * 100)}% of a caravan's time is spent waiting.`,
    detail:
      season.tick === 0
        ? "Press play. Each row is one caravan; red is time it spends waiting behind something else."
        : worst
          ? `${worst.station.short} swallows more of it than anywhere else.`
          : "Nothing is queueing. Every caravan is being worked on the whole way through.",
    tone: wasted > 0.1 ? "flag" : "moss",
    figures: [
      { value: String(inProgress(season)), label: "in the process at once" },
      {
        value: `${season.shipped}/${SEASON_UNITS}`,
        label: "out of the door",
        tone: "moss",
      },
      {
        value: `${Math.round(wasted * 100)}%`,
        label: "of their time waiting",
        tone: wasted > 0.1 ? "flag" : "moss",
      },
    ],
  });

  return (
    <div className="tl">
      <div className="tl-view">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="tl-svg"
          role="img"
          aria-label={`${season.shipped} of ${SEASON_UNITS} caravans are out of the door. ${Math.round(wasted * 100)}% of their time in the process is spent waiting${worst ? `, mostly at ${worst.station.short}` : ""}.`}
        >
          {/* where the waiting piles up, station by station */}
          <text x={LEFT} y={TOP - 2} className="tl-cap">
            Waiting, by station
          </text>
          {season.stations.map((st, i) => {
            const bw = 1180 / season.stations.length;
            const h = (season.waitAt[i] / maxWait) * BARS_H;
            const worstHere = worst?.station.id === st.id && season.waitAt[i] > 0;
            return (
              <g key={st.id}>
                <rect
                  x={LEFT + bw * i + 2}
                  y={TOP + 8 + BARS_H - h}
                  width={bw - 4}
                  height={Math.max(0, h)}
                  className={`tl-bar${worstHere ? " worst" : ""}`}
                />
                {worstHere ? (
                  <text
                    x={LEFT + bw * i + bw / 2}
                    y={TOP + BARS_H + 22}
                    className="tl-worst"
                    textAnchor="middle"
                  >
                    {st.short}
                  </text>
                ) : null}
              </g>
            );
          })}
          <line
            x1={LEFT}
            x2={LEFT + 1180}
            y1={TOP + 8 + BARS_H}
            y2={TOP + 8 + BARS_H}
            className="tl-base"
          />

          {/* one row per caravan */}
          <text x={LEFT} y={chartTop - 7} className="tl-cap">
            One row per caravan, left to right in time
          </text>
          {season.units.map((u, r) => {
            const y = chartTop + r * (ROW_H + ROW_GAP);
            return (
              <g key={u.id}>
                <text x={LEFT - 10} y={y + ROW_H - 3} className="tl-rn" textAnchor="end">
                  {u.id + 1}
                </text>
                <rect
                  x={LEFT}
                  y={y}
                  width={1180}
                  height={ROW_H}
                  className="tl-track"
                />
                {u.log.map((c, k) => (
                  <rect
                    key={k}
                    x={LEFT + (u.from - 1 + k) * cellW}
                    y={y}
                    width={Math.max(0.8, cellW - 0.4)}
                    height={ROW_H}
                    className={c.doing === "work" ? "tl-work" : "tl-wait"}
                  />
                ))}
                {u.at >= season.stations.length ? (
                  <rect
                    x={LEFT + (u.from - 1 + u.log.length) * cellW}
                    y={y}
                    width={Math.max(2, cellW * 0.5)}
                    height={ROW_H}
                    className="tl-out"
                  />
                ) : null}
              </g>
            );
          })}
          {rows === 0 ? (
            <text x={LEFT} y={chartTop + 28} className="tl-empty">
              Press play.
            </text>
          ) : null}
        </svg>
      </div>

      <ul className="tl-key" aria-label="What the colours mean">
        <li>
          <i className="k-work" />
          being worked on
        </li>
        <li>
          <i className="k-wait" />
          waiting behind something else
        </li>
        <li>
          <i className="k-out" />
          out of the door
        </li>
      </ul>

      <div className="tl-hud">
        <div className="hud-cell">
          <b>{inProgress(season)}</b>
          <span>in the process at once</span>
        </div>
        <div className="hud-cell">
          <b className="ok">
            {season.shipped}/{SEASON_UNITS}
          </b>
          <span>out of the door</span>
        </div>
        <div className="hud-cell wide">
          <div className="split" aria-hidden="true">
            <i className="work" style={{ width: `${(1 - wasted) * 100}%` }} />
            <i className="wait" style={{ width: `${wasted * 100}%` }} />
          </div>
          <b className={wasted > 0.1 ? "bad" : "ok"}>
            {Math.round(wasted * 100)}% waiting
          </b>
          <span>
            {season.tick === 0
              ? "press play"
              : `only ${100 - Math.round(wasted * 100)}% of a caravan's time is work`}
          </span>
        </div>
        <div className="hud-cell">
          <b className="sm">{worst ? worst.station.short : "—"}</b>
          <span>{worst ? "swallows the most time" : "nothing waiting yet"}</span>
        </div>
      </div>

      <div className="tl-ctl">
        {/*
          * On the page, scroll runs the season, so the transport goes away and
          * only the comparison is left. On its own it keeps play and step, so
          * it can still be talked through a tick at a time.
          */}
        {driven ? null : (
          <>
            <button
              type="button"
              className={`play${running ? " on" : ""}`}
              onClick={() => setRunning((r) => !r)}
              disabled={done || season.tick >= MAX_TICKS}
            >
              {running
                ? "Pause"
                : done
                  ? "Season done"
                  : season.tick
                    ? "Resume"
                    : "Run the season"}
            </button>
            <button
              type="button"
              className="mini big"
              onClick={() => {
                setRunning(false);
                step();
              }}
              disabled={done || season.tick >= MAX_TICKS}
            >
              Step
            </button>
            <button
              type="button"
              className="mini big"
              onClick={() => reset(mode)}
            >
              Reset
            </button>
          </>
        )}
        <div className="tgl inline compact" role="group" aria-label="Process">
          <button
            type="button"
            aria-pressed={mode === "today"}
            onClick={() => {
              setMode("today");
              reset("today");
            }}
          >
            Today
          </button>
          <button
            type="button"
            aria-pressed={mode === "proposed"}
            onClick={() => {
              setMode("proposed");
              reset("proposed");
            }}
          >
            Proposed
          </button>
        </div>
        <span className="ssim-hint">
          Same twenty-two caravans either way
        </span>
      </div>
    </div>
  );
}
