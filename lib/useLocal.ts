"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * State kept in this browser only.
 *
 * Your run-through survives a refresh mid-meeting. Anyone else opening the link
 * gets the clean original, because nothing leaves the device. Reads and writes
 * are wrapped: private windows and blocked site data throw on access, and the
 * page has to render correctly with no stored value.
 */
export function useLocal<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(`coachman:${key}`);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      // No stored value available. The initial state is already correct.
    }
    setLoaded(true);
  }, [key]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(`coachman:${key}`, JSON.stringify(v));
        } catch {
          // Storage unavailable. Keep it in memory for this session.
        }
        return v;
      });
    },
    [key],
  );

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(`coachman:${key}`);
    } catch {
      // Nothing to remove.
    }
    setValue(initial);
    // initial is a literal at every call site, so this stays stable in practice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [value, set, { loaded, reset }] as const;
}
