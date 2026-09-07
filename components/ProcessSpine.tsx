"use client";

import { useState } from "react";
import { STEPS, STEP_NOTE, reEntryCount } from "@/content/steps";
import { COUNTERS, MODE, OPS } from "@/content/copy";
import type { ViewMeta } from "@/content/views";
import { pad2 } from "@/lib/format";
import { Hero, SectionHead } from "./Shell";

type Mode = "today" | "proposed";

/**
 * The hero counters and the sixteen steps, sharing one today/proposed switch.
 *
 * The counters sit in the hero and the switch sits in the section below it, so
 * both live here rather than being wired together through the page.
 *
 * The switch is the whole pitch in one gesture: five steps strike through and
 * dim, and the counters re-count live. The handoff overlay is only meaningful
 * in today mode, so it is hidden entirely in proposed.
 */
export function ProcessSpine({ meta }: { meta: ViewMeta }) {
  const [mode, setMode] = useState<Mode>("today");
  const [showHandoffs, setShowHandoffs] = useState(false);
  const [open, setOpen] = useState<number | null>(null);

  const proposed = mode === "proposed";

  function changeMode(next: Mode) {
    setMode(next);
    setOpen(null);
  }

  return (
    <>
      <Hero eyebrow={meta.eyebrow} h1={meta.h1} standfirst={meta.standfirst}>
        <Counters proposed={proposed} />
      </Hero>

      <section aria-labelledby="process-h">
        <SectionHead
          n={OPS.process.n}
          title={OPS.process.h2}
          id="process-h"
        />
        <p className="lead">{OPS.process.lead}</p>

        <div className="modebar">
          <div className="modebar-l">{MODE.showing}</div>
          <div className="tgl" role="group" aria-label={MODE.showing}>
            <button
              type="button"
              aria-pressed={!proposed}
              onClick={() => changeMode("today")}
            >
              {MODE.today}
            </button>
            <button
              type="button"
              aria-pressed={proposed}
              onClick={() => changeMode("proposed")}
            >
              {MODE.proposed}
            </button>
          </div>
          {/* Only meaningful in today mode. */}
          {!proposed && (
            <button
              type="button"
              className="chkbtn"
              aria-pressed={showHandoffs}
              onClick={() => setShowHandoffs((v) => !v)}
            >
              <span className="dot" aria-hidden="true" />
              {MODE.handoffs}
            </button>
          )}
        </div>

        <div className={`steps${showHandoffs && !proposed ? " showh" : ""}`}>
          {STEPS.map((s) => {
            const gone = proposed && !s.keep;
            const isOpen = open === s.n;
            const re = reEntryCount(s);
            return (
              <div
                key={s.n}
                className={`step${isOpen ? " open" : ""}${gone ? " gone" : ""}`}
              >
                <button
                  type="button"
                  className="step-btn"
                  aria-expanded={isOpen}
                  aria-controls={`step-body-${s.n}`}
                  id={`step-btn-${s.n}`}
                  onClick={() => setOpen(isOpen ? null : s.n)}
                >
                  <span className="step-n">{pad2(s.n)}</span>
                  <span className="step-t">
                    {s.t}
                    <span className="step-w">{s.w}</span>
                  </span>
                  <span className="step-r">
                    {gone ? (
                      <span className="gonetag">Removed</span>
                    ) : proposed && s.why ? (
                      <span className="newtag">Changed</span>
                    ) : re > 0 && !proposed ? (
                      <span className="hbadge">{re} × re-entry</span>
                    ) : null}
                    <span className="caret" aria-hidden="true">
                      &#9656;
                    </span>
                  </span>
                </button>
                {isOpen && (
                  <div
                    className="step-body"
                    id={`step-body-${s.n}`}
                    role="region"
                    aria-labelledby={`step-btn-${s.n}`}
                  >
                    <p>{s.d}</p>
                    {proposed && (gone || s.why) && (
                      <p className={`step-change ${gone ? "gone" : "kept"}`}>
                        <strong>
                          {gone ? "This step disappears. " : "What changes: "}
                        </strong>
                        {s.why ?? "Nothing in the new process needs it."}
                      </p>
                    )}
                    <div className="chips">
                      {s.c.map(([label, tone]) => (
                        <span key={label} className={`chip ${tone}`}>
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="caveat" aria-live="polite">
          {proposed ? STEP_NOTE.proposed : STEP_NOTE.today}
        </p>
      </section>
    </>
  );
}

/** Four counters that re-count the moment the switch is thrown. */
function Counters({ proposed }: { proposed: boolean }) {
  const cells = [
    {
      key: "steps",
      value: proposed ? COUNTERS.steps.proposed : COUNTERS.steps.today,
      label: COUNTERS.steps.label,
      tone: proposed ? "good" : "n",
    },
    {
      key: "handoffs",
      value: proposed ? COUNTERS.handoffs.proposed : COUNTERS.handoffs.today,
      label: COUNTERS.handoffs.label,
      tone: proposed ? "good" : "bad",
    },
    {
      key: "paper",
      value: proposed ? COUNTERS.paper.proposed : COUNTERS.paper.today,
      label: COUNTERS.paper.label,
      tone: proposed ? "good" : "bad",
    },
    {
      key: "history",
      value: proposed ? COUNTERS.history.proposed : COUNTERS.history.today,
      label: COUNTERS.history.label,
      tone: proposed ? "good" : "bad",
      small: true,
    },
  ];

  return (
    <div className="counts">
      {cells.map((c) => (
        <div key={c.key} className={`count ${c.tone}`}>
          <div className={`count-n${c.small ? " sm" : ""}`}>{c.value}</div>
          <div className="count-l">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
