"use client";

import { useMemo, useState } from "react";
import { NodeMap3D } from "@/components/NodeMap3D";
import { CapacityModel } from "@/components/CapacityModel";
import { PeopleModel } from "@/components/PeopleModel";
import { HoursModel } from "@/components/HoursModel";
import { FlowSim } from "@/components/FlowSim";
import { flowGraph, unitGraph } from "./graphs";
import { STEPS } from "./steps";
import { HANDOFFS } from "./handoffs";
import { RISKS } from "./risks";
import { FAULTS } from "./faults";
import { STAGES } from "./stages";
import { VAN } from "./van";
import { SYSTEMS, ACCESS_NOTES } from "./systems";
import { ASSIGNMENTS, PEOPLE, PEOPLE_CAVEAT } from "./people";
import { HEAVIEST, NO_COVER_STEPS, TOTAL_STEPS, stepTitle, word } from "@/lib/model";
import { TECH } from "./copy";

export type ChapterId = "operations" | "leadership" | "technical";

export const CHAPTERS: { id: ChapterId; name: string; path: string }[] = [
  { id: "operations", name: "How it runs", path: "/operations" },
  { id: "leadership", name: "Where it breaks", path: "/leadership" },
  { id: "technical", name: "What we build", path: "/technical" },
];

export interface Slide {
  id: string;
  chapter: ChapterId;
  /** Seven words at most. It is a headline, not a sentence. */
  title: string;
  /** One line. If it needs two, it belongs in the detail sheet. */
  line?: string;
  /** The interactive thing. Gets the room. */
  body: () => React.ReactElement;
  /** Anything else for the rail beside the headline. */
  aside?: () => React.ReactElement;
  /** The record, one tap away. */
  detail?: () => React.ReactElement;
  detailLabel?: string;
  /** Drop the rail and use the whole width. */
  wide?: boolean;
  footnote?: string;
}

/* --------------------------------------------------------------- pieces */

function Quote({ text, cite }: { text: string; cite: string }) {
  return (
    <blockquote>
      <p>{text}</p>
      <cite>{cite}</cite>
    </blockquote>
  );
}

function Big({
  items,
}: {
  items: { n: string; l: string; tone?: "flag" | "moss" | "brass" }[];
}) {
  return (
    <div className="bignums">
      {items.map((i) => (
        <div key={i.l} className={`bn ${i.tone ?? ""}`}>
          <b>{i.n}</b>
          <span>{i.l}</span>
        </div>
      ))}
    </div>
  );
}

function Table({ cols, rows }: { cols: string[]; rows: (readonly string[])[] }) {
  return (
    <div className="tw" tabIndex={0} role="region" aria-label={cols.join(", ")}>
      <table>
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StepList() {
  const [proposed, setProposed] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  return (
    <>
      <div className="tgl inline" role="group" aria-label="Mode">
        <button type="button" aria-pressed={!proposed} onClick={() => setProposed(false)}>
          Today
        </button>
        <button type="button" aria-pressed={proposed} onClick={() => setProposed(true)}>
          Proposed
        </button>
      </div>
      <div className="steps">
        {STEPS.map((s) => {
          const gone = proposed && !s.keep;
          const isOpen = open === s.n;
          return (
            <div key={s.n} className={`step${isOpen ? " open" : ""}${gone ? " gone" : ""}`}>
              <button
                type="button"
                className="step-btn"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : s.n)}
              >
                <span className="step-n">{s.n < 10 ? `0${s.n}` : s.n}</span>
                <span className="step-t">
                  {s.t}
                  <span className="step-w">{s.w}</span>
                </span>
                <span className="step-r">
                  {gone ? <span className="gonetag">Removed</span> : null}
                  <span className="caret" aria-hidden="true">
                    &#9656;
                  </span>
                </span>
              </button>
              {isOpen ? (
                <div className="step-body">
                  <p>{s.d}</p>
                  {proposed && (gone || s.why) ? (
                    <p className={`step-change ${gone ? "gone" : "kept"}`}>
                      <strong>{gone ? "This step disappears. " : "What changes: "}</strong>
                      {s.why ?? "Nothing in the new process needs it."}
                    </p>
                  ) : null}
                  <div className="chips">
                    {s.c.map(([label, tone]) => (
                      <span key={label} className={`chip ${tone}`}>
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </>
  );
}

function VanPlayer() {
  const [i, setI] = useState(0);
  const [name, detail, livesIn, handledBy, reEntry] = VAN[i];
  const last = VAN.length - 1;
  return (
    <div className="van">
      <div className="track">
        {VAN.map(([s], n) => (
          <button
            key={s}
            type="button"
            className={`tick${n < i ? " done" : ""}${n === i ? " now" : ""}`}
            onClick={() => setI(n)}
            aria-label={`${n + 1}. ${s}`}
            aria-current={n === i ? "step" : undefined}
          />
        ))}
      </div>
      <div aria-live="polite" className="van-main">
        <p className="van-stage">{name}</p>
        <p className="van-desc">{detail}</p>
        <dl className="van-meta">
          <div>
            <dt>Lives in</dt>
            <dd>{livesIn}</dd>
          </div>
          <div>
            <dt>Handled by</dt>
            <dd>{handledBy}</dd>
          </div>
          <div>
            <dt>Re-entry points</dt>
            <dd style={{ color: reEntry === "0" ? "var(--color-moss)" : "var(--color-flag)" }}>
              {reEntry}
            </dd>
          </div>
        </dl>
      </div>
      <div className="van-ctl">
        <button
          type="button"
          onClick={() => setI((n) => Math.max(0, n - 1))}
          disabled={i === 0}
          aria-label="Previous stage"
        >
          &#8592;
        </button>
        <span className="van-id">
          Unit 78412 · {i + 1} of {VAN.length}
        </span>
        <button
          type="button"
          onClick={() => setI((n) => Math.min(last, n + 1))}
          disabled={i === last}
          aria-label="Next stage"
        >
          &#8594;
        </button>
      </div>
    </div>
  );
}

function UnitMap() {
  const graph = useMemo(() => unitGraph(), []);
  return <NodeMap3D graph={graph} fill />;
}

function FlowMap() {
  const graph = useMemo(() => flowGraph(null), []);
  return <NodeMap3D graph={graph} fill />;
}

/* --------------------------------------------------------------- slides */

export const SLIDES: Slide[] = [
  {
    id: "cover",
    chapter: "operations",
    title: "One caravan. Nowhere to look it up.",
    line: "A day at the order desk in Hull. Here is what we found.",
    body: () => (
      <Big
        items={[
          { n: "16", l: "steps to get one caravan out" },
          { n: "20", l: "points the same work is done twice", tone: "flag" },
          { n: "14", l: "places hold a piece of one van", tone: "flag" },
          { n: "3", l: "seasons before the record is gone", tone: "flag" },
        ]}
      />
    ),
    aside: () => <p className="hint">Arrow keys, or swipe. Every claim has its evidence one click away.</p>,
    footnote: "Recorded on site, 3 September 2026",
  },
  {
    id: "unit",
    chapter: "operations",
    title: "Where does one caravan live?",
    line: "In fourteen places at once. None of them is the caravan.",
    body: () => <UnitMap />,
    aside: () => <p className="hint">Drag to turn it. Click anything to see what it holds.</p>,
    detailLabel: "What the business runs on",
    detail: () => (
      <>
        <Table
          cols={["What", "What it does", "Who can get in"]}
          rows={SYSTEMS.map((s) => [s.name, s.does, s.access])}
        />
        <ul className="pl">
          {ACCESS_NOTES.map((n) => (
            <li key={n}>
              <span>{n}</span>
            </li>
          ))}
        </ul>
        <Quote
          text="For one van that gets ordered and sent to a customer, there are maybe ten different files, if not more, being updated at any one point, rather than searching for that order and seeing everything there."
          cite="Said in the room, and agreed"
        />
      </>
    ),
  },
  {
    id: "sim",
    chapter: "operations",
    title: "Run the season.",
    line: "Press play. Nobody needs telling where it jams.",
    body: () => <FlowSim />,
    aside: () => (
      <p className="hint">
        Each station takes as long as the re-entry points counted inside it.
        Switch to Proposed and run the same orders again.
      </p>
    ),
    detailLabel: "How this is worked out",
    detail: () => (
      <>
        <p>
          Every station is a single queue. A caravan holds it for as long as that
          station costs, and anything behind it waits.
        </p>
        <p>
          <strong>The one modelled number is how long a station takes.</strong>{" "}
          It is set to the number of re-entry points counted inside that step,
          plus one for the work itself. Those counts come straight off the
          process record. Turning re-entry points into time is our doing, not
          something anyone said, because nobody was timed on the day. So the
          shape of the jam is evidence. The exact tick count is not.
        </p>
        <p>
          Invoicing carries five of the twenty, which is why it is the station
          that backs up first.
        </p>
        <StepList />
      </>
    ),
  },
  {
    id: "handoffs",
    chapter: "operations",
    title: "Twenty times, the same work.",
    line: "Not twenty inefficiencies in general. Twenty nameable ones.",
    body: () => (
      <>
        <Big
          items={[
            { n: "20", l: "re-entry points", tone: "flag" },
            { n: "5", l: "in invoicing alone", tone: "flag" },
            { n: "4,000", l: "sheets of paper a year", tone: "flag" },
          ]}
        />
        <Quote
          text="You are doing a lot of the same work over and over again to achieve the same result."
          cite="Said in the room"
        />
      </>
    ),
    detailLabel: "All twenty, in order",
    detail: () => (
      <ol className="hl">
        {HANDOFFS.map(([t, d]) => (
          <li key={t}>
            <span>
              <b>{t}</b>
              <span>{d}</span>
            </span>
          </li>
        ))}
      </ol>
    ),
  },
  {
    id: "flowmap",
    chapter: "operations",
    title: "Where the trail keeps breaking.",
    line: "Every dashed link is information leaving the system by hand.",
    body: () => <FlowMap />,
    aside: () => <p className="hint">Drag to turn it. Bigger means more re-entry inside that step.</p>,
    detailLabel: "All sixteen steps",
    detail: () => <StepList />,
  },
  {
    id: "van",
    chapter: "operations",
    title: "Follow one caravan.",
    line: "From a batch number to a line in a handwritten book.",
    body: () => <VanPlayer />,
    footnote: "Click the track to jump",
  },
  {
    id: "people",
    chapter: "leadership",
    title: `One desk holds ${word(HEAVIEST.steps.length)} of ${word(TOTAL_STEPS)}.`,
    line: "Take someone out and watch the work move, or stop.",
    body: () => <PeopleModel />,
    detailLabel: "Who holds what, and why we say so",
    detail: () => (
      <>
        <p>{PEOPLE_CAVEAT}</p>
        <Table
          cols={["Step", "Held by", "Why we say that"]}
          rows={ASSIGNMENTS.map((a) => [
            `${a.stepId}. ${stepTitle(a.stepId)}`,
            PEOPLE.find((p) => p.id === a.ownerId)?.name ?? a.ownerId,
            `${a.because}${a.source === "inferred" ? " (our reading, needs confirming)" : ""}`,
          ])}
        />
        <h3>The people</h3>
        <ul className="pl">
          {PEOPLE.map((p) => (
            <li key={p.id}>
              <span>
                <strong>{p.name}.</strong> {p.note}
                {p.check ? ` ${p.check}` : ""}
              </span>
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: "nocover",
    chapter: "leadership",
    title: `${word(NO_COVER_STEPS.length).replace(/^t/, "T")} steps have nobody else.`,
    line: "Invoicing, sending the invoices, and the book.",
    body: () => (
      <>
        <Big
          items={[
            { n: String(NO_COVER_STEPS.length), l: "steps with no cover at all", tone: "flag" },
            { n: String(HEAVIEST.steps.length), l: `of ${TOTAL_STEPS} steps on one desk`, tone: "flag" },
            { n: "2", l: "people can get into the system", tone: "brass" },
          ]}
        />
        <Quote text="She can never really go on holiday." cite="Said in the room, about invoicing" />
      </>
    ),
    detailLabel: "The steps with no cover",
    detail: () => (
      <>
        <p>
          Attempts to train others have not stuck, because it is not done often
          enough by anyone else to build confidence, and everyone else is
          already stretched. This is not a training problem to solve with a
          document.
        </p>
        <ul className="pl n">
          {NO_COVER_STEPS.map((s) => {
            const a = ASSIGNMENTS.find((x) => x.stepId === s);
            return (
              <li key={s}>
                <span>
                  <strong>{stepTitle(s)}.</strong> {a?.because}
                </span>
              </li>
            );
          })}
        </ul>
      </>
    ),
  },
  {
    id: "capacity",
    chapter: "leadership",
    title: "Add caravans. Find the ceiling.",
    line: "The factory scales with lines. The order desk does not.",
    body: () => <CapacityModel />,
    detailLabel: "The risks, in order",
    detail: () => (
      <div className="cards">
        {RISKS.map(([h, tag, d, c]) => (
          <div className="card r" key={h}>
            <p className="card-t">{h}</p>
            <span className="card-tag">{tag}</span>
            <p>{d}</p>
            {c ? (
              <p>
                <strong>{c}</strong>
              </p>
            ) : null}
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "hours",
    chapter: "leadership",
    title: "What the manual work costs.",
    line: "Your volumes. Move the minutes and the totals follow.",
    body: () => <HoursModel />,
    footnote: "Their own estimate was about 20%",
  },
  {
    id: "faults",
    chapter: "leadership",
    title: "Four things are broken.",
    line: "Not missing. Broken, and already paid for.",
    wide: true,
    body: () => (
      <div className="cards two">
        {FAULTS.map(([n, tag, d, c]) => (
          <div className="card f" key={n}>
            <p className="card-t">{n}</p>
            <span className="card-tag">{tag}</span>
            <p>{d}</p>
            {c ? (
              <p>
                <strong>{c}</strong>
              </p>
            ) : null}
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "stages",
    chapter: "technical",
    title: "Twelve stages, not sixteen steps.",
    line: "Five of theirs exist only to move paper. Those go.",
    body: () => (
      <Table cols={["Stage", "What it means"]} rows={STAGES.map(([n, m], i) => [`${i + 1}. ${n}`, m])} />
    ),
    aside: () => (
      <Big
        items={[
          { n: "16", l: "steps today" },
          { n: "12", l: "stages proposed", tone: "moss" },
          { n: "0", l: "re-entry points", tone: "moss" },
        ]}
      />
    ),
  },
  {
    id: "decisions",
    chapter: "technical",
    title: "Three decisions carry the weight.",
    line: "A product for this kind of manufacturer. Coachman first.",
    wide: true,
    body: () => (
      <div className="dec">
        {TECH.decisions.rows.map((d) => (
          <div className="decrow" key={d.n}>
            <div className="decn">{d.n}</div>
            <div>
              <p className="dect">{d.t}</p>
              <p>{d.p[0]}</p>
            </div>
          </div>
        ))}
      </div>
    ),
    detailLabel: "The full reasoning",
    detail: () => (
      <div className="dec">
        {TECH.decisions.rows.map((d) => (
          <div className="decrow" key={d.n}>
            <div className="decn">{d.n}</div>
            <div>
              <p className="dect">{d.t}</p>
              {d.p.map((x) => (
                <p key={x}>{x}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "ask",
    chapter: "technical",
    title: "What we need from you.",
    line: "Five things, and one decision.",
    body: () => (
      <ul className="pl q big">
        <li>
          <span>The pack: screens, reports, spreadsheets, example documents.</span>
        </li>
        <li>
          <span>Access to the current system, and a copy to work against.</span>
        </li>
        <li>
          <span>Build times per model, the working week, shutdown dates.</span>
        </li>
        <li>
          <span>Which accounts system version is in use.</span>
        </li>
        <li>
          <span>A decision on the 2027 season as the changeover.</span>
        </li>
      </ul>
    ),
    aside: () => (
      <Quote
        text="We are building a car. Get the shell in first, then the suspension and the intricate bits come later."
        cite="Said in the room"
      />
    ),
    detailLabel: "Still to settle",
    detail: () => (
      <ul className="pl q">
        {TECH.settle.points.map((p) => (
          <li key={p.strong}>
            <span>
              <strong>{p.strong}</strong> {p.rest}
            </span>
          </li>
        ))}
      </ul>
    ),
  },
];
