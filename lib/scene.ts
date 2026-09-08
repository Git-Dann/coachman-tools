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

/**
 * A flat ring laid on the floor, marking a station.
 *
 * This replaced a soft additive sprite. The sprite hazed everything near it and
 * read as a smudge on the lens rather than as a mark on the ground, which is
 * what it is meant to be.
 */
export function ringGeometry(inner: number, outer: number): THREE.RingGeometry {
  const g = new THREE.RingGeometry(inner, outer, 56);
  g.rotateX(-Math.PI / 2);
  return g;
}

/**
 * How far back a camera has to sit for a layout to fit inside the frame.
 *
 * A portrait canvas has a far narrower horizontal field of view than a laptop
 * one at the same vertical field of view, so a distance that frames a ring
 * nicely on a desktop cuts both sides off it on a phone.
 *
 * The two axes are worked out differently, because the shape is not the same
 * in both. Across, the layout is a disc the camera orbits, and the near side of
 * it is closer than the middle, so it needs the distance at which the frustum
 * is tangent to a sphere of that radius: reach / sin, not reach / tan. Using
 * tan is the obvious mistake and leaves the widest labels hanging off the edge
 * by about a tenth. Vertically it is a height sitting near the middle of the
 * scene, not a radius, so tan is right there.
 */
export function fitDistance(
  camera: THREE.PerspectiveCamera,
  reachH: number,
  reachV: number = reachH,
): number {
  const vFov = (camera.fov * Math.PI) / 180;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
  return Math.max(
    reachH / Math.sin(hFov / 2),
    reachV / Math.tan(vFov / 2),
  );
}

/** A station name, drawn to a canvas and hung in the scene as a sprite. */
export function labelSprite(
  text: string,
  colour: string,
  bold = false,
  /**
   * Hold the label at a constant size on screen instead of letting perspective
   * shrink it with distance. Worth it where the things being named sit at very
   * different depths, because otherwise the nearest name is four times the size
   * of the furthest and the picture reads as noise.
   */
  fixed = false,
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
    sizeAttenuation: !fixed,
  });
  const s = new THREE.Sprite(mat);
  s.scale.set((w / 64) * 0.86, 0.86, 1);
  // The caller sizes a fixed label in pixels once it knows how tall the canvas
  // is, so keep the shape of the texture where it can find it.
  s.userData.ratio = w / 64;
  return s;
}

/**
 * Size a fixed label so it renders at roughly the given height in CSS pixels.
 *
 * With size attenuation off a sprite's scale is a fraction of the viewport
 * height, so this is that fraction, and the width follows the texture's shape.
 */
export function sizeFixedLabel(
  sprite: THREE.Sprite,
  px: number,
  canvasHeight: number,
) {
  const h = px / Math.max(1, canvasHeight);
  sprite.scale.set(h * (sprite.userData.ratio as number), h, 1);
}

/**
 * Where each station sits on the floor.
 *
 * On a wide canvas that is one long shallow S, read at an angle. A phone is
 * portrait, and a line thirty-four units long in a portrait frame either runs
 * off both sides or shrinks to nothing, so there it snakes back on itself: the
 * first half left to right, the second half right to left underneath. Half the
 * width, and the stations end up further apart rather than closer together.
 */
export function stationPositions(n: number, rows: 1 | 2 = 1): THREE.Vector3[] {
  if (rows === 2) {
    const top = Math.ceil(n / 2);
    const span = 19;
    return Array.from({ length: n }, (_, i) => {
      const back = i >= top;
      // The second row runs the other way, so the two join at the near end.
      const k = back ? n - 1 - i : i;
      const cols = back ? n - top : top;
      const t = cols <= 1 ? 0.5 : k / (cols - 1);
      // Set well apart in depth, which is what reads as vertical on screen:
      // close together the two rows left most of a tall frame empty.
      return new THREE.Vector3((t - 0.5) * span, 0, back ? 9.4 : -9.4);
    });
  }
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
