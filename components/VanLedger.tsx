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

/**
 * The places one caravan's record lives.
 *
 * Short headers. The full names wrapped inside a column and printed
 * "SPREADSHEE / T", which is the kind of detail that makes a whole figure look
 * broken. The long name is still there for a screen reader.
 */
const PLACES = [
  { id: "pix", short: "Pix", name: "Pix, the order system" },
  { id: "sheet", short: "Excel", name: "Spreadsheets, more than one" },
  { id: "paper", short: "Paper", name: "Paper, printed and handwritten" },
  { id: "msg", short: "Email", name: "Email and phone" },
  { id: "sage", short: "Sage", name: "Sage, the accounts" },
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
      <div
        className="led-grid"
        role="table"
        aria-label={`${VAN_UNIT}: where the record is at each of ${stages.length} stages, and how many times it is entered again.`}
      >
        <div className="led-head" role="row">
          <span className="led-h-stage" role="columnheader">
            Stage
          </span>
          {PLACES.map((p) => (
            <span
              key={p.id}
              className={`led-h-place${p.id === "sheet" ? " xl" : ""}`}
              role="columnheader"
              title={p.name}
            >
              {p.short}
            </span>
          ))}
          <span className="led-h-re" role="columnheader">
            Entered again
          </span>
        </div>

        {stages.map((s, i) => {
          const at = s.places.map((id) =>
            PLACES.findIndex((p) => p.id === id),
          );
          const first = Math.min(...at);
          const last = Math.max(...at);
          return (
            <div key={s.name} className="led-row" role="row">
              <span className="led-stage" role="cell" style={{ gridColumn: 1 }}>
                <i>{String(i + 1).padStart(2, "0")}</i>
                <b>{s.name}</b>
                <em>{s.detail}</em>
              </span>

              {/*
               * The overlap, drawn rather than tinted. A bar joining the two
               * places a single unit is in at the same stage says "at once"
               * the way a shaded row behind everything else does not, and it
               * leaves the row background alone.
               */}
              {s.split ? (
                <span
                  className="led-tie"
                  style={{ gridColumn: `${2 + first} / ${3 + last}` }}
                  aria-hidden
                />
              ) : null}

              {PLACES.map((p, c) => {
                const on = s.places.includes(p.id);
                return (
                  <span
                    key={p.id}
                    className={`led-cell${on ? " on" : ""}${
                      p.id === "sheet" ? " xl" : ""
                    }`}
                    role="cell"
                    /*
                     * Every cell is pinned to its own column. The tie is
                     * another child of the same grid, and with auto-placement
                     * it took a slot and pushed the marks onto a second row,
                     * which is what tore the table in half.
                     */
                    style={{ gridColumn: 2 + c }}
                  >
                    {on ? <span className="led-dot" aria-hidden /> : null}
                    <span className="sr">{on ? p.name : "not here"}</span>
                  </span>
                );
              })}

              <span
                className="led-re"
                role="cell"
                style={{ gridColumn: PLACES.length + 2 }}
              >
                <span className="led-sheets" aria-hidden>
                  {Array.from({ length: s.reEntry }, (_, k) => (
                    <i key={k} />
                  ))}
                </span>
                <b className={s.reEntry > 0 ? "bad" : undefined}>{s.reEntry}</b>
              </span>
            </div>
          );
        })}
      </div>

      {bare ? null : (
        <ul className="led-key" aria-hidden>
          <li>
            <span className="k-dot" /> where the record is
          </li>
          <li>
            <span className="k-sheet-dot" /> on a spreadsheet
          </li>
          <li>
            <span className="k-tie" /> the same unit, two places at once
          </li>
          <li>
            <span className="k-sheet" /> entered again here
          </li>
        </ul>
      )}

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
          A bar joining two marks on one row is the same caravan sitting in two
          systems at the same time, and neither of them is the caravan. The
          sheets on the right are the times the information gets typed in again
          rather than carried across; <b>{worst.name}</b> is the worst of them
          at {worst.reEntry}. Every number on this figure is a count off the
          process as it was walked through on the day. Nothing here is
          simulated and nothing is estimated.
        </p>
      )}
    </div>
  );
}
