"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CHAPTERS, SLIDES, type ChapterId } from "@/content/slides";
import {
  SlideStatusProvider,
  StatusPanel,
  useSlideStatus,
} from "./SlideStatus";

/**
 * The deck.
 *
 * One idea per screen. Swipe on a phone, arrow keys or space on a desktop, and
 * a rail across the top to jump. The detail that used to be the whole document
 * now sits behind a tap on each slide, so the room sees the point and anyone
 * who wants the evidence can go and get it.
 */
export function Deck({ start }: { start: ChapterId }) {
  return (
    <SlideStatusProvider>
      <DeckInner start={start} />
    </SlideStatusProvider>
  );
}

function DeckInner({ start }: { start: ChapterId }) {
  const { status } = useSlideStatus();
  const first = SLIDES.findIndex((s) => s.chapter === start);
  const [i, setI] = useState(first < 0 ? 0 : first);
  const [dir, setDir] = useState(1);
  const [detail, setDetail] = useState(false);
  const wheelLock = useRef(0);
  const lastWheel = useRef(0);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const liveRef = useRef<HTMLDivElement>(null);

  const total = SLIDES.length;
  const slide = SLIDES[i];

  const go = useCallback(
    (n: number) => {
      // The updater must stay pure. Calling another setState inside it makes
      // React discard the result under StrictMode's double invocation.
      setDir(n >= 0 ? 1 : -1);
      setI((prev) => Math.max(0, Math.min(total - 1, prev + n)));
      setDetail(false);
    },
    [total],
  );

  const jump = useCallback((n: number) => {
    setI((prev) => {
      setDir(n >= prev ? 1 : -1);
      return n;
    });
    setDetail(false);
  }, []);

  // Keep the URL honest as you move between chapters, without a navigation.
  useEffect(() => {
    const path = CHAPTERS.find((c) => c.id === slide.chapter)?.path;
    if (path && window.location.pathname !== path) {
      window.history.replaceState(null, "", path);
    }
  }, [slide.chapter]);

  /*
   * A wheel or trackpad gesture moves between slides.
   *
   * It defers to anything that can still scroll itself, so a long evidence
   * sheet or an overflowing stage keeps its own scrolling, and it only takes
   * over once that has hit its end. A cooldown stops one flick of a trackpad
   * throwing three slides past.
   */
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (detail) return;
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      if (Math.abs(e.deltaY) < 8) return;

      // The target is not always an element (a wheel event can land on the
      // window), and getComputedStyle would throw on anything that is not.
      let el =
        e.target instanceof Element ? (e.target as HTMLElement) : null;
      while (el && el !== document.body) {
        const style = getComputedStyle(el);
        const scrolls = /auto|scroll/.test(style.overflowY);
        if (scrolls && el.scrollHeight > el.clientHeight + 2) {
          const atTop = el.scrollTop <= 0;
          const atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
          if ((e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atEnd)) return;
        }
        el = el.parentElement;
      }

      /*
       * One gesture, one slide. A trackpad flick arrives as a burst of events
       * with momentum behind it, so anything still inside that burst is folded
       * into the gesture that started it rather than counted again.
       */
      const now = Date.now();
      const continuing = now - lastWheel.current < 160;
      lastWheel.current = now;
      if (continuing) return;
      if (now - wheelLock.current < 700) return;
      wheelLock.current = now;
      go(e.deltaY > 0 ? 1 : -1);
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, [go, detail]);

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
  const Aside = slide.aside;
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
        <section
          className={`slide ${dir > 0 ? "fwd" : "back"}`}
          key={slide.id}
          aria-labelledby={`t-${slide.id}`}
        >
          {/* Desktop puts the interactive thing first and biggest, with the
              words in a narrow rail beside it. Phones stack, words first. */}
          <div className={`slide-grid${slide.wide ? " wide" : ""}`}>
            <div className="stage">
              <Body />
            </div>
            <div className="aside">
              <p className="slide-kicker">
                <span>{CHAPTERS.find((c) => c.id === slide.chapter)?.name}</span>
                <b>
                  {i + 1} / {total}
                </b>
              </p>
              <h1 id={`t-${slide.id}`} className="slide-h">
                {slide.title}
              </h1>
              {slide.line ? <p className="slide-line">{slide.line}</p> : null}
              {status ? <StatusPanel status={status} /> : null}
              {Aside ? (
                <div className="aside-body">
                  <Aside />
                </div>
              ) : null}
              {Detail ? (
                <button
                  type="button"
                  className="basis"
                  onClick={() => setDetail(true)}
                  aria-haspopup="dialog"
                >
                  {slide.detailLabel ?? "Where this comes from"}
                </button>
              ) : null}
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

        <span className="dbtn wide ghost">
          {slide.footnote ?? (i === 0 ? "Arrow keys to move · click the rail to jump" : slide.title)}
        </span>

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
