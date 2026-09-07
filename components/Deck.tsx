"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CHAPTERS, SLIDES, type ChapterId } from "@/content/slides";

/**
 * The deck.
 *
 * One idea per screen. Swipe on a phone, arrow keys or space on a desktop, and
 * a rail across the top to jump. The detail that used to be the whole document
 * now sits behind a tap on each slide, so the room sees the point and anyone
 * who wants the evidence can go and get it.
 */
export function Deck({ start }: { start: ChapterId }) {
  const first = SLIDES.findIndex((s) => s.chapter === start);
  const [i, setI] = useState(first < 0 ? 0 : first);
  const [detail, setDetail] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const liveRef = useRef<HTMLDivElement>(null);

  const total = SLIDES.length;
  const slide = SLIDES[i];

  const go = useCallback(
    (n: number) => {
      // The updater must stay pure. Calling another setState inside it makes
      // React discard the result under StrictMode's double invocation.
      setI((prev) => Math.max(0, Math.min(total - 1, prev + n)));
      setDetail(false);
    },
    [total],
  );

  const jump = useCallback((n: number) => {
    setI(n);
    setDetail(false);
  }, []);

  // Keep the URL honest as you move between chapters, without a navigation.
  useEffect(() => {
    const path = CHAPTERS.find((c) => c.id === slide.chapter)?.path;
    if (path && window.location.pathname !== path) {
      window.history.replaceState(null, "", path);
    }
  }, [slide.chapter]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      // Don't hijack the arrow keys while someone is using a slider.
      if (el instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(el.tagName)) {
        return;
      }
      if (e.key === "ArrowRight" || e.key === "PageDown") go(1);
      else if (e.key === "ArrowLeft" || e.key === "PageUp") go(-1);
      else if (e.key === " " && !e.shiftKey) {
        e.preventDefault();
        go(1);
      } else if (e.key === "Escape") setDetail(false);
      else if (e.key === "Home") jump(0);
      else if (e.key === "End") jump(total - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, jump, total]);

  const Body = slide.body;
  const Detail = slide.detail;

  return (
    <div className="deck">
      <Rail i={i} onJump={jump} />

      <div
        className="slide-wrap"
        onTouchStart={(e) => {
          const t = e.touches[0];
          touch.current = { x: t.clientX, y: t.clientY };
        }}
        onTouchEnd={(e) => {
          const s = touch.current;
          touch.current = null;
          if (!s) return;
          const t = e.changedTouches[0];
          const dx = t.clientX - s.x;
          const dy = t.clientY - s.y;
          // Horizontal intent only, so vertical scrolling inside a slide works.
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.6) {
            go(dx < 0 ? 1 : -1);
          }
        }}
      >
        <section className="slide" key={slide.id} aria-labelledby={`t-${slide.id}`}>
          <div className="slide-in">
            <p className="slide-kicker">
              <span>{CHAPTERS.find((c) => c.id === slide.chapter)?.name}</span>
              <b>
                {i + 1} / {total}
              </b>
            </p>
            <h1 id={`t-${slide.id}`} className="slide-h">
              {slide.title}
            </h1>
            {slide.standfirst ? (
              <p className="slide-stand">{slide.standfirst}</p>
            ) : null}
            <div className="slide-body">
              <Body />
            </div>
          </div>
        </section>
      </div>

      <div className="deck-bar">
        <button
          type="button"
          className="dbtn"
          onClick={() => go(-1)}
          disabled={i === 0}
          aria-label="Previous slide"
        >
          &#8592;
        </button>

        {Detail ? (
          <button
            type="button"
            className="dbtn wide"
            onClick={() => setDetail(true)}
            aria-haspopup="dialog"
          >
            {slide.detailLabel ?? "Where this comes from"}
          </button>
        ) : (
          <span className="dbtn wide ghost">{slide.footnote ?? ""}</span>
        )}

        <button
          type="button"
          className="dbtn"
          onClick={() => go(1)}
          disabled={i === total - 1}
          aria-label="Next slide"
        >
          &#8594;
        </button>
      </div>

      {detail && Detail ? (
        <Sheet
          title={slide.detailLabel ?? "Where this comes from"}
          onClose={() => setDetail(false)}
        >
          <Detail />
        </Sheet>
      ) : null}

      <div ref={liveRef} className="sr" aria-live="polite">
        {`Slide ${i + 1} of ${total}. ${slide.title}`}
      </div>
    </div>
  );
}

/** The progress rail. Each chapter is a run of ticks you can jump into. */
function Rail({ i, onJump }: { i: number; onJump: (n: number) => void }) {
  return (
    <nav className="rail" aria-label="Slides">
      {CHAPTERS.map((c) => {
        const idx = SLIDES.map((s, n) => ({ s, n })).filter(
          ({ s }) => s.chapter === c.id,
        );
        const active = SLIDES[i].chapter === c.id;
        return (
          <div className={`rail-ch${active ? " on" : ""}`} key={c.id}>
            <button
              type="button"
              className="rail-name"
              onClick={() => onJump(idx[0].n)}
            >
              {c.name}
            </button>
            <span className="rail-ticks">
              {idx.map(({ n }) => (
                <button
                  key={n}
                  type="button"
                  className={`tickm${n === i ? " now" : ""}${n < i ? " done" : ""}`}
                  onClick={() => onJump(n)}
                  aria-label={`Slide ${n + 1}: ${SLIDES[n].title}`}
                  aria-current={n === i ? "step" : undefined}
                />
              ))}
            </span>
          </div>
        );
      })}
    </nav>
  );
}

/** Progressive disclosure. The record, one tap away, never in the way. */
function Sheet({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="sheet-back" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={ref}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-h">
          <b>{title}</b>
          <button type="button" onClick={onClose} aria-label="Close">
            &#10005;
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}
