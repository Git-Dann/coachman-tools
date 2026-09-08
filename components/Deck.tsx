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
  const [index, setIndex] = useState(false);
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
      setIndex(false);
    },
    [total],
  );

  const jump = useCallback((n: number) => {
    setI((prev) => {
      setDir(n >= prev ? 1 : -1);
      return n;
    });
    setDetail(false);
    setIndex(false);
  }, []);

  // Keep the URL honest as you move between chapters, without a navigation.
  useEffect(() => {
    const path = CHAPTERS.find((c) => c.id === slide.chapter)?.path;
    if (path && window.location.pathname !== path) {
      window.history.replaceState(null, "", path);
    }
  }, [slide.chapter]);

  /*
   * The wheel does not move between slides.
   *
   * It used to, and it was wrong: a scroll wheel is for scrolling, and hijacking
   * it meant a flick aimed at a long evidence sheet threw the whole deck two
   * slides sideways. Arrows, space, the rail and the buttons move the deck.
   */

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
      } else if (e.key === "Escape") {
        setDetail(false);
        setIndex(false);
      }
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
          <div className={`slide-grid ${slide.kind}`}>
            <div className="stage">
              <Body />
            </div>
            {/* Split in two so a phone can put the scene between them: the
                headline sets up what you are looking at, the scene comes next,
                and everything that reads off it follows underneath. On a
                desktop the two halves sit together in the right-hand column. */}
            <div className="aside">
              <div className="aside-head">
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
              </div>
              <div className="aside-rest">
                {status ? <StatusPanel status={status} /> : null}
                {Aside ? (
                  <div className="aside-body">
                    <Aside />
                  </div>
                ) : null}
                {slide.footnote ? (
                  <p className="slide-foot">{slide.footnote}</p>
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
          </div>
        </section>
      </div>

      {/* Back, contents, next. The middle used to be a dead caption repeating
          the headline, which on a phone was most of the bar doing nothing. */}
      <div className="deck-bar">
        <button
          type="button"
          className="dbtn prev"
          onClick={() => go(-1)}
          disabled={i === 0}
          aria-label={i === 0 ? "Previous slide" : `Back to ${SLIDES[i - 1].marker}`}
        >
          <span aria-hidden="true">&#8592;</span>
          <em>{i === 0 ? "Start" : SLIDES[i - 1].marker}</em>
        </button>

        <button
          type="button"
          className="dbtn contents"
          onClick={() => setIndex(true)}
          // The word is hidden on a phone to keep the two named buttons either
          // side readable, so the label has to carry it.
          aria-label={`Contents. Slide ${i + 1} of ${total}`}
          aria-haspopup="dialog"
          aria-expanded={index}
        >
          <b>
            {i + 1}/{total}
          </b>
          <span>Contents</span>
        </button>

        <button
          type="button"
          className="dbtn next"
          onClick={() => go(1)}
          disabled={i === total - 1}
          aria-label={
            i === total - 1 ? "Next slide" : `On to ${SLIDES[i + 1].marker}`
          }
        >
          <em>{i === total - 1 ? "End" : SLIDES[i + 1].marker}</em>
          <span aria-hidden="true">&#8594;</span>
        </button>
      </div>

      {index ? (
        <Sheet title="Contents" onClose={() => setIndex(false)}>
          <ol className="idx">
            {SLIDES.map((sl, n) => (
              <li key={sl.id}>
                <button
                  type="button"
                  className={`idx-row${n === i ? " now" : ""}`}
                  onClick={() => jump(n)}
                  aria-current={n === i ? "step" : undefined}
                >
                  <b>{String(n + 1).padStart(2, "0")}</b>
                  <span>
                    <em>{sl.marker}</em>
                    <i>{CHAPTERS.find((c) => c.id === sl.chapter)?.name}</i>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </Sheet>
      ) : null}

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

/**
 * The progress rail. One line, everywhere.
 *
 * It used to name all three chapters across the full width of the window on a
 * desktop and something different on a phone. On a wide screen that put three
 * headings floating over eleven ticks stretched across two thousand pixels,
 * and it was two navigations to maintain. This is the one that worked: where
 * you are on the left, how far through on the right, and one bar of ticks with
 * a gap where the chapter changes. Capped and centred, so it stays a component
 * rather than growing with the window.
 */
function Rail({ i, onJump }: { i: number; onJump: (n: number) => void }) {
  const here = SLIDES[i];
  const chapter = CHAPTERS.find((c) => c.id === here.chapter);
  return (
    <nav className="rail" aria-label="Slides">
      <div className="rail-in">
        <p className="rail-where">
          <span>{chapter?.name}</span>
          <em>{here.marker}</em>
          <i>
            {i + 1}/{SLIDES.length}
          </i>
        </p>
        <div className="rail-chs">
          {CHAPTERS.map((c) => {
            const idx = SLIDES.map((s, n) => ({ s, n })).filter(
              ({ s }) => s.chapter === c.id,
            );
            const active = here.chapter === c.id;
            return (
              // Sized by slide count, so every tick is the same width and a
              // two-slide chapter does not get the room of a five.
              <div
                className={`rail-ch${active ? " on" : ""}`}
                key={c.id}
                style={{ flexGrow: idx.length }}
              >
                <span className="rail-ticks">
                  {idx.map(({ n }) => (
                    <button
                      key={n}
                      type="button"
                      className={`tickm${n === i ? " now" : ""}${n < i ? " done" : ""}`}
                      onClick={() => onJump(n)}
                      title={`${c.name} · ${SLIDES[n].marker}`}
                      aria-label={`Slide ${n + 1}: ${SLIDES[n].title}`}
                      aria-current={n === i ? "step" : undefined}
                    />
                  ))}
                </span>
              </div>
            );
          })}
        </div>
      </div>
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
