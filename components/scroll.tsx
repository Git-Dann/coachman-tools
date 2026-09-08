"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useScroll, useSpring, useTransform } from "motion/react";
import { motion } from "motion/react";

/**
 * The scroll machinery for the page.
 *
 * Two ideas, and nothing else.
 *
 * REVEAL: a block arrives when it comes into view, once, and stays. Cheap,
 * quiet, and it stops a long page reading as a wall.
 *
 * DRIVE: a figure is pinned while the page scrolls past it, and it is handed a
 * number from 0 to 1 saying how far through that pass you are. The figure uses
 * it to move: volume goes up, a caravan advances, somebody goes off sick. The
 * scroll is the control. Nothing has a play button it needs you to find.
 */

/** Somebody has asked their machine to stop animating things. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(q.matches);
    const on = () => setReduced(q.matches);
    q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, []);
  return reduced;
}

/**
 * A block that arrives on the way in, then leaves itself alone.
 *
 * The obvious version of this is one line of `useInView(once)`, and it has a
 * failure that empties the page: an anchor jump moves a block from below the
 * viewport to above it between two frames, the observer never sees it
 * intersect, and it stays at zero opacity for the rest of the session. Every
 * pill in the bar did that. So arrival is also true for anything the page has
 * already scrolled past, checked on mount and on every hash change, and a block
 * that is already behind you appears without animating, because animating
 * something offscreen is just a delay before you scroll back to it.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "p";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12% 0px -12% 0px" });
  const reduced = useReducedMotion();
  /* null = not arrived. "in" = arrived on the way in. "past" = already behind. */
  const [how, setHow] = useState<null | "in" | "past">(null);

  useEffect(() => {
    if (inView) setHow((h) => h ?? "in");
  }, [inView]);

  useEffect(() => {
    const check = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      /* Reached the top of the screen, or gone off it entirely. */
      if (r.top < window.innerHeight) setHow((h) => h ?? (r.bottom < 0 ? "past" : "in"));
    };
    check();
    window.addEventListener("hashchange", check);
    /* Belt and braces: a flick-scroll can outrun the observer too. */
    window.addEventListener("scroll", check, { passive: true });
    return () => {
      window.removeEventListener("hashchange", check);
      window.removeEventListener("scroll", check);
    };
  }, []);

  const shown = how !== null;
  const instant = reduced || how === "past";
  const M = motion[as] as typeof motion.div;
  return (
    <M
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: shown ? 1 : 0, y: shown ? 0 : 22 }}
      transition={
        instant
          ? { duration: 0 }
          : { duration: 0.7, delay, ease: [0.22, 0.7, 0.25, 1] }
      }
    >
      {children}
    </M>
  );
}

/**
 * A figure pinned while the page scrolls past it.
 *
 * `length` is how much scrolling the pass takes, in screens. Two screens is
 * enough to read a figure and watch it move once; four is right where the
 * figure has a lot to get through.
 */
export function Drive({
  children,
  length = 2.4,
  className = "",
  id,
}: {
  children: (t: number) => React.ReactNode;
  length?: number;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const smooth = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 40,
    restDelta: 0.001,
  });
  const [t, setT] = useState(0);
  useEffect(() => smooth.on("change", (v) => setT(v)), [smooth]);

  return (
    <div
      ref={ref}
      id={id}
      className={`drive ${className}`}
      style={{ height: `${length * 100}svh` }}
    >
      <div className="drive-pin">{children(t)}</div>
    </div>
  );
}

/**
 * A number that counts up to itself when it arrives.
 *
 * Reading a figure land is most of what makes a page feel alive, and it costs
 * nothing: the value is the value, it is only the approach that is animated.
 */
export function Count({
  to,
  format = (n: number) => Math.round(n).toLocaleString("en-GB"),
  className,
}: {
  to: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  /*
   * Fires as soon as any of it is on screen. With an inset margin a figure
   * sitting near the bottom of the first screen showed a zero until you
   * scrolled, which reads as a broken number rather than one about to arrive.
   */
  const seen = useInView(ref, { once: true, margin: "0px 0px -8% 0px" });
  const reduced = useReducedMotion();
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!seen) return;
    if (reduced) {
      setN(to);
      return;
    }
    const start = performance.now();
    const ms = 1100;
    let raf = 0;
    const frame = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      // Ease out, so it settles rather than stopping.
      setN(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [seen, to, reduced]);

  return (
    <span ref={ref} className={className}>
      {format(seen ? n : 0)}
    </span>
  );
}

/** A thin line across the top saying how far down the page you are. */
export function ScrollBar() {
  const { scrollYProgress } = useScroll();
  const w = useSpring(scrollYProgress, { stiffness: 220, damping: 40 });
  const scaleX = useTransform(w, (v) => v);
  return <motion.div className="scrollbar" style={{ scaleX }} aria-hidden />;
}

/**
 * Which ground the page is on, and a re-render when it changes.
 *
 * The WebGL scenes cannot read a CSS variable, so they need telling. Including
 * this in a scene's effect dependencies is what makes it rebuild in the new
 * colours when somebody flips the page over.
 */
export function useGround(): "light" | "dark" {
  const [g, setG] = useState<"light" | "dark">("dark");
  useEffect(() => {
    const el = document.documentElement;
    const read = () =>
      setG(el.dataset.theme === "dark" ? "dark" : "light");
    read();
    const obs = new MutationObserver(read);
    obs.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return g;
}

/**
 * Which section the reader is actually in.
 *
 * Not IntersectionObserver: the pinned section is four screens tall and the
 * short ones are less than one, so "is it intersecting" answers a different
 * question and can be true for three of them at once. This asks the only
 * question the bar needs, which is what you are reading now: of the sections
 * whose top has passed the bar, the last one. Measured against a line just
 * below the bar so a heading counts as arrived when it clears it, not when it
 * touches the bottom of the screen.
 */
export function useActiveSection(ids: readonly string[]): string | null {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    let frame = 0;
    const read = () => {
      frame = 0;
      /* The bar is 88px of it, plus a little so the heading is legible. */
      const line = 140;
      let found: string | null = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= line) found = id;
      }
      /* Right at the bottom the last section wins even if it is short. */
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 4
      ) {
        found = ids[ids.length - 1] ?? found;
      }
      setActive(found);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ids]);
  return active;
}
