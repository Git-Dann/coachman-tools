"use client";

import { useMemo } from "react";
import { VAN, VAN_UNIT } from "@/content/van";

/**
 * One caravan, stage by stage, and where its record is at each stage.
 *
 * This replaced a lane chart: five horizontal lanes with a line running
 * through them, dotted drops for the second system, and a row of bars over the
 * top. It was accurate and it told you nothing, because reading it meant
 * following a line, measuring bars against no axis, and holding twelve stages
 * in your head at once to notice the pattern.
 *
 * The pattern is the finding, so this draws the pattern directly. Twelve rows,
 * one per stage. Five columns, one per place the record can be. A filled cell
 * is "the unit is here at this stage". Two filled cells on one row is the same
 * unit in two places at once, which is the overlap, and those rows are marked.
 * The last column is the number of times the same information gets typed in
 * again at that stage, drawn as that many sheets rather than as a bar height,
 * so five reads as five without going back to an axis.
 *
 * Everything on it is read off content/van.ts, which is the process as it was
 * walked through on the day. Nothing is modelled and nothing is estimated: the
 * counts are counts.
 */

/** The places one caravan's record lives. */
const PLACES = [
  { id: "pix", name: "Pix", note: "The order system" },
  { id: "sheet", name: "Spreadsheet", note: "Excel, more than one" },
  { id: "paper", name: "Paper", note: "Printed, handwritten" },
  { id: "msg", name: "Email, phone", note: "In somebody's inbox" },
  { id: "sage", name: "Sage", note: "The accounts" },
] as const;

type PlaceId = (typeof PLACES)[number]["id"];

/** Which places a stage names, read off the "lives in" column. */
function placesFor(livesIn: string): PlaceId[] {
  const t = livesIn.toLowerCase();
  const out: PlaceId[] = [];
  if (t.includes("pix")) out.push("pix");
  if (t.includes("excel") || t.includes("spreadsheet")) out.push("sheet");
  if (t.includes("paper")) out.push("paper");
  if (t.includes("email") || t.includes("phone")) out.push("msg");
  if (t.includes("sage")) out.push("sage");
  return out.length ? out : ["paper"];
}

export function VanLedger({ bare }: { bare?: boolean } = {}) {
  const stages = useMemo(
    () =>
      VAN.map(([name, detail, livesIn, handledBy, reEntry]) => {
        const places = placesFor(livesIn);
        return {
          name,
          detail,
          handledBy,
          places,
          reEntry: Number(reEntry),
          /* The same unit sitting in two systems at the same stage. */
          split: places.length > 1,
        };
      }),
    [],
  );

  const totalReEntry = stages.reduce((n, s) => n + s.reEntry, 0);
  const overlaps = stages.filter((s) => s.split).length;
  const worst = stages.reduce((a, b) => (b.reEntry > a.reEntry ? b : a));
  /* How many stages touch a spreadsheet at all. */
  const onSheets = stages.filter((s) => s.places.includes("sheet")).length;
  const max = Math.max(...stages.map((s) => s.reEntry), 1);

  return (
    <div className={`led${bare ? " bare" : ""}`}>
      <div className="led-grid" role="table" aria-label={`${VAN_UNIT}: where the record is at each of ${stages.length} stages, and how many times it is entered again.`}>
        <div className="led-head" role="row">
          <span className="led-h-stage" role="columnheader">
            Stage
          </span>
          {PLACES.map((p) => (
            <span key={p.id} className="led-h-place" role="columnheader">
              {p.name}
            </span>
          ))}
          <span className="led-h-re" role="columnheader">
            Entered again
          </span>
        </div>

        {stages.map((s, i) => (
          <div
            key={s.name}
            className={`led-row${s.split ? " split" : ""}`}
            role="row"
          >
            <span className="led-stage" role="cell">
              <i>{String(i + 1).padStart(2, "0")}</i>
              <b>{s.name}</b>
              <em>{s.detail}</em>
            </span>
            {PLACES.map((p) => {
              const on = s.places.includes(p.id);
              return (
                <span
                  key={p.id}
                  className={`led-cell${on ? " on" : ""}${
                    on && p.id === "sheet" ? " sheet" : ""
                  }`}
                  role="cell"
                >
                  <span className="led-dot" aria-hidden />
                  <span className="sr">
                    {on ? `${s.name} is in ${p.name}` : ""}
                  </span>
                </span>
              );
            })}
            <span className="led-re" role="cell">
              <span className="led-sheets" aria-hidden>
                {Array.from({ length: s.reEntry }, (_, k) => (
                  <i key={k} style={{ opacity: 1 - (k / max) * 0.35 }} />
                ))}
              </span>
              <b className={s.reEntry > 0 ? "bad" : "ok"}>{s.reEntry}</b>
            </span>
          </div>
        ))}
      </div>

      <div className="led-hud">
        <div className="hud-cell">
          <b>{stages.length}</b>
          <span>stages, for one caravan</span>
        </div>
        <div className="hud-cell">
          <b className="bad">{overlaps}</b>
          <span>where it sits in two places at once</span>
        </div>
        <div className="hud-cell">
          <b className="bad">{onSheets}</b>
          <span>that run on a spreadsheet</span>
        </div>
        <div className="hud-cell">
          <b className="bad">{totalReEntry}</b>
          <span>times the same thing is entered again</span>
        </div>
      </div>

      {bare ? null : (
        <p className="led-say">
          Every filled square is a place the same caravan is at that stage, so a
          row with two of them is one unit in two systems at once, and neither
          of them is the caravan. The sheets on the right are the times the
          information gets typed in again rather than carried across.{" "}
          <b>{worst.name}</b> is the worst of them at {worst.reEntry}. Counted
          off the process as it was walked through, not modelled.
        </p>
      )}
    </div>
  );
}
