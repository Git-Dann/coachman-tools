"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import {
  PALETTE,
  caravanGeometry,
  fitDistance,
  labelSprite,
  sizeFixedLabel,
} from "@/lib/scene";

/** The fourteen places that each hold a piece of one caravan. */
const HOLDERS = [
  "Pix", "Sage", "Factory Master", "Works order", "Barcode sheet",
  "Appliance tracking", "Delivery dates", "Nightly report", "Order bank",
  "Acknowledgement", "Transport plan", "PDI checklist", "Invoice PDF",
  "The book",
];

/**
 * The opening shot.
 *
 * The headline is "one caravan, nowhere to look it up", so the caravan is an
 * outline: present as an idea, not as a record you could open. Around it, the
 * fourteen places that each hold a piece of it, scattered at their own heights
 * and distances rather than arranged.
 *
 * The scatter is deliberate and is what separates this from the slide after it,
 * where the same caravan is solid and the same kind of objects are laid out in
 * a measured ring joined to the middle. Chaos, then structure.
 */
export function CoverScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(PALETTE.ink);
    scene.fog = new THREE.Fog(PALETTE.ink, 18, 60);
    const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 200);

    scene.add(new THREE.AmbientLight(0x7f94a6, 0.5));
    const key = new THREE.DirectionalLight(0xe8f0f6, 1.9);
    key.position.set(-10, 18, 12);
    scene.add(key);
    const warm = new THREE.DirectionalLight(PALETTE.brass, 0.55);
    warm.position.set(12, 5, -10);
    scene.add(warm);

    /*
     * The caravan, as an outline only. There is no single record of it, so
     * there is nothing solid to show, and a drawing is the honest way to put a
     * thing on screen that nobody can actually open.
     *
     * It is held at a three-quarter angle rather than turned. A wireframe seen
     * end-on is a rectangle, and the one thing this picture cannot afford is
     * for the caravan not to look like a caravan.
     */
    const vanGeo = caravanGeometry();
    const van = new THREE.Group();
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(vanGeo, 22),
      new THREE.LineBasicMaterial({
        color: 0xb9cad6,
        transparent: true,
        opacity: 0.75,
      }),
    );
    van.add(edges);
    van.scale.setScalar(3);
    scene.add(van);

    /* the fourteen places holding a piece of it */
    const shardGeo = new THREE.BoxGeometry(1.15, 0.1, 0.82);
    const shards: { mesh: THREE.Mesh; a: number; r: number; y: number; s: number }[] = [];
    const labels: THREE.Sprite[] = [];

    /*
     * Scattered, not spaced. The angles are pushed off the even ones and the
     * distances and heights all differ, so it reads as fourteen places nobody
     * arranged. The wobble is worked out from the index rather than random, so
     * the picture is the same every time it loads.
     */
    HOLDERS.forEach((name, i) => {
      const a =
        (i / HOLDERS.length) * Math.PI * 2 + Math.sin(i * 2.9) * 0.28;
      // Well clear of the outline: anything nearer passes in front of it from
      // some angles and puts a name across the drawing.
      const r = 8.2 + ((Math.sin(i * 5.1) + 1) / 2) * 4.4;
      const y = 0.5 + Math.sin(i * 1.7 + 0.6) * 2.9;
      const colour = i < 2 ? PALETTE.steel : i < 8 ? PALETTE.brass : PALETTE.flag;

      const mesh = new THREE.Mesh(
        shardGeo,
        new THREE.MeshStandardMaterial({
          color: colour,
          emissive: colour,
          emissiveIntensity: 0.75,
          roughness: 0.38,
          metalness: 0.1,
        }),
      );
      scene.add(mesh);

      const label = labelSprite(name, "#A8B8C4", false, true);
      scene.add(label);
      labels.push(label);
      shards.push({ mesh, a, r, y, s: i });
      (mesh as unknown as { label: THREE.Sprite }).label = label;
    });

    // RenderPass then OutputPass, with nothing between them. There used to be a
    // bloom pass here; it put a haze over the whole picture. OutputPass has to
    // stay, or the composer double-encodes the colours and everything greys out.
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new OutputPass());

    /*
     * Far enough out that the outermost holder lands inside the frame. The
     * names are drawn at a fixed size on screen rather than in the world, so
     * they no longer widen the picture the further out they orbit.
     */
    const REACH_V = 9.5;
    const maxR = shards.reduce((r, sh) => Math.max(r, sh.r), 6);
    /*
     * How far the scatter is thrown. A phone reserves a fifth of its width for
     * the names, so the same spread as a laptop pushes the camera half as far
     * again and the whole picture shrinks into the middle of the frame. Pull
     * the paperwork in instead, and throw it further up and down: a phone has
     * height going spare and no width at all.
     */
    let spread = 1;
    let lift = 1;
    const widestLabel = labels.reduce(
      (m, l) => Math.max(m, l.userData.ratio as number),
      1,
    );
    const BASE = Math.hypot(6.4, 16.5);
    let dist = BASE;

    let w = 0;
    let h = 0;
    const resize = () => {
      const r = mount.getBoundingClientRect();
      w = Math.max(1, r.width);
      h = Math.max(1, r.height);
      renderer.setSize(w, h, false);
      composer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const labelPx = w < 620 ? 11 : 13;
      const narrow = camera.aspect < 1.45;
      spread = narrow ? 0.7 : 1;
      lift = narrow ? 2 : 1;
      /*
       * A fixed-size name takes the same slice of the frame however far back
       * the camera goes, so it cannot be added to the reach as a world measure.
       * Instead the ring is given the share of the frame that is left once the
       * widest name has taken its cut off each side.
       */
      const share = Math.min(0.45, (labelPx * widestLabel) / w);
      const ringReach = maxR * spread * 1.14 + 0.8;
      dist = Math.max(BASE, fitDistance(camera, ringReach / (1 - share), REACH_V));
      // Keep the haze where it was relative to the camera, so pulling back on a
      // narrow screen does not fog the far side of the ring out of existence.
      const k = dist / BASE;
      (scene.fog as THREE.Fog).near = 18 * k;
      (scene.fog as THREE.Fog).far = 60 * k;
      // Every name the same size, whichever side of the turn it is on.
      for (const l of labels) sizeFixedLabel(l, labelPx, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const ndc = new THREE.Vector3();
    let raf = 0;
    const frame = (t: number) => {
      const spin = reduced ? 0 : t * 0.00009;
      van.rotation.y = -0.62 + (reduced ? 0 : Math.sin(t * 0.00016) * 0.13);

      for (const s of shards) {
        const a = s.a + spin;
        const r = s.r * spread;
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;
        const bob = reduced ? 0 : Math.sin(t * 0.0007 + s.s) * 0.34;
        const y = 0.5 + (s.y - 0.5) * lift + bob;
        s.mesh.position.set(x, y, z);
        s.mesh.rotation.set(
          0.1 + Math.sin(s.s * 3.3) * 0.5,
          -a + Math.cos(s.s * 2.1) * 0.6,
          Math.sin(s.s * 1.9) * 0.42,
        );
        const label = (s.mesh as unknown as { label: THREE.Sprite }).label;
        label.position.set(x * 1.14, y + 1.06, z * 1.14);
        /*
         * The middle of the frame belongs to the drawing. A card passing behind
         * it puts its name across the bodywork, so a name that lands there
         * steps back until the card has moved on.
         */
        ndc.copy(label.position).project(camera);
        const overVan = Math.abs(ndc.x) < 0.11 && Math.abs(ndc.y) < 0.16;
        const lm = label.material as THREE.SpriteMaterial;
        lm.opacity += ((overVan ? 0.12 : 1) - lm.opacity) * 0.12;
      }

      camera.position.set(0, dist * 0.34, dist * 0.94);
      camera.lookAt(0, 0.5, 0);
      composer.render();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      composer.dispose();
      renderer.dispose();
      vanGeo.dispose();
      edges.geometry.dispose();
      shardGeo.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div className="cover-scene" ref={mountRef} aria-hidden="true" />;
}
