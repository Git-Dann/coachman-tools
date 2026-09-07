import * as THREE from "three";

/**
 * Scene primitives for the season simulation.
 *
 * Kept out of the component so the React side stays about state and the
 * three.js side stays about geometry. Everything here is disposable: the
 * component owns the lifecycle and calls dispose() on unmount.
 */

export const PALETTE = {
  ink: 0x0c1116,
  surface: 0x141b22,
  steel: 0x74a8c4,
  brass: 0xd9a24b,
  flag: 0xe4593c,
  moss: 0x6fae7f,
  text: 0xe9eff3,
  dim: 0x35424e,
};

/**
 * A caravan.
 *
 * The silhouette is what makes it read at a glance, so the body is a real side
 * profile extruded across the width: square at the back, a gentle roof, and the
 * sloped nose a touring caravan actually has. Then a window band, a wheel each
 * side and an A-frame at the front.
 *
 * It all merges into one geometry carrying vertex colours, so the whole fleet
 * draws as a single instanced mesh. The body is left white so the per-instance
 * colour tints it, while the glass, tyres and drawbar keep their own dark
 * values and stay dark whatever the caravan is tinted.
 */
export function caravanGeometry(): THREE.BufferGeometry {
  const W = 0.78; // width
  const FLOOR = 0.34;
  const ROOF = 1.18;
  const NOSE = 0.85;
  const TAIL = -0.85;

  const profile = new THREE.Shape();
  profile.moveTo(TAIL, FLOOR);
  profile.lineTo(TAIL, ROOF - 0.16);
  profile.quadraticCurveTo(TAIL, ROOF, TAIL + 0.16, ROOF);
  profile.quadraticCurveTo(0, ROOF + 0.05, NOSE - 0.46, ROOF);
  // the sloped front, pronounced enough to read at a distance
  profile.quadraticCurveTo(NOSE - 0.06, ROOF - 0.02, NOSE, ROOF - 0.52);
  profile.lineTo(NOSE, FLOOR + 0.06);
  profile.quadraticCurveTo(NOSE, FLOOR, NOSE - 0.08, FLOOR);
  profile.lineTo(TAIL, FLOOR);

  const body = new THREE.ExtrudeGeometry(profile, {
    depth: W,
    bevelEnabled: true,
    bevelSize: 0.03,
    bevelThickness: 0.03,
    bevelSegments: 2,
    curveSegments: 6,
  });
  body.translate(0, 0, -W / 2);
  body.computeVertexNormals();

  const parts: { geo: THREE.BufferGeometry; colour: [number, number, number] }[] =
    [{ geo: body, colour: [1, 1, 1] }];

  /*
   * Window band, one each side. It has to clear the bevel: the extrusion
   * pushes the wall 0.03 proud of W/2, so anything closer than that is buried
   * inside the bodywork and never seen.
   */
  for (const side of [-1, 1]) {
    const win = new THREE.BoxGeometry(0.86, 0.27, 0.02);
    win.translate(-0.06, 0.9, side * (W / 2 + 0.05));
    parts.push({ geo: win, colour: [0.07, 0.1, 0.13] });
  }

  // a door, so the side is not a blank slab
  for (const side of [-1, 1]) {
    const door = new THREE.BoxGeometry(0.03, 0.46, 0.02);
    door.translate(0.42, 0.63, side * (W / 2 + 0.05));
    parts.push({ geo: door, colour: [0.55, 0.6, 0.64] });
  }

  // one wheel each side, on a single axle set back a little
  for (const side of [-1, 1]) {
    const wheel = new THREE.CylinderGeometry(0.2, 0.2, 0.09, 14);
    wheel.rotateX(Math.PI / 2);
    wheel.translate(-0.06, 0.2, side * (W / 2 + 0.02));
    parts.push({ geo: wheel, colour: [0.08, 0.1, 0.12] });
  }

  // the A-frame drawbar reaching out in front
  const bar = new THREE.BoxGeometry(0.46, 0.07, 0.07);
  bar.translate(NOSE + 0.2, FLOOR + 0.02, 0);
  parts.push({ geo: bar, colour: [0.3, 0.34, 0.38] });

  const merged = mergeWithColours(parts);
  for (const p of parts) p.geo.dispose();
  return merged;
}

/**
 * Merge a handful of geometries, baking a colour into each one's vertices.
 * Small and local, so we do not pull in the whole BufferGeometryUtils module
 * for four boxes and an extrusion.
 */
function mergeWithColours(
  parts: { geo: THREE.BufferGeometry; colour: [number, number, number] }[],
): THREE.BufferGeometry {
  const nonIndexed = parts.map((p) => ({
    geo: p.geo.index ? p.geo.toNonIndexed() : p.geo,
    colour: p.colour,
    owned: Boolean(p.geo.index),
  }));

  let count = 0;
  for (const p of nonIndexed) count += p.geo.attributes.position.count;

  const pos = new Float32Array(count * 3);
  const nrm = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);

  let o = 0;
  for (const p of nonIndexed) {
    const n = p.geo.attributes.position.count;
    pos.set(p.geo.attributes.position.array as ArrayLike<number>, o * 3);
    nrm.set(p.geo.attributes.normal.array as ArrayLike<number>, o * 3);
    for (let i = 0; i < n; i++) {
      col[(o + i) * 3] = p.colour[0];
      col[(o + i) * 3 + 1] = p.colour[1];
      col[(o + i) * 3 + 2] = p.colour[2];
    }
    o += n;
    if (p.owned) p.geo.dispose();
  }

  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.BufferAttribute(nrm, 3));
  out.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return out;
}

/** A soft radial sprite, used as the glow under an active station. */
export function glowTexture(): THREE.Texture {
  const size = 128;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, "rgba(255,255,255,0.85)");
  grad.addColorStop(0.35, "rgba(255,255,255,0.28)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A station name, drawn to a canvas and hung in the scene as a sprite. */
export function labelSprite(
  text: string,
  colour: string,
  bold = false,
): THREE.Sprite {
  const pad = 12;
  const c = document.createElement("canvas");
  const g = c.getContext("2d")!;
  const font = `${bold ? 700 : 500} 42px ui-sans-serif, system-ui, sans-serif`;
  g.font = font;
  const w = Math.ceil(g.measureText(text).width) + pad * 2;
  c.width = w;
  c.height = 64;
  const g2 = c.getContext("2d")!;
  g2.font = font;
  g2.textAlign = "center";
  g2.textBaseline = "middle";
  g2.fillStyle = colour;
  g2.fillText(text, w / 2, 34);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
  });
  const s = new THREE.Sprite(mat);
  s.scale.set((w / 64) * 0.5, 0.5, 1);
  return s;
}

/** Where each station sits on the floor. A long shallow S, so it reads at an angle. */
export function stationPositions(n: number): THREE.Vector3[] {
  const out: THREE.Vector3[] = [];
  const span = 34;
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1);
    out.push(
      new THREE.Vector3(
        (t - 0.5) * span,
        0,
        Math.sin(t * Math.PI * 1.35) * 2.8,
      ),
    );
  }
  return out;
}
