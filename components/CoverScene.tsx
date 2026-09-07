"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { PALETTE, caravanGeometry, glowTexture, labelSprite } from "@/lib/scene";

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
    const glowTex = glowTexture();
    const shardGeo = new THREE.BoxGeometry(0.72, 0.06, 0.52);
    const shards: { mesh: THREE.Mesh; glow: THREE.Sprite; a: number; r: number; y: number; s: number }[] = [];

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
          emissiveIntensity: 0.5,
          roughness: 0.5,
        }),
      );
      scene.add(mesh);

      const glow = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glowTex,
          color: colour,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          opacity: 0.32,
        }),
      );
      glow.scale.set(2.6, 2.6, 1);
      scene.add(glow);

      const label = labelSprite(name, "#8EA1AE");
      scene.add(label);
      shards.push({ mesh, glow, a, r, y, s: i });
      (mesh as unknown as { label: THREE.Sprite }).label = label;
    });

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.6, 0.4);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    let w = 0;
    let h = 0;
    const resize = () => {
      const r = mount.getBoundingClientRect();
      w = Math.max(1, r.width);
      h = Math.max(1, r.height);
      renderer.setSize(w, h, false);
      composer.setSize(w, h);
      bloom.resolution.set(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
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
        s.glow.position.set(x, s.y + bob, z);
        const label = (s.mesh as unknown as { label: THREE.Sprite }).label;
        label.position.set(x * 1.13, s.y + bob + 0.62, z * 1.13);
      }

      camera.position.set(0, 6.4, 16.5);
      camera.lookAt(0, 1.4, 0);
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
      glowTex.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div className="cover-scene" ref={mountRef} aria-hidden="true" />;
}
