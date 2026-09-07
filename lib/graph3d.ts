/**
 * A small 3D node map.
 *
 * Deliberately not a WebGL library. Twenty-five nodes projected onto a 2D
 * canvas runs at full frame rate on a phone, adds nothing to the bundle, and
 * lets us control exactly how it degrades. Nodes carry real x/y/z, rotate under
 * the finger, sort by depth and scale with perspective.
 */

export type Tone = "moss" | "brass" | "flag" | "steel" | "muted";

export interface Node3D {
  id: string;
  label: string;
  /** Short line under the label when the node is selected. */
  sub?: string;
  x: number;
  y: number;
  z: number;
  /** 0 to 1. Drives radius, so it must mean magnitude, never category. */
  size: number;
  tone: Tone;
  kind: "person" | "system" | "step" | "unit";
  /** Dimmed and struck through: away, or removed from the process. */
  faded?: boolean;
  /** Drawn with a ring: the thing the slide is about. */
  pinned?: boolean;
}

export interface Link3D {
  from: string;
  to: string;
  /** Drawn as a dashed gap: the digital trail stops here. */
  broken?: boolean;
  /** Drawn brighter: work moving because somebody is away. */
  active?: boolean;
}

export interface Graph {
  nodes: Node3D[];
  links: Link3D[];
  /** Shown under the canvas. Says what the picture is claiming. */
  legend: { tone: Tone; label: string }[];
  caption: string;
}

export const TONE_HEX: Record<Tone, string> = {
  moss: "#6FAE7F",
  brass: "#D9A24B",
  flag: "#E4593C",
  steel: "#74A8C4",
  muted: "#6C7D89",
};

/* ------------------------------------------------------------- projection */

export interface Projected {
  node: Node3D;
  sx: number;
  sy: number;
  /** Perspective scale, also used to fade distant nodes. */
  k: number;
  r: number;
}

/**
 * Rotate by yaw then pitch, then apply perspective.
 * Larger fov flattens the scene; 2.6 keeps depth readable without distortion.
 */
const FOV = 2.6;

export function project(
  nodes: readonly Node3D[],
  yaw: number,
  pitch: number,
  w: number,
  h: number,
  radius: number,
): Projected[] {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const cx = w / 2;
  const cyy = h / 2;

  const out: Projected[] = [];
  for (const n of nodes) {
    // yaw about the vertical axis
    const x1 = n.x * cy - n.z * sy;
    const z1 = n.x * sy + n.z * cy;
    // pitch about the horizontal axis
    const y2 = n.y * cp - z1 * sp;
    const z2 = n.y * sp + z1 * cp;

    const k = FOV / (FOV + z2);
    out.push({
      node: n,
      sx: cx + x1 * radius * k,
      sy: cyy + y2 * radius * k,
      k,
      r: (5 + n.size * 15) * k,
    });
  }
  // Painter's algorithm: far nodes first.
  out.sort((a, b) => a.k - b.k);
  return out;
}

/** Nearest node to a tap, or null. Generous hit target for fingers. */
export function hitTest(
  projected: readonly Projected[],
  x: number,
  y: number,
): Node3D | null {
  let best: Node3D | null = null;
  let bestD = Infinity;
  for (const p of projected) {
    const d = Math.hypot(p.sx - x, p.sy - y);
    const target = Math.max(p.r + 14, 24);
    if (d < target && d < bestD) {
      bestD = d;
      best = p.node;
    }
  }
  return best;
}

/* ---------------------------------------------------------------- layouts */

/** Evenly spaced points on a sphere. Avoids the clumping a random spread gives. */
export function fibonacciSphere(i: number, n: number): [number, number, number] {
  const off = 2 / n;
  const inc = Math.PI * (3 - Math.sqrt(5));
  const y = i * off - 1 + off / 2;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const phi = i * inc;
  return [Math.cos(phi) * r, y, Math.sin(phi) * r];
}

/** A helix, for anything with an order to it. */
export function helix(
  i: number,
  n: number,
  turns = 2.2,
): [number, number, number] {
  const t = n <= 1 ? 0 : i / (n - 1);
  const a = t * turns * Math.PI * 2;
  return [Math.cos(a) * 0.85, (t - 0.5) * 1.9, Math.sin(a) * 0.85];
}
