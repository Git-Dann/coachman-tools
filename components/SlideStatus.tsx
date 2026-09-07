"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Tone = "moss" | "brass" | "flag" | "steel" | "text";

export interface Status {
  /** The one line that changes as the slide is driven. Short. */
  headline: string;
  /** A sentence of why, ideally in their words. */
  detail?: string;
  tone?: Tone;
  /** Up to three live figures, shown above the headline. */
  figures?: { value: string; label: string; tone?: Tone }[];
}

const Ctx = createContext<{
  status: Status | null;
  set: (s: Status | null) => void;
}>({ status: null, set: () => {} });

/**
 * Live state, lifted into the rail beside the headline.
 *
 * The rail used to be a headline, a line of explanation and then a large void,
 * while everything that actually moved sat under the canvas where nobody is
 * pointing during a presentation. A slide publishes its current state here and
 * the rail carries it at size, so the right-hand column reacts as the thing is
 * driven.
 */
export function SlideStatusProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status | null>(null);
  const set = useCallback((s: Status | null) => setStatus(s), []);
  const value = useMemo(() => ({ status, set }), [status, set]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSlideStatus() {
  return useContext(Ctx);
}

/**
 * Publish this slide's live state. Cleared on the way out so a slide never
 * leaves its numbers behind on the next one.
 */
export function usePublishStatus(status: Status | null) {
  const { set } = useSlideStatus();
  const key = JSON.stringify(status);
  useEffect(() => {
    set(status ? (JSON.parse(key) as Status) : null);
    return () => set(null);
    // key is the serialised status, so this fires only on a real change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, set]);
}

/** How the rail renders it. */
export function StatusPanel({ status }: { status: Status }) {
  const tone = (t?: Tone) => (t && t !== "text" ? `var(--color-${t})` : undefined);
  return (
    <div className="status" aria-live="polite">
      {status.figures?.length ? (
        <ul className="status-figs">
          {status.figures.map((f) => (
            <li key={f.label}>
              <b style={{ color: tone(f.tone) }}>{f.value}</b>
              <span>{f.label}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="status-head" style={{ color: tone(status.tone) }}>
        {status.headline}
      </p>
      {status.detail ? <p className="status-detail">{status.detail}</p> : null}
    </div>
  );
}
