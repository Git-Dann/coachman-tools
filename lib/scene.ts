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

/** A caravan: a body, a slightly darker roof, and a drawbar. Read at a glance. */
export function caravanGeometry(): THREE.BufferGeometry {
  const body = new THREE.BoxGeometry(1.5, 0.78, 0.86);
  body.translate(0, 0.52, 0);

  const roof = new THREE.BoxGeometry(1.32, 0.16, 0.72);
  roof.translate(0, 0.98, 0);

  const bar = new THREE.BoxGeometry(0.5, 0.08, 0.08);
  bar.translate(-0.98, 0.28, 0);

  const merged = mergeGeometries([body, roof, bar]);
  body.dispose();
  roof.dispose();
  bar.dispose();
  return merged;
}

/** Minimal merge, so we do not pull in the whole BufferGeometryUtils module. */
function mergeGeometries(list: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const out = new THREE.BufferGeometry();
  let vCount = 0;
  let iCount = 0;
  for (const g of list) {
    vCount += g.attributes.position.count;
    iCount += g.index ? g.index.count : 0;
  }
  const pos = new Float32Array(vCount * 3);
  const nrm = new Float32Array(vCount * 3);
  const idx = new Uint16Array(iCount);
  let vo = 0;
  let io = 0;
  for (const g of list) {
    const p = g.attributes.position.array as ArrayLike<number>;
    const nAttr = g.attributes.normal.array as ArrayLike<number>;
    pos.set(p, vo * 3);
    nrm.set(nAttr, vo * 3);
    const gi = g.index!;
    for (let i = 0; i < gi.count; i++) idx[io + i] = gi.getX(i) + vo;
    vo += g.attributes.position.count;
    io += gi.count;
  }
  out.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.BufferAttribute(nrm, 3));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
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
