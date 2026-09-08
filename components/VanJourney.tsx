"use client";

import { useMemo, useState } from "react";
import { VAN, VAN_UNIT } from "@/content/van";
import { usePublishStatus } from "./SlideStatus";

/**
 * Follow one caravan.
 *
 * This was a stepper: a card with the stage name and three fields, next to a
 * right-hand rail printing the same three fields again. Reading it told you
 * nothing you could not get from a list, and there was nothing to look at.
 *
 * The finding is not what any single stage says. It is the shape of the whole
 * journey: the record of one caravan moves between five different places, and
 * it crosses between them eleven times in twelve stages. That is a picture, so
 * this draws it. Systems are lanes, stages are columns, and the line joining
 * them is the record changing hands. Where it jumps a lane, somebody carried
 * something. The bars along the top are the times the same information gets
 * typed in again, and the tallest of them is invoicing.
 *
 * Everything on it comes out of content/van.ts, which is the process as it was
 * described on the day. Nothing here is modelled or estimated.
 */

/** The places one caravan's record lives, in the order it tends to reach them. */
const LANES = [
  { id: "pix", name: "Pix" },
  { id: "sheet", name: "Spreadsheet" },
  { id: "paper", name: "Paper" },
  { id: "msg", name: "Email, phone" },
  { id: "sage", name: "Sage" },
] as const;

type LaneId = (typeof LANES)[number]["id"];

/**
 * Which lanes a stage touches, read off the "lives in" column.
 *
 * The first one is where the record properly sits at that stage, so it is the
 * one the line runs through; the rest are drawn as second marks on the same
 * column.
 */
function lanesFor(livesIn: string): LaneId[] {
  const t = livesIn.toLowerCase();
  const out: LaneId[] = [];
  if (t.includes("pix")) out.push("pix");
  if (t.includes("excel") || t.includes("spreadsheet")) out.push("sheet");
  if (t.includes("paper")) out.push("paper");
  if (t.includes("email") || t.includes("phone")) out.push("msg");
  if (t.includes("sage")) out.push("sage");
  return out.length ? out : ["paper"];
}

/* ------------------------------------------------------------- geometry */

const W = 1240;
const GUT = 132; // room for the lane names
const PAD_R = 26;
const BAR_TOP = 26;
const BAR_H = 74;
const LANE_TOP = BAR_TOP + BAR_H + 30;
const LANE_H = 52;
const H = LANE_TOP + LANES.length * LANE_H + 52;

export function VanJourney({
  drive,
  still,
}: { drive?: number; still?: boolean } = {}) {
  const [own, setOwn] = useState(0);
  /* On the page the scroll walks the caravan through its twelve stages. */
  const driven = drive !== undefined;
  /*
   * Still is the whole chart at once, with nothing picked out and no stepper.
   * The finding is the shape of the line, not any one stage, and a highlighted
   * column with no way to move it only asks a question it cannot answer.
   */

  const stages = useMemo(
    () =>
      VAN.map(([name, detail, livesIn, handledBy, reEntry]) => ({
        name,
        detail,
        livesIn,
        handledBy,
        reEntry: Number(reEntry),
        lanes: lanesFor(livesIn),
      })),
    [],
  );

  const at = still
    ? -1
    : driven
      ? Math.min(
          VAN.length - 1,
          Math.floor(Math.max(0, (drive! - 0.08) / 0.84) * VAN.length),
        )
      : own;
  const setAt = setOwn;

  const colW = (W - GUT - PAD_R) / stages.length;
  const cx = (i: number) => GUT + colW * (i + 0.5);
  const laneY = (id: LaneId) =>
    LANE_TOP + LANES.findIndex((l) => l.id === id) * LANE_H + LANE_H / 2;

  const maxRe = Math.max(...stages.map((s) => s.reEntry), 1);

  /** How many times the record crosses from one place to another. */
  const crossings = stages.reduce(
    (n, s, i) => (i > 0 && s.lanes[0] !== stages[i - 1].lanes[0] ? n + 1 : n),
    0,
  );
  const soFar = stages.slice(0, at + 1).reduce((t, s) => t + s.reEntry, 0);
  const total = stages.reduce((t, s) => t + s.reEntry, 0);
  const here = stages[Math.max(0, at)];

  usePublishStatus(still ? null : {
    headline: `${here.name}. ${here.livesIn}.`,
    detail: here.detail,
    tone: here.reEntry === 0 ? "moss" : "flag",
    figures: [
      { value: `${at + 1}/${stages.length}`, label: "stage" },
      {
        value: String(here.reEntry),
        label: "entered again here",
        tone: here.reEntry === 0 ? "moss" : "flag",
      },
      {
        value: String(soFar),
        label: `of ${total} so far`,
        tone: soFar > 0 ? "flag" : "moss",
      },
    ],
  });

  return (
    <div className={`journey${still ? " still" : ""}`}>
      <div className="journey-view">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="journey-svg"
          role="img"
          aria-label={`${VAN_UNIT}: the record moves between ${LANES.length} places across ${stages.length} stages, crossing between them ${crossings} times.`}
        >
          {/* the column under the pointer, so the eye has somewhere to be */}
          {at >= 0 ? (
            <rect
              x={GUT + colW * at}
              y={BAR_TOP - 10}
              width={colW}
              height={H - BAR_TOP - 4}
              className="j-now-band"
            />
          ) : null}

          {/* lanes */}
          {LANES.map((l, n) => (
            <g key={l.id}>
              <line
                x1={GUT}
                x2={W - PAD_R}
                y1={LANE_TOP + n * LANE_H + LANE_H / 2}
                y2={LANE_TOP + n * LANE_H + LANE_H / 2}
                className="j-lane"
              />
              <text
                x={GUT - 16}
                y={LANE_TOP + n * LANE_H + LANE_H / 2 + 4}
                className="j-lane-name"
                textAnchor="end"
              >
                {l.name}
              </text>
            </g>
          ))}

          {/* the record changing hands */}
          <polyline
            className="j-path"
            points={stages
              .map((s, i) => `${cx(i)},${laneY(s.lanes[0])}`)
              .join(" ")}
          />

          {/* re-entry, stage by stage */}
          {stages.map((s, i) => {
            const h = (s.reEntry / maxRe) * BAR_H;
            return s.reEntry > 0 ? (
              <g key={`b${s.name}`}>
                <rect
                  x={cx(i) - 9}
                  y={BAR_TOP + BAR_H - h}
                  width={18}
                  height={h}
                  className={`j-bar${i === at ? " now" : ""}`}
                  rx={2}
                />
                <text
                  x={cx(i)}
                  y={BAR_TOP + BAR_H - h - 7}
                  className={`j-bar-n${i === at ? " now" : ""}`}
                  textAnchor="middle"
                >
                  {s.reEntry}
                </text>
              </g>
            ) : null;
          })}

          {/* the stages themselves */}
          {stages.map((s, i) => (
            <g
              key={s.name}
              className={`j-col${i === at ? " now" : ""}`}
              onClick={() => setAt(i)}
            >
              {s.lanes.slice(1).map((id) => (
                <circle
                  key={id}
                  cx={cx(i)}
                  cy={laneY(id)}
                  r={5}
                  className="j-also"
                />
              ))}
              {s.lanes.length > 1 ? (
                <line
                  x1={cx(i)}
                  x2={cx(i)}
                  y1={laneY(s.lanes[0])}
                  y2={laneY(s.lanes[s.lanes.length - 1])}
                  className="j-tie"
                />
              ) : null}
              <circle
                cx={cx(i)}
                cy={laneY(s.lanes[0])}
                r={i === at ? 10 : 7}
                className="j-node"
              />
              <text
                x={cx(i)}
                y={H - 26}
                className="j-stage"
                textAnchor="middle"
              >
                {s.name}
              </text>
              {/* one generous hit area per column, so it is easy to aim at */}
              <rect
                x={GUT + colW * i}
                y={BAR_TOP - 10}
                width={colW}
                height={H - BAR_TOP - 4}
                className="j-hit"
              />
            </g>
          ))}
        </svg>
      </div>

      <div className="journey-hud">
        <div className="hud-cell">
          <b>{stages.length}</b>
          <span>stages, for one caravan</span>
        </div>
        <div className="hud-cell">
          <b className="bad">{LANES.length}</b>
          <span>places its record lives</span>
        </div>
        <div className="hud-cell">
          <b className="bad">{crossings}</b>
          <span>times it changes hands between them</span>
        </div>
        <div className="hud-cell">
          <b className="bad">{total}</b>
          <span>times the same thing is entered again</span>
        </div>
      </div>

      {still ? null : (
        <div className="journey-ctl">
          <button
            type="button"
            className="mini big"
            onClick={() => setAt((n) => Math.max(0, n - 1))}
            disabled={at === 0}
          >
            &#8592; Back
          </button>
          <span className="journey-at">
            <b>{here.name}</b>
            <i>
              {VAN_UNIT} &middot; stage {at + 1} of {stages.length}
            </i>
          </span>
          <button
            type="button"
            className="mini big"
            onClick={() => setAt((n) => Math.min(stages.length - 1, n + 1))}
            disabled={at === stages.length - 1}
          >
            On &#8594;
          </button>
          <span className="ssim-hint">Click any stage</span>
        </div>
      )}

    </div>
  );
}
