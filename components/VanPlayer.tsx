"use client";

import { useState } from "react";
import { VAN, VAN_UNIT, VAN_UNIT_NOTE } from "@/content/van";
import { OPS } from "@/content/copy";
import { SectionHead } from "./Shell";

/**
 * Follow one caravan. Twelve stages, forward and back plus a clickable track.
 *
 * The track scrolls horizontally on a phone while the arrow controls stay put
 * above it, so the whole thing is usable one-handed.
 */
export function VanPlayer() {
  const [i, setI] = useState(0);
  const stage = VAN[i];
  const [name, detail, livesIn, handledBy, reEntry] = stage;
  const last = VAN.length - 1;

  function go(delta: number) {
    setI((n) => Math.max(0, Math.min(last, n + delta)));
  }

  return (
    <section aria-labelledby="van-h">
      <SectionHead n={OPS.van.n} title={OPS.van.h2} id="van-h" />
      <p className="lead">{OPS.van.lead}</p>

      <div className="van">
        <div className="van-top">
          <div className="van-id">
            {VAN_UNIT} · {OPS.van.stageOf(i + 1, VAN.length)}
            <small>{VAN_UNIT_NOTE}</small>
          </div>
          <div className="van-ctl">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={i === 0}
              aria-label={OPS.van.prev}
            >
              &#8592;
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              disabled={i === last}
              aria-label={OPS.van.next}
            >
              &#8594;
            </button>
          </div>
        </div>

        <div className="track" role="tablist" aria-label={OPS.van.h2}>
          {VAN.map(([stageName], n) => (
            <button
              key={stageName}
              type="button"
              role="tab"
              className={`tick${n < i ? " done" : ""}${n === i ? " now" : ""}`}
              aria-selected={n === i}
              aria-label={`${n + 1}. ${stageName}`}
              onClick={() => setI(n)}
            />
          ))}
        </div>

        <div aria-live="polite">
          <p className="van-stage">{name}</p>
          <p className="van-desc">{detail}</p>
          <dl className="van-meta">
            <div>
              <dt>{OPS.van.livesIn}</dt>
              <dd>{livesIn}</dd>
            </div>
            <div>
              <dt>{OPS.van.handledBy}</dt>
              <dd>{handledBy}</dd>
            </div>
            <div>
              <dt>{OPS.van.reEntry}</dt>
              <dd
                style={{
                  color:
                    reEntry === "0"
                      ? "var(--color-moss)"
                      : "var(--color-flag)",
                }}
              >
                {reEntry}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
