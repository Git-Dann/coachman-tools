"use client";

import { useMemo, useState } from "react";
import { NodeMap3D } from "@/components/NodeMap3D";
import { CapacityModel } from "@/components/CapacityModel";
import { PeopleModel } from "@/components/PeopleModel";
import { HoursModel } from "@/components/HoursModel";
import { SeasonSim } from "@/components/SeasonSim";
import { HubSim } from "@/components/HubSim";
import { CoverScene } from "@/components/CoverScene";
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
import { HUB_CAVEAT } from "@/lib/hub";
import { usePublishStatus } from "@/components/SlideStatus";
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
  /** Two or three words naming this slide in the rail. Says where you are. */
  marker: string;
  /**
   * How the slide is laid out.
   *
   * "scene" gives the picture the whole slide, edge to edge, with the figures
   * and controls as a strip over the bottom of it. "content" is a centred
   * column of cards or rows. Everything is one of the two, so moving between
   * slides feels like one tool rather than eleven separately built pages.
   */
  kind: "scene" | "content";
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
  const soFar = VAN.slice(0, i + 1).reduce((t, v) => t + Number(v[4]), 0);

  usePublishStatus({
    headline: name,
    detail,
    tone: reEntry === "0" ? "moss" : "flag",
    figures: [
      { value: `${i + 1}/${VAN.length}`, label: "stage" },
      { value: reEntry, label: "re-entry here", tone: reEntry === "0" ? "moss" : "flag" },
      { value: String(soFar), label: "re-entry so far", tone: soFar > 0 ? "flag" : "moss" },
    ],
  });
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
    kind: "scene",
    marker: "The picture",
    chapter: "operations",
    title: "One caravan. Nowhere to look it up.",
    line: "A day at the order desk in Hull. Here is what we found.",
    body: () => (
      <div className="cover">
        <CoverScene />
        <Big
          items={[
            { n: "16", l: "steps to get one caravan out" },
            { n: "20", l: "points the same work is done twice", tone: "flag" },
            { n: "14", l: "places hold a piece of one van", tone: "flag" },
            { n: "3", l: "seasons before the record is gone", tone: "flag" },
          ]}
        />
      </div>
    ),
    aside: () => (
      <p className="hint">
        Fourteen places each hold a piece of one caravan, and none of them is
        the caravan. Use the arrows below to move on.
      </p>
    ),
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
    footnote: "Recorded on site, 3 September 2026",
  },
  {
    id: "throttle",
    kind: "scene",
    marker: "The throttle",
    chapter: "operations",
    title: "Sixteen jobs. Twenty done twice.",
    line: "Add another and watch the desk run out of year.",
    body: () => <HubSim mode="today" />,
    aside: () => (
      <p className="hint">
        Each stack is the same information being entered again. Twenty of them,
        counted off the process. Switch to Proposed and add as many as you like.
      </p>
    ),
    detailLabel: "How the hours are worked out",
    detail: () => (
      <>
        <p>
          <strong>Traceable.</strong> The sixteen jobs, the twenty re-entry
          points and which job each one sits in, two people on the order desk,
          around two thousand caravans a year, and that the system already
          crashes at that volume.
        </p>
        <p>
          <strong>Ours.</strong> How many minutes a job takes per caravan. Only
          four of the sixteen were discussed in enough detail to estimate
          directly, so the rest start from a stated rule: a minute for the work,
          plus two more for every re-entry point counted inside it.
        </p>
        <p>
          That puts today at roughly 1,900 hours a year on the order desk, of
          which about 1,300 exist only because the same information is entered
          more than once. Treat the shape as the finding and the minutes as a
          starting point to correct.
        </p>
        <p>
          Hours and crashes are kept apart on purpose. At today&rsquo;s volume
          the hours can just about be absorbed; it is the software that is
          unstable. Past double, the hours stop adding up as well.
        </p>
        <p className="caveat">{HUB_CAVEAT}</p>
        <h3>The twenty, in the order they happen</h3>
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
        <h3>All sixteen steps</h3>
        <StepList />
      </>
    ),
  },
  {
    id: "scales",
    kind: "scene",
    marker: "Built properly",
    chapter: "operations",
    title: "The same order, built properly.",
    line: "Nothing entered twice, so adding volume adds no admin.",
    body: () => <HubSim mode="proposed" />,
    aside: () => (
      <p className="hint">
        Add as many as you like. The ring stays green, because the work per
        caravan stops growing. Then zoom out: the same process runs anywhere.
      </p>
    ),
    detailLabel: "The standard twelve stages",
    detail: () => (
      <>
        <p>
          Twelve stages, taken from Coachman&rsquo;s process and cleaned up.
          Five of their sixteen steps exist only to move paper between systems
          that cannot talk to each other, so they are not rebuilt.
        </p>
        <Table
          cols={["Stage", "What it means"]}
          rows={STAGES.map(([n, m], i) => [`${i + 1}. ${n}`, m])}
        />
        <p>
          The sites on the globe are illustrative. They stand for the same
          platform running for other manufacturers, which is the point of
          building it as a product rather than a one-off. No second customer
          exists yet.
        </p>
      </>
    ),
  },
  {
    id: "sim",
    kind: "scene",
    marker: "Run the season",
    chapter: "operations",
    title: "Run the season.",
    line: "Press play. Watch how much of it is just waiting.",
    body: () => <SeasonSim />,
    aside: () => (
      <p className="hint">
        Red columns are time swallowed at that station. Switch to Proposed and
        run the same orders again.
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
          plus one for the work itself. Turning re-entry points into time is our
          doing, because nobody was timed on the day. So the shape of the jam is
          evidence. The exact tick count is not.
        </p>
        <StepList />
      </>
    ),
  },
  {
    id: "van",
    kind: "content",
    marker: "Follow one",
    chapter: "operations",
    title: "Follow one caravan.",
    line: "From a batch number to a line in a handwritten book.",
    body: () => <VanPlayer />,
    footnote: "Tap the track to jump to a stage",
  },
  {
    id: "people",
    kind: "scene",
    marker: "Who holds it",
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
        <h3>The three steps nobody else can do</h3>
        <ul className="pl n">
          {NO_COVER_STEPS.map((n) => {
            const a = ASSIGNMENTS.find((x) => x.stepId === n);
            return (
              <li key={n}>
                <span>
                  <strong>{stepTitle(n)}.</strong> {a?.because}
                </span>
              </li>
            );
          })}
        </ul>
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
    id: "capacity",
    kind: "content",
    marker: "The ceiling",
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
    kind: "content",
    marker: "What it costs",
    chapter: "leadership",
    title: "What the manual work costs.",
    line: "Your volumes. Move the minutes and the totals follow.",
    body: () => <HoursModel />,
    footnote: "Their own estimate was about 20%",
  },
  {
    id: "faults",
    kind: "content",
    marker: "What is broken",
    chapter: "leadership",
    title: "Four things are broken.",
    line: "Not missing. Broken, and already paid for.",
    body: () => (
      <div className="fill two">
        {FAULTS.map(([n, tag, d, c], i) => (
          <div className="panel flag" key={n}>
            <span className="panel-n">{`0${i + 1}`}</span>
            <p className="panel-t">{n}</p>
            <p className="panel-d">{d}</p>
            {c ? (
              <p className="panel-d">
                <strong>{c}</strong>
              </p>
            ) : null}
            <span className="panel-tag">{tag}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "decisions",
    kind: "content",
    marker: "Three decisions",
    chapter: "technical",
    title: "Three decisions carry the weight.",
    line: "A product for this kind of manufacturer. Coachman first.",
    body: () => (
      <div className="fill three">
        {TECH.decisions.rows.map((d) => (
          <div className="panel brass" key={d.n}>
            <span className="panel-n">{`0${d.n}`}</span>
            <p className="panel-t">{d.t}</p>
            <p className="panel-d">{d.p[0]}</p>
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
    kind: "content",
    marker: "The ask",
    chapter: "technical",
    title: "What we need from you.",
    line: "Five things, and one decision.",
    body: () => (
      <div className="fill three">
        {[
          ["The pack", "Screens, the reports and spreadsheets in use, example documents.", "moss"],
          ["Access, and a copy", "The current system, plus a copy so nothing is ever tested on live dealer data.", "flag"],
          ["The calendar", "Build times per model, the working week, this season's shutdown dates.", "moss"],
          ["The accounts version", "Which one is in use. It is the only permanent integration.", "moss"],
          ["A decision", "The 2027 season as the changeover.", "brass"],
        ].map(([t, d, tone], i) => (
          <div className={`panel ${tone}`} key={t}>
            <span className="panel-n">{`0${i + 1}`}</span>
            <p className="panel-t">{t}</p>
            <p className="panel-d">{d}</p>
          </div>
        ))}
        <div className="panel">
          <Quote
            text="We are building a car. Get the shell in first, then the suspension and the intricate bits come later."
            cite="Said in the room"
          />
        </div>
      </div>
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
