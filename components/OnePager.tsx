"use client";

import { CoverScene } from "./CoverScene";
import { HubSim } from "./HubSim";
import { SeasonTimeline } from "./SeasonTimeline";
import { VanJourney } from "./VanJourney";
import { PeopleGrid } from "./PeopleGrid";
import { CeilingChart } from "./CeilingChart";
import { HoursModel } from "./HoursModel";
import { Count, Drive, Reveal, ScrollBar } from "./scroll";
import { FAULTS } from "@/content/faults";
import { DECISIONS, ASKS, QUOTE } from "@/content/page";

/**
 * One page.
 *
 * The deck this replaced asked you to drive it: find the play button, find the
 * slider, work out what the colours meant, press next. Eleven times. A page
 * asks for one thing, which everybody already knows how to do, and the figures
 * move because you are scrolling past them.
 *
 * Structure: an argument in six moves, in Gitwork's colours.
 *
 *   1  the picture      one caravan, fourteen places holding a piece of it
 *   2  the throttle     sixteen jobs, twenty of them done twice
 *   3  built properly   the same order with nothing entered twice
 *   4  the season       where the time actually goes
 *   5  one caravan      the record changing hands, five places, seven times
 *   6  who holds it     one desk, twelve of the sixteen steps
 *   7  the ceiling      the desk, not the factory
 *   8  what it costs    the manual work, in hours
 *   9  what is broken   four faults, already paid for
 *  10  what we build    three decisions
 *  11  the ask          five things and a date
 */
export function OnePager() {
  return (
    <>
      <ScrollBar />
      <Grain />
      <Mast />

      <main id="top">
        {/* ────────────────────────────────────────────────────── hero */}
        <section className="hero">
          <div className="hero-scene" aria-hidden>
            <CoverScene bare />
          </div>
          <div className="hero-wash" aria-hidden />
          <div className="hero-in">
            <Reveal>
              <p className="eyebrow">
                <span>Gitwork</span> for Coachman &middot; recorded on site, 3
                September 2026
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="display">
                One caravan.
                <br />
                <em>Nowhere to look it up.</em>
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="lede">
                A day at the order desk in Hull. Fourteen places each hold a
                piece of one caravan, and none of them is the caravan.
              </p>
            </Reveal>
            <Reveal delay={0.24}>
              <ul className="hero-figs">
                <Fig n={16} l="steps to get one caravan out" />
                <Fig n={20} l="points the same work is done twice" tone="bad" />
                <Fig n={14} l="places hold a piece of one van" tone="bad" />
                <Fig n={3} l="seasons before the record is gone" tone="bad" />
              </ul>
            </Reveal>
            <Reveal delay={0.32}>
              <p className="scroll-cue">Scroll</p>
            </Reveal>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────── throttle */}
        <Chapter n="01" name="How it runs" />

        <Drive length={3.6} id="throttle">
          {(t) => (
            <Stage
              kicker="The throttle"
              title="Sixteen jobs. Twenty done twice."
              body="Every job that touches a caravan, ringed around it and joined to it. The stack on each one is the number of times the same information gets entered again. Keep scrolling and the volume goes up."
              figure={<HubSim mode="today" drive={t} />}
            />
          )}
        </Drive>

        <Drive length={3.2} id="built">
          {(t) => (
            <Stage
              kicker="Built properly"
              title="The same order, nothing entered twice."
              body="Twelve stages and no re-entry, so the work per caravan stops growing and the desk stops being the ceiling. Add as much volume as you like. It stays green."
              figure={<HubSim mode="proposed" drive={t} />}
            />
          )}
        </Drive>

        {/* ───────────────────────────────────────────────── the season */}
        <Drive length={4} id="season">
          {(t) => (
            <Stage
              kicker="Run the season"
              title="Half of it is waiting."
              body="Twenty-two caravans through the process as it runs today. Every row is one caravan and every cell is a moment: blue where somebody is working on it, red where it is sitting behind something else. The percentage is not a claim. It is the red."
              figure={<SeasonTimeline drive={t} />}
            />
          )}
        </Drive>

        {/* ────────────────────────────────────────── follow one caravan */}
        <Drive length={3.6} id="journey">
          {(t) => (
            <Stage
              kicker="Follow one"
              title="One caravan, five places."
              body="The record of a single unit, stage by stage. The line is it changing hands: where the line jumps a lane, somebody carried something between two systems. Seven crossings in twelve stages."
              figure={<VanJourney drive={t} />}
            />
          )}
        </Drive>

        {/* ─────────────────────────────────────────────── who holds it */}
        <Chapter n="02" name="Where it breaks" />

        <Drive length={3.2} id="people">
          {(t) => (
            <Stage
              kicker="Who holds it"
              title="One desk holds twelve of sixteen."
              body="Sixteen steps, each naming who does it. Keep scrolling and that desk goes away: amber is work somebody else picks up, red is work that stops, because nobody else was described as able to do it."
              figure={<PeopleGrid drive={t} />}
            />
          )}
        </Drive>

        {/* ─────────────────────────────────────────────── the ceiling */}
        <Drive length={3.6} id="ceiling">
          {(t) => (
            <Stage
              kicker="The ceiling"
              title="The desk is the ceiling, not the factory."
              body="Demand rises, then the factory gets a second line and a third. Watch which ceiling moves. Everything above the lower one is work the business turns away."
              figure={<CeilingChart drive={t} />}
            />
          )}
        </Drive>

        {/* ────────────────────────────────────────────── what it costs */}
        <section className="band" id="costs">
          <div className="band-in">
            <Reveal>
              <p className="kicker">What it costs</p>
              <h2 className="h2">Four tasks, a fifth of a person&rsquo;s year.</h2>
              <p className="body">
                Your volumes, and minutes per task you can correct. Nobody was
                timed on the day, so the minutes are estimates and the page says
                so. Their own estimate of what the first three wish-list items
                would give back was about twenty per cent.
              </p>
            </Reveal>
            <Reveal delay={0.1} className="band-fig">
              <HoursModel />
            </Reveal>
          </div>
        </section>

        {/* ──────────────────────────────────────────── what is broken */}
        <section className="band alt" id="broken">
          <div className="band-in">
            <Reveal>
              <p className="kicker">What is broken</p>
              <h2 className="h2">Four things are broken.</h2>
              <p className="body">
                Not missing. Broken, and already paid for.
              </p>
            </Reveal>
            <ul className="cardgrid">
              {FAULTS.map(([title, tag, detail, why], i) => (
                <Reveal as="li" key={title} delay={0.06 * i}>
                  <article className={`fcard${i === 0 ? " first" : ""}`}>
                    <p className="fnum">
                      {String(i + 1).padStart(2, "0")}
                      <i>{tag}</i>
                    </p>
                    <h3>{title}</h3>
                    <p>{detail}</p>
                    {why ? <p className="fwhy">{why}</p> : null}
                  </article>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* ─────────────────────────────────────────── what we build */}
        <Chapter n="03" name="What we build" />

        <section className="band" id="decisions">
          <div className="band-in">
            <Reveal>
              <p className="kicker">Three decisions</p>
              <h2 className="h2">Three decisions carry the weight.</h2>
              <p className="body">
                A product for this kind of manufacturer. Coachman first.
              </p>
            </Reveal>
            <ul className="cardgrid three">
              {DECISIONS.map((d, i) => (
                <Reveal as="li" key={d.t} delay={0.06 * i}>
                  <article className="fcard lift">
                    <p className="fnum">{String(i + 1).padStart(2, "0")}</p>
                    <h3>{d.t}</h3>
                    <p>{d.d}</p>
                  </article>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* ───────────────────────────────────────────────────── the ask */}
        <section className="band ask" id="ask">
          <div className="band-in">
            <Reveal>
              <p className="kicker">The ask</p>
              <h2 className="h2">What we need from you.</h2>
              <p className="body">Five things, and one decision.</p>
            </Reveal>
            <ol className="asklist">
              {ASKS.map((a, i) => (
                <Reveal as="li" key={a.t} delay={0.05 * i}>
                  <span className="asknum">{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    <b>{a.t}</b>
                    <i>{a.d}</i>
                  </span>
                </Reveal>
              ))}
            </ol>
            <Reveal delay={0.3}>
              <blockquote className="pull">
                <p>{QUOTE.text}</p>
                <cite>{QUOTE.cite}</cite>
              </blockquote>
            </Reveal>
          </div>
        </section>

        <footer className="foot">
          <div className="band-in">
            <p className="footmark">
              <b>Gitwork</b> <span>Order Flow</span>
            </p>
            <p className="footnote">
              Working draft for Coachman, FY26/27. Every figure on this page
              traces to something said on the day; where a number is an estimate
              it says so where it appears.
            </p>
            <a className="foottop" href="#top">
              Back to the top
            </a>
          </div>
        </footer>
      </main>
    </>
  );
}

/* --------------------------------------------------------------- pieces */

/** One figure, pinned, with its words beside it. */
function Stage({
  kicker,
  title,
  body,
  figure,
}: {
  kicker: string;
  title: string;
  body: string;
  figure: React.ReactNode;
}) {
  return (
    <div className="stagegrid">
      <div className="stagefig">{figure}</div>
      <div className="stagesay">
        <p className="kicker">{kicker}</p>
        <h2 className="h2">{title}</h2>
        <p className="body">{body}</p>
      </div>
    </div>
  );
}

/** A chapter marker, so a long page still has a shape. */
function Chapter({ n, name }: { n: string; name: string }) {
  return (
    <Reveal as="section" className="chapter">
      <p>
        <span>{n}</span>
        {name}
      </p>
    </Reveal>
  );
}

function Fig({
  n,
  l,
  tone,
}: {
  n: number;
  l: string;
  tone?: "bad";
}) {
  return (
    <li className={tone === "bad" ? "bad" : undefined}>
      <b>
        <Count to={n} />
      </b>
      <span>{l}</span>
    </li>
  );
}

/**
 * The grain.
 *
 * A single tile of filtered noise, laid over the whole page and left there.
 * It is what stops a flat dark ground reading as a screenshot of a terminal,
 * and it is four lines rather than a subscription to a texture library.
 */
function Grain() {
  return (
    <div className="grain" aria-hidden>
      <svg width="0" height="0">
        <filter id="grain-f">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.78"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>
    </div>
  );
}

function Mast() {
  return (
    <header className="mast">
      <a className="mastmark" href="#top">
        <b>Gitwork</b>
        <span>Order Flow</span>
      </a>
      <nav className="mastnav" aria-label="Sections">
        <a href="#throttle">How it runs</a>
        <a href="#people">Where it breaks</a>
        <a href="#decisions">What we build</a>
        <a href="#ask">The ask</a>
      </nav>
    </header>
  );
}
