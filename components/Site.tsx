"use client";

import { useEffect, useState } from "react";
import { CoverScene } from "./CoverScene";
import { HubSim } from "./HubSim";
import { SeasonTimeline } from "./SeasonTimeline";
import { VanLedger } from "./VanLedger";
import { PeopleGrid } from "./PeopleGrid";
import { CeilingChart } from "./CeilingChart";
import { Count, Drive, Reveal, useActiveSection } from "./scroll";
import { FAULTS } from "@/content/faults";
import { ASKS, DECISIONS, QUOTE } from "@/content/page";

/**
 * One page, one URL.
 *
 * The shape is taken from the reference site rather than from a slide deck: a
 * floating pill bar, a hero that is one centred line of light serif over a
 * scene, three cards, exactly one pinned section, three moves each with their
 * own accent, the numbers, the faults, the decisions, a call to action on a
 * wash, and a footer in columns.
 *
 * Two things it deliberately does not do. It does not pin every figure, because
 * six pinned figures in a row is a fairground ride and the reference pins one.
 * And it does not ask you to drive anything: the charts sit still and say what
 * they say, apart from the one that is worth watching move.
 */
export function Site() {
  return (
    <>
      <div className="grain" aria-hidden />
      <Bar />

      <main id="top">
        <Hero />
        <Three />
        <Throttle />
        <Moves />
        <Numbers />
        <Broken />
        <Build />
        <Cta />
      </main>

      <Foot />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════ bar */

/**
 * The sections the bar navigates, in the order the page runs them.
 *
 * The labels used to be the ones from the deck, and two of them named a
 * different section from the one they scrolled to. These are what each section
 * actually says.
 */
const NAV = [
  { id: "how", t: "How it runs" },
  { id: "throttle", t: "The throttle" },
  { id: "season", t: "Where it breaks" },
  { id: "journey", t: "What it costs" },
  { id: "broken", t: "What is broken" },
  { id: "build", t: "What we build" },
] as const;

/* The ask has its own button on the right, so it is spied on but not listed. */
const SPY_IDS = [...NAV.map((n) => n.id), "ask"];

function Bar() {
  const active = useActiveSection(SPY_IDS);
  return (
    <header className="bar">
      <div className="bar-in">
        <a className="bar-mark" href="#top">
          Order Flow
        </a>
        <nav className="bar-links" aria-label="Sections">
          {NAV.map((n) => (
            <a
              key={n.id}
              className={`pill${active === n.id ? " on" : ""}`}
              href={`#${n.id}`}
              aria-current={active === n.id ? "true" : undefined}
            >
              {n.t}
            </a>
          ))}
        </nav>
      </div>
      <div className="bar-in">
        <Theme />
        <a
          className={`pill solid${active === "ask" ? " on" : ""}`}
          href="#ask"
          aria-current={active === "ask" ? "true" : undefined}
        >
          The ask
        </a>
      </div>
    </header>
  );
}

/** Paper or ink. Paper is the default; the choice is remembered. */
function Theme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
  }, []);
  const flip = () => {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* a private window is allowed to forget */
    }
    setDark(!dark);
  };
  return (
    <button
      type="button"
      className="pill"
      onClick={flip}
      aria-label={dark ? "Switch to paper" : "Switch to ink"}
    >
      {dark ? "Paper" : "Ink"}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════ hero */

function Hero() {
  return (
    <section className="hero">
      <div className="hero-scene" aria-hidden>
        <CoverScene bare />
      </div>
      <div className="hero-wash" aria-hidden />
      <div className="hero-in wrap">
        <div className="mid">
          <p className="tag">
            Gitwork for Coachman &middot; recorded on site, 3 September 2026
          </p>
          <h1 className="dsp sweep">
            One caravan, and nowhere to look it up.
          </h1>
          <p className="lede hero-sub">
            A day at the order desk in Hull. Fourteen spreadsheets each hold a
            piece of one caravan, and not one of them is the caravan.
          </p>
          <div className="hero-cta">
            <a className="btn go" href="#throttle">
              See what it costs
            </a>
            <a className="btn" href="#ask">
              What we need from you
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════ three cards */

function Three() {
  return (
    <section className="sect wrap" id="how">
      <Reveal>
        <div className="mid">
          <p className="tag">How it runs</p>
          <h2 className="h2">
            Sixteen steps to get one caravan out, and nowhere that holds the
            whole of it.
          </h2>
          <p className="lede">
            Every count here comes off the process as it was walked through on
            the day. Where a figure is a simulation or an estimate rather than a
            count, it says so on the figure itself.
          </p>
        </div>
      </Reveal>

      <div className="cards">
        <Reveal>
          <a className="card" href="#season">
            <div className="card-fig">
              <Mini>
                <SeasonTimeline drive={1} />
              </Mini>
            </div>
            <div className="card-say">
              <b>Half of it is waiting</b>
              <span>
                A season of twenty-two caravans run through the process as it
                was described. Simulated, not measured: half of each
                caravan&rsquo;s time comes out as waiting.
              </span>
            </div>
          </a>
        </Reveal>
        <Reveal delay={0.08}>
          <a className="card" href="#journey">
            <div className="card-fig">
              <Mini>
                <VanLedger bare />
              </Mini>
            </div>
            <div className="card-say">
              <b>In two places at once, five times over</b>
              <span>
                Twelve stages down the side, the places a record can be across
                the top. At five stages the same caravan sits in two of them at
                the same time.
              </span>
            </div>
          </a>
        </Reveal>
        <Reveal delay={0.16}>
          <a className="card" href="#people">
            <div className="card-fig">
              <Mini>
                <PeopleGrid drive={0.7} />
              </Mini>
            </div>
            <div className="card-say">
              <b>One desk holds twelve of sixteen</b>
              <span>
                Take that desk out and two steps stop dead, because nobody else
                was described as able to do them.
              </span>
            </div>
          </a>
        </Reveal>
      </div>
    </section>
  );
}

/** A figure shown small, as a picture rather than a thing to operate. */
function Mini({ children }: { children: React.ReactNode }) {
  return (
    <div className="mini-fig" aria-hidden>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ the pinned one */

function Throttle() {
  return (
    <Drive length={3} id="throttle" className="pin">
      {(t) => (
        <div className="pin-grid">
          <div className="frame">
            <HubSim mode="today" drive={t} />
          </div>
          <div className="pin-say">
            <p className="tag">The throttle</p>
            <h2 className="h2">Add volume and the desk runs out of year.</h2>
            <p className="note">
              Every job that touches one caravan, laid out around it. Keep
              scrolling and the volume climbs to a hundred times today&rsquo;s.
              The paper climbs with it, because nothing here gets cheaper per
              caravan: the same things are entered again whether you build two
              thousand or two hundred thousand. Which is why the desk, and not
              the factory, is the ceiling.
            </p>
          </div>
        </div>
      )}
    </Drive>
  );
}

/* ═════════════════════════════════════════════════════════ three moves */

function Moves() {
  return (
    <section className="sect wrap" id="season">
      <Reveal>
        <div className="mid">
          <p className="tag">Where it breaks</p>
          <h2 className="h2">
            The ceiling is the order desk, not the factory.
          </h2>
          <p className="lede">
            Three things follow from that, and none of them gets better by
            spending money on the shop floor.
          </p>
        </div>
      </Reveal>

      <div className="moves">
        <Reveal>
          <article className="move a">
            <div className="move-say">
              <h3 className="h3">Half the time is queueing</h3>
              <p className="note">
                Every row is one caravan, simulated over a season through the
                process as described. Blue is work, red is waiting behind
                something else, and invoicing swallows more of it than anywhere.
              </p>
            </div>
            <div className="move-fig">
              <Mini>
                <SeasonTimeline drive={1} />
              </Mini>
            </div>
          </article>
        </Reveal>
        <Reveal delay={0.08}>
          <article className="move b">
            <div className="move-say">
              <h3 className="h3">One pair of hands</h3>
              <p className="note">
                Sixteen steps, twelve of them on the same desk. When that desk
                is away, two of them stop rather than slow down.
              </p>
            </div>
            <div className="move-fig">
              <Mini>
                <PeopleGrid drive={0.7} />
              </Mini>
            </div>
          </article>
        </Reveal>
        <Reveal delay={0.16}>
          <article className="move c">
            <div className="move-say">
              <h3 className="h3">A ceiling that will not move</h3>
              <p className="note">
                Buy a second production line and a third: the factory&rsquo;s
                ceiling lifts and the desk&rsquo;s stays exactly where it was.
              </p>
            </div>
            <div className="move-fig">
              <Mini>
                <CeilingChart drive={0.92} />
              </Mini>
            </div>
          </article>
        </Reveal>
      </div>
    </section>
  );
}

/* ═════════════════════════════════════════════════════════════ numbers */

function Numbers() {
  return (
    <section className="sect wrap" id="journey">
      <Reveal>
        <div className="mid">
          <p className="tag">What it costs</p>
          <h2 className="h2">
            Thirteen hundred of those hours are the same thing, typed twice.
          </h2>
          <p className="lede">
            Two thousand caravans a year is your figure. The hours are ours: an
            estimate against that volume, because nobody was timed on the day.
            The third number is the part of the second that produces nothing
            new.
          </p>
        </div>
      </Reveal>
      <Reveal delay={0.1}>
        <ul className="nums three">
          <Num n={2000} l="caravans a year" />
          <Num n={1867} l="hours a year on the order desk · estimate" bad />
          <Num n={1333} l="of those hours entering it again · estimate" bad />
        </ul>
      </Reveal>

      <Reveal delay={0.16}>
        <div className="mid" style={{ marginTop: 96 }}>
          <p className="tag">Why</p>
          <h2 className="h2">Nowhere holds the whole caravan.</h2>
          <p className="lede">
            Twelve stages down the side, the five kinds of place a record can be
            across the top; the spreadsheet column stands for the fourteen that
            were mentioned. Where a bar joins two marks, the same unit is sitting
            in two systems at the same time.
          </p>
        </div>
      </Reveal>
      <Reveal delay={0.2}>
        <div className="frame" style={{ marginTop: 40 }}>
          <div className="frame-in">
            <VanLedger />
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Num({ n, l, bad }: { n: number; l: string; bad?: boolean }) {
  return (
    <li className={bad ? "bad" : undefined}>
      <b>
        <Count to={n} />
      </b>
      <span>{l}</span>
    </li>
  );
}

/* ══════════════════════════════════════════════════════════════ broken */

function Broken() {
  return (
    <section className="sect wrap" id="broken">
      <Reveal>
        <div className="mid">
          <p className="tag">What is broken</p>
          <h2 className="h2">Four things are broken, not missing.</h2>
          <p className="lede">And all four are already paid for.</p>
        </div>
      </Reveal>
      <ul className="rows">
        {FAULTS.map(([title, tag, detail, why], i) => (
          <Reveal as="li" key={title} delay={0.05 * i}>
            <i>{String(i + 1).padStart(2, "0")}</i>
            <div>
              <h3 className="h3">{title}</h3>
              <p className="note">{detail}</p>
            </div>
            <p className="why">{why || tag}</p>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

/* ═════════════════════════════════════════════════════════════ we build */

function Build() {
  return (
    <section className="sect wrap" id="build">
      <Reveal>
        <div className="mid">
          <p className="tag">What we build</p>
          <h2 className="h2">Three decisions carry the weight.</h2>
          <p className="lede">
            A product for this kind of manufacturer. Coachman first.
          </p>
        </div>
      </Reveal>
      <div className="cards">
        {DECISIONS.map((d, i) => (
          <Reveal key={d.t} delay={0.07 * i}>
            <article className="card" style={{ cursor: "default" }}>
              <div className="card-say" style={{ padding: "28px 24px 30px" }}>
                <p className="tag" style={{ margin: "0 0 14px" }}>
                  {String(i + 1).padStart(2, "0")}
                </p>
                <b style={{ fontSize: "1.18rem", lineHeight: 1.22 }}>{d.t}</b>
                <span>{d.d}</span>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
      <Reveal delay={0.2}>
        <div className="frame" style={{ marginTop: 52 }}>
          <div className="frame-in">
            <HubSim mode="proposed" />
          </div>
        </div>
      </Reveal>
      <Reveal delay={0.24}>
        <p className="note" style={{ marginTop: 20, maxWidth: "66ch" }}>
          The same order, done once. Twelve stages instead of sixteen steps, one
          record going round one loop, and a single sheet at each stage rather
          than a pile. Drag the volume as far as it goes: the loop runs at the
          same pace, the sheet stays one, and the re-entry stays at nothing.
          That is the whole of the difference. Zoom out and the same twelve
          stages run anywhere.
        </p>
      </Reveal>
    </section>
  );
}

/* ═════════════════════════════════════════════════════════════════ ask */

function Cta() {
  return (
    <section id="ask">
      <div className="cta">
        <Reveal>
          <div className="mid">
            <h2 className="h2">What we need from you.</h2>
            <p className="lede">Five things, and one decision.</p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <ul
            className="nums"
            style={{ maxWidth: 980, margin: "48px auto 0", textAlign: "left" }}
          >
            {ASKS.map((a, i) => (
              <li key={a.t}>
                <b style={{ fontSize: "1.05rem", color: "#fff" }}>
                  {String(i + 1).padStart(2, "0")} &nbsp;{a.t}
                </b>
                <span style={{ color: "rgb(255 255 255 / 0.72)" }}>{a.d}</span>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="pull">
            <p>{QUOTE.text}</p>
            <cite style={{ color: "rgb(255 255 255 / 0.6)" }}>
              {QUOTE.cite}
            </cite>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════ footer */

function Foot() {
  return (
    <footer className="ft">
      <div className="wrap ft-grid">
        <div className="ft-mark">
          <b>Gitwork</b>
          <p>
            Order Flow. A working draft for Coachman, FY26/27. Every figure on
            this page traces back to something said on the day. Where one is an
            estimate against your volume, or the output of a simulation rather
            than a count, it says so where it appears.
          </p>
        </div>
        <div className="ft-col">
          <h4>How it runs</h4>
          <ul>
            <li>
              <a href="#how">How it runs</a>
            </li>
            <li>
              <a href="#throttle">The throttle</a>
            </li>
            <li>
              <a href="#journey">What it costs</a>
            </li>
          </ul>
        </div>
        <div className="ft-col">
          <h4>Where it breaks</h4>
          <ul>
            <li>
              <a href="#season">Where it breaks</a>
            </li>
            <li>
              <a href="#broken">What is broken</a>
            </li>
          </ul>
        </div>
        <div className="ft-col">
          <h4>What we build</h4>
          <ul>
            <li>
              <a href="#build">What we build</a>
            </li>
            <li>
              <a href="#ask">The ask</a>
            </li>
            <li>
              <span>Gitwork Group</span>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
