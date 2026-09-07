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
 * One caravan, and the fourteen places that each hold a piece of it drifting
 * around it. Nothing to drive: it is the picture the whole session is about,
 * left to turn slowly while the room settles.
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

    /* the caravan */
    const vanGeo = caravanGeometry();
    const van = new THREE.Mesh(
      vanGeo,
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.42,
        metalness: 0.06,
      }),
    );
    van.scale.setScalar(2.4);
    scene.add(van);

    /* the fourteen places holding a piece of it */
    const shardGeo = new THREE.BoxGeometry(1.15, 0.1, 0.82);
    const shards: { mesh: THREE.Mesh; a: number; r: number; y: number; s: number }[] = [];
    const labels: THREE.Sprite[] = [];

    HOLDERS.forEach((name, i) => {
      const a = (i / HOLDERS.length) * Math.PI * 2;
      const r = 6.4 + (i % 3) * 0.85;
      const y = 0.9 + Math.sin(i * 1.7) * 1.5;
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
    const REACH_V = 7;
    const ringReach = shards.reduce((r, sh) => Math.max(r, sh.r * 1.1), 6) + 0.8;
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
      /*
       * A fixed-size name takes the same slice of the frame however far back
       * the camera goes, so it cannot be added to the reach as a world measure.
       * Instead the ring is given the share of the frame that is left once the
       * widest name has taken its cut off each side.
       */
      const share = Math.min(0.45, (labelPx * widestLabel) / w);
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

    let raf = 0;
    const frame = (t: number) => {
      const spin = reduced ? 0 : t * 0.00009;
      van.rotation.y = spin * 2.2;

      for (const s of shards) {
        const a = s.a + spin;
        const x = Math.cos(a) * s.r;
        const z = Math.sin(a) * s.r;
        const bob = reduced ? 0 : Math.sin(t * 0.0007 + s.s) * 0.34;
        s.mesh.position.set(x, s.y + bob, z);
        s.mesh.rotation.set(0.1, -a, 0.06);
        const label = (s.mesh as unknown as { label: THREE.Sprite }).label;
        label.position.set(x * 1.1, s.y + bob + 1.02, z * 1.1);
      }

      camera.position.set(0, dist * 0.34, dist * 0.94);
      camera.lookAt(0, 0.8, 0);
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
      shardGeo.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div className="cover-scene" ref={mountRef} aria-hidden="true" />;
}
