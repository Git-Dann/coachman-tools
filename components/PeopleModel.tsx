"use client";

import { useMemo } from "react";
import { PEOPLE, ABSENCE_CAVEAT } from "@/content/people";
import { absenceImpact, stepTitle } from "@/lib/model";
import { peopleGraph } from "@/content/graphs";
import { NodeMap3D } from "./NodeMap3D";
import { useLocal } from "@/lib/useLocal";

/**
 * Take someone out and watch the work move.
 *
 * Steps with nobody else described as able to do them stop dead. Steps with
 * partial cover carry on, slower, on somebody who already has a full desk. The
 * counts are steps and re-entry points, not hours, because nobody was timed.
 */
export function PeopleModel({ withMap = true }: { withMap?: boolean }) {
  const [away, setAway] = useLocal<string[]>("away", []);
  const impact = useMemo(() => absenceImpact(away), [away]);
  const graph = useMemo(() => peopleGraph(impact), [impact]);

  const holders = PEOPLE.filter((p) =>
    impact.loads.some((l) => l.personId === p.id),
  );
  const maxLoad = Math.max(
    1,
    ...impact.loads.map((l) => l.steps.length + l.absorbed.length),
  );

  const toggle = (id: string) =>
    setAway((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  return (
    <div className="model-block">
      {withMap ? <NodeMap3D graph={graph} height={300} /> : null}

      <p className="ctl-label">
        Tap anyone to mark them away
        {away.length ? (
          <button type="button" className="mini" onClick={() => setAway([])}>
            Everyone back
          </button>
        ) : null}
      </p>

      <div className="chips-row">
        {holders.map((p) => {
          const on = away.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              className={`pchip${on ? " away" : ""}`}
              aria-pressed={on}
              onClick={() => toggle(p.id)}
            >
              {p.name}
              {on ? <span aria-hidden="true"> away</span> : null}
            </button>
          );
        })}
      </div>

      {/* The headline. Reads before anything else on the slide. */}
      <div className="verdict">
        <div className={`v-cell ${impact.stopped.length ? "bad" : "ok"}`}>
          <b>{impact.stopped.length}</b>
          <span>
            {impact.stopped.length === 1 ? "step stops" : "steps stop"}
          </span>
        </div>
        <div className={`v-cell ${impact.slowed.length ? "warn" : "ok"}`}>
          <b>{impact.slowed.length}</b>
          <span>carry on, slower</span>
        </div>
        <div className="v-cell">
          <b>{16 - impact.stopped.length - impact.slowed.length}</b>
          <span>unaffected</span>
        </div>
      </div>

      {impact.stopped.length > 0 ? (
        <ul className="stop-list">
          {impact.stopped.map((s) => (
            <li key={s}>
              <i aria-hidden="true" />
              <span>
                <b>{stepTitle(s)}</b>
                <small>Nobody else was described as able to do this</small>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Two series: their own work, and what they have picked up. */}
      <p className="ctl-label">Where the work sits</p>
      <ul className="load-legend">
        <li>
          <i style={{ background: "var(--color-steel)" }} aria-hidden="true" />
          Their own steps
        </li>
        <li>
          <i style={{ background: "var(--color-flag)" }} aria-hidden="true" />
          Picked up from someone away
        </li>
      </ul>

      <ul className="loads">
        {impact.loads.map((l) => {
          const own = (l.steps.length / maxLoad) * 100;
          const extra = (l.absorbed.length / maxLoad) * 100;
          return (
            <li key={l.personId} className={l.away ? "gone" : ""}>
              <span className="load-n">
                {l.name}
                {l.away ? <em>away</em> : null}
              </span>
              <span className="load-bar" aria-hidden="true">
                {/* Only draw a fill that represents something. A zero-width
                    bar still shows as a sliver because of the min-width. */}
                {l.steps.length && !l.away ? (
                  <i
                    style={{ width: `${own}%`, background: "var(--color-steel)" }}
                  />
                ) : null}
                {l.absorbed.length ? (
                  <i
                    style={{ width: `${extra}%`, background: "var(--color-flag)" }}
                  />
                ) : null}
              </span>
              <span className="load-v">
                {l.away ? (
                  "0"
                ) : (
                  <>
                    {l.steps.length}
                    {l.absorbed.length ? (
                      <b> +{l.absorbed.length}</b>
                    ) : null}
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="caveat">{ABSENCE_CAVEAT}</p>
    </div>
  );
}
