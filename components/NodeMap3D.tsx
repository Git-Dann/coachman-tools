"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  TONE_HEX,
  hitTest,
  project,
  type Graph,
  type Node3D,
  type Projected,
} from "@/lib/graph3d";

/**
 * The 3D node map.
 *
 * Drag or swipe to turn it, tap a node to read it. Auto-rotates gently until
 * touched, and not at all if the viewer has asked for reduced motion. Every
 * node is also reachable from the keyboard through the list underneath, so the
 * canvas is never the only way to get at the information.
 */
export function NodeMap3D({
  graph,
  height = 340,
  fill = false,
  onSelect,
}: {
  graph: Graph;
  height?: number;
  /** Grow to whatever room the stage has, rather than a fixed height. */
  fill?: boolean;
  onSelect?: (node: Node3D | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const projRef = useRef<Projected[]>([]);
  const rot = useRef({ yaw: 0.6, pitch: -0.25 });
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const spin = useRef(true);
  const graphRef = useRef(graph);
  graphRef.current = graph;

  const [selected, setSelected] = useState<string | null>(null);
  const selRef = useRef<string | null>(null);
  selRef.current = selected;

  const pick = useCallback(
    (id: string | null) => {
      setSelected(id);
      onSelect?.(graphRef.current.nodes.find((n) => n.id === id) ?? null);
    },
    [onSelect],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) spin.current = false;

    let raf = 0;
    let w = 0;
    let h = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      const g = graphRef.current;
      if (spin.current && !reduced) rot.current.yaw += 0.0022;

      // Lean on the shorter side but not too timidly, or the graph
      // sits in a small island in the middle of a big frame.
      const radius = Math.min(w * 0.30, h * 0.40);
      const p = project(g.nodes, rot.current.yaw, rot.current.pitch, w, h, radius);
      projRef.current = p;
      const at = new Map(p.map((q) => [q.node.id, q]));

      ctx.clearRect(0, 0, w, h);

      // Links first, so nodes always sit on top of their own threads.
      for (const l of g.links) {
        const a = at.get(l.from);
        const b = at.get(l.to);
        if (!a || !b) continue;
        const depth = (a.k + b.k) / 2;
        ctx.save();
        ctx.lineWidth = l.active ? 2 : 1;
        ctx.strokeStyle = l.active
          ? `rgba(228,89,60,${Math.min(1, depth * 0.85)})`
          : `rgba(53,66,78,${Math.min(1, depth * 0.75)})`;
        if (l.broken) ctx.setLineDash([3, 5]);
        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        ctx.lineTo(b.sx, b.sy);
        ctx.stroke();
        ctx.restore();
      }

      for (const q of p) {
        const n = q.node;
        const isSel = selRef.current === n.id;
        // Depth fade. Far nodes recede rather than crowding the near ones.
        const alpha = Math.max(0.25, Math.min(1, (q.k - 0.55) * 1.9));
        const hex = TONE_HEX[n.tone];

        ctx.save();
        ctx.globalAlpha = n.faded ? alpha * 0.4 : alpha;

        // A ring marks the node the slide is about, or the one you tapped.
        if (n.pinned || isSel) {
          ctx.beginPath();
          ctx.arc(q.sx, q.sy, q.r + 6, 0, Math.PI * 2);
          ctx.strokeStyle = hex;
          ctx.lineWidth = isSel ? 2 : 1;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(q.sx, q.sy, q.r, 0, Math.PI * 2);
        ctx.fillStyle = hex;
        ctx.fill();
        // A 2px ring in the page colour, so overlapping nodes stay countable.
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#0C1116";
        ctx.stroke();
        ctx.restore();
      }

      /*
       * Labels last, in their own pass.
       *
       * Drawing a label next to each node as we go produces soup: near labels
       * land on top of far ones and nothing is readable. Instead: rank by what
       * matters (what you tapped, then what the slide is about, then whatever
       * is closest), and only place a label if its box is still clear. Anything
       * that would collide is dropped, so what remains is always legible.
       */
      const placed: { x1: number; y1: number; x2: number; y2: number }[] = [];
      const ranked = [...p].sort((a, bq) => {
        const pri = (q: typeof a) =>
          (selRef.current === q.node.id ? 2 : 0) + (q.node.pinned ? 1 : 0);
        return pri(bq) - pri(a) || bq.k - a.k;
      });

      for (const q of ranked) {
        const n = q.node;
        const isSel = selRef.current === n.id;
        if (q.k < 0.9 && !isSel && !n.pinned) continue;

        const size = Math.max(10, Math.min(12.5, 11 * q.k));
        ctx.font = `${isSel ? 600 : 500} ${size}px ui-sans-serif, system-ui, sans-serif`;
        const tw = ctx.measureText(n.label).width;

        // Keep the whole label on the canvas, never clipped at an edge.
        const x = Math.max(tw / 2 + 4, Math.min(w - tw / 2 - 4, q.sx));

        // Try under the node first, then over it. A label that will not fit
        // either way is dropped rather than stacked on top of its neighbour.
        // Nothing is lost: every node is clickable, and listed underneath.
        const boxAt = (yy: number) => ({
          x1: x - tw / 2 - 5,
          y1: yy - size - 4,
          x2: x + tw / 2 + 5,
          y2: yy + 8,
        });
        const clashes = (bx: ReturnType<typeof boxAt>) =>
          placed.some(
            (b) => bx.x1 < b.x2 && bx.x2 > b.x1 && bx.y1 < b.y2 && bx.y2 > b.y1,
          );

        let y = q.sy + q.r + 12;
        let box = boxAt(y);
        if (clashes(box) || y > h - 4) {
          const up = q.sy - q.r - 7;
          const upBox = boxAt(up);
          if (!clashes(upBox) && up > size + 4) {
            y = up;
            box = upBox;
          } else if (!isSel) {
            continue;
          }
        }
        placed.push(box);

        const alpha = Math.max(0.25, Math.min(1, (q.k - 0.55) * 1.9));
        ctx.save();
        // Whoever is missing still has to be readable: the gap is the point.
        ctx.globalAlpha = n.faded ? Math.max(0.6, alpha * 0.8) : Math.min(1, alpha + 0.15);
        // A thin halo in the page colour keeps text off the links behind it.
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#0C1116";
        ctx.textAlign = "center";
        ctx.strokeText(n.label, x, y);
        ctx.fillStyle = isSel ? "#E9EFF3" : "#9DAFBA";
        ctx.fillText(n.label, x, y);
        ctx.restore();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const pointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, moved: false };
    spin.current = false;
  };

  const pointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
    rot.current.yaw += dx * 0.008;
    rot.current.pitch = Math.max(
      -1.2,
      Math.min(1.2, rot.current.pitch + dy * 0.006),
    );
    d.x = e.clientX;
    d.y = e.clientY;
  };

  const pointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.moved) return;
    // A tap, not a drag. Pick whatever is under the finger.
    const rect = e.currentTarget.getBoundingClientRect();
    const hit = hitTest(
      projRef.current,
      e.clientX - rect.left,
      e.clientY - rect.top,
    );
    pick(hit && hit.id === selected ? null : (hit?.id ?? null));
  };

  const node = graph.nodes.find((n) => n.id === selected) ?? null;

  return (
    <div className={`map${fill ? " fill" : ""}`}>
      <canvas
        ref={canvasRef}
        className="map-canvas"
        style={fill ? undefined : { height }}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={() => (drag.current = null)}
        role="img"
        aria-label={graph.caption}
      />

      <div className="map-read" aria-live="polite">
        {node ? (
          <>
            <b style={{ color: TONE_HEX[node.tone] }}>{node.label}</b>
            {node.sub ? <span>{node.sub}</span> : null}
          </>
        ) : (
          <span>{graph.caption}</span>
        )}
      </div>

      <ul className="map-legend">
        {graph.legend.map((l) => (
          <li key={l.label}>
            <i style={{ background: TONE_HEX[l.tone] }} aria-hidden="true" />
            {l.label}
          </li>
        ))}
      </ul>

      {/* The canvas is not the only route in. Everything is here as buttons. */}
      <details className="map-list">
        <summary>All {graph.nodes.length} as a list</summary>
        <ul>
          {graph.nodes.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => pick(n.id === selected ? null : n.id)}
                aria-pressed={n.id === selected}
              >
                <i style={{ background: TONE_HEX[n.tone] }} aria-hidden="true" />
                <span>
                  <b>{n.label}</b>
                  {n.sub ? <small>{n.sub}</small> : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
