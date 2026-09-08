"use client";

import { useMemo } from "react";
import { PEOPLE, ASSIGNMENTS } from "@/content/people";
import { STEPS } from "@/content/steps";
import { absenceImpact } from "@/lib/model";
import { useLocal } from "@/lib/useLocal";
import { usePublishStatus } from "./SlideStatus";

/**
 * Who holds the sixteen steps, and what happens when somebody is away.
 *
 * This used to be a node map with five stacked blocks of bars and lists beside
 * it. It was a dashboard: five things to read before the point arrived, and the
 * point is a single glance. Twelve of the sixteen steps are held by one desk.
 *
 * So it is sixteen cells, one per step, each saying who holds it. With nobody
 * away, twelve of them say the same name, and you can see that without reading
 * anything. Take that person out and their cells either change hands, in which
 * case they go amber and name whoever picks them up, or they stop dead and go
 * red, because nobody else was described as able to do them.
 *
 * Colour says the state, not the person. Five people would need a categorical
 * palette this project does not have one of that passes a colour-blindness
 * check; held, picked up and stopped is three states on a ramp that does.
 */

type State = "held" | "picked" | "stopped";

export function PeopleGrid() {
  const [away, setAway] = useLocal<string[]>("away", []);
  const impact = useMemo(() => absenceImpact(away), [away]);

  /** The name against each step now, and how it got there. */
  const cells = useMemo(() => {
    const stopped = new Set(impact.stopped);
    return STEPS.map((step) => {
      const owner = ASSIGNMENTS.find((a) => a.stepId === step.n);
      const holder = impact.loads.find((l) => l.steps.includes(step.n));
      const picker = impact.loads.find((l) => l.absorbed.includes(step.n));
      const state: State = stopped.has(step.n)
        ? "stopped"
        : picker
          ? "picked"
          : "held";
      return {
        n: step.n,
        title: step.t,
        state,
        who: stopped.has(step.n)
          ? "Nobody"
          : (picker?.name ?? holder?.name ?? "—"),
        from: owner
          ? (PEOPLE.find((p) => p.id === owner.ownerId)?.name ?? null)
          : null,
        slower: impact.slowed.includes(step.n),
      };
    });
  }, [impact]);

  /** Who is carrying how much, so the load shows as well as the state. */
  const holders = useMemo(
    () =>
      impact.loads
        .filter((l) => l.steps.length + l.absorbed.length > 0 || l.away)
        .map((l) => ({
          id: l.personId,
          name: l.name,
          away: l.away,
          own: l.away ? 0 : l.steps.length,
          extra: l.absorbed.length,
        })),
    [impact],
  );
  const maxLoad = Math.max(1, ...holders.map((h) => h.own + h.extra));

  const stoppedN = impact.stopped.length;
  const slowedN = impact.slowed.length;

  usePublishStatus({
    headline:
      away.length === 0
        ? "Everything runs, on one pair of hands."
        : stoppedN > 0
          ? `${stoppedN} ${stoppedN === 1 ? "step stops" : "steps stop"} dead.`
          : "Everything still runs, slower.",
    detail:
      away.length === 0
        ? "Take somebody out below and watch their cells change hands, or stop."
        : stoppedN > 0
          ? "Nobody else was described as able to do them. Not slower. Stopped."
          : "The work moves onto people who already have a full desk.",
    tone: stoppedN > 0 ? "flag" : away.length ? "brass" : "steel",
    figures: [
      {
        value: String(stoppedN),
        label: "steps stop",
        tone: stoppedN ? "flag" : "moss",
      },
      {
        value: String(slowedN),
        label: "carry on, slower",
        tone: slowedN ? "brass" : "moss",
      },
      {
        value: String(STEPS.length - stoppedN - slowedN),
        label: "unaffected",
      },
    ],
  });

  const toggle = (id: string) =>
    setAway((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  return (
    <div className="pgrid">
      <div className="pgrid-view">
        <ol className="pg-cells">
          {cells.map((c) => (
            <li key={c.n} className={`pg-cell ${c.state}`}>
              <b>{c.n < 10 ? `0${c.n}` : c.n}</b>
              <span className="pg-t">{c.title}</span>
              <span className="pg-who">
                {c.who}
                {c.slower ? <em>slower</em> : null}
              </span>
              {c.state !== "held" && c.from ? (
                <span className="pg-from">was {c.from}</span>
              ) : null}
            </li>
          ))}
        </ol>
      </div>

      <ul className="pg-key" aria-label="What the colours mean">
        <li>
          <i className="k-held" />
          held by the person named
        </li>
        <li>
          <i className="k-picked" />
          picked up by somebody else
        </li>
        <li>
          <i className="k-stopped" />
          stops, nobody else can do it
        </li>
      </ul>

      <div className="pg-ctl">
        <span className="pg-ctl-label">Take someone out</span>
        {holders.map((h) => (
          <button
            key={h.id}
            type="button"
            className={`pchip${h.away ? " away" : ""}`}
            aria-pressed={h.away}
            onClick={() => toggle(h.id)}
          >
            {h.name}
            <span className="pchip-bar" aria-hidden="true">
              <i
                style={{ width: `${(h.own / maxLoad) * 100}%` }}
                className="own"
              />
              <i
                style={{ width: `${(h.extra / maxLoad) * 100}%` }}
                className="extra"
              />
            </span>
            <b>
              {h.away ? "away" : h.own + (h.extra ? `+${h.extra}` : "")}
            </b>
          </button>
        ))}
        {away.length ? (
          <button type="button" className="mini" onClick={() => setAway([])}>
            Everyone back
          </button>
        ) : null}
      </div>
    </div>
  );
}
