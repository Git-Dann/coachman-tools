"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { PALETTE, caravanGeometry, glowTexture, labelSprite } from "@/lib/scene";
import {
  DESK_PEOPLE,
  UNITS_PER_STEP,
  heat,
  heatColour,
  load,
  proposedJobs,
  todayJobs,
  verdict,
  type Job,
} from "@/lib/hub";
import { fmt } from "@/lib/format";
import { usePublishStatus } from "./SlideStatus";

type Mode = "today" | "proposed";

/**
 * One caravan in the middle, every job that touches it ringed around it.
 *
 * Each job is a pad, and the plates stacked on it are the number of times the
 * same information gets entered again. Add a caravan and the load on the desk
 * grows in a straight line while the desk does not, so the ring warms from
 * green through amber to red.
 *
 * The paired proposed process has no stacks and stays green however many you
 * add, then pulls back to show the same thing running anywhere.
 */
export function HubSim({ mode }: { mode: Mode }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [mult, setMult] = useState(1);
  const [globe, setGlobe] = useState(false);

  const jobs = useMemo(
    () => (mode === "today" ? todayJobs() : proposedJobs()),
    [mode],
  );
  const units = mult * UNITS_PER_STEP;
  const l = useMemo(() => load(jobs, units, DESK_PEOPLE), [jobs, units]);
  const h = mode === "today" ? heat(l.ratio) : 0;
  const v = verdict(l.ratio);

  /* refs the render loop reads without re-creating the scene */
  const state = useRef({ jobs, mult, heat: h, mode, globe });
  state.current = { jobs, mult, heat: h, mode, globe };
  const rebuild = useRef(0);
  useEffect(() => {
    rebuild.current += 1;
  }, [mode]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(PALETTE.ink);
    scene.fog = new THREE.Fog(PALETTE.ink, 26, 90);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);

    scene.add(new THREE.AmbientLight(0x7e93a5, 0.5));
    const key = new THREE.DirectionalLight(0xe6eef4, 1.7);
    key.position.set(-12, 24, 12);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x74a8c4, 0.5);
    rim.position.set(14, 6, -14);
    scene.add(rim);
    const centre = new THREE.PointLight(0xcfe0ea, 26, 20, 2);
    centre.position.set(0.5, 7, 3);
    scene.add(centre);

    const glowTex = glowTexture();
    const vanGeo = caravanGeometry();
    const vanMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.45,
      metalness: 0.05,
    });

    /* ---------------------------------------------------- the caravans */
    const fleet = new THREE.InstancedMesh(vanGeo, vanMat, 12);
    fleet.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(12 * 3),
      3,
    );
    fleet.count = 0;
    scene.add(fleet);

    /* -------------------------------------------------------- the ring */
    const ring = new THREE.Group();
    scene.add(ring);

    const padGeo = new THREE.CylinderGeometry(0.82, 0.82, 0.1, 26);
    const plateGeo = new THREE.BoxGeometry(1.0, 0.075, 0.72);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x2a3743,
      transparent: true,
      opacity: 0.85,
    });

    let pads: THREE.Mesh[] = [];
    let plates: THREE.Mesh[][] = [];
    let glows: THREE.Sprite[] = [];
    let links: THREE.Line[] = [];
    let nodeAt: THREE.Vector3[] = [];

    const RADIUS = 9.6;

    const buildRing = (js: Job[]) => {
      ring.clear();
      pads = [];
      plates = [];
      glows = [];
      links = [];
      nodeAt = [];

      js.forEach((job, i) => {
        const a = (i / js.length) * Math.PI * 2 - Math.PI / 2;
        const pos = new THREE.Vector3(Math.cos(a) * RADIUS, 0, Math.sin(a) * RADIUS);
        nodeAt.push(pos);

        const pad = new THREE.Mesh(
          padGeo,
          new THREE.MeshStandardMaterial({
            color: 0x9dafba,
            emissive: 0x000000,
            emissiveIntensity: 0.5,
            roughness: 0.5,
            metalness: 0.1,
          }),
        );
        pad.position.copy(pos);
        ring.add(pad);
        pads.push(pad);

        // One plate for the job, plus one for every time it is entered again.
        const stack: THREE.Mesh[] = [];
        for (let d = 0; d < job.duplication; d++) {
          const plate = new THREE.Mesh(
            plateGeo,
            new THREE.MeshStandardMaterial({
              color: 0xd9a24b,
              emissive: 0x000000,
              roughness: 0.65,
            }),
          );
          plate.position.set(
            pos.x + (d % 2 === 0 ? 1 : -1) * 0.07 * d,
            0.2 + d * 0.2,
            pos.z + (d % 2 === 0 ? -1 : 1) * 0.06 * d,
          );
          plate.rotation.y = (d % 2 === 0 ? 1 : -1) * 0.13 * (d + 1);
          ring.add(plate);
          stack.push(plate);
        }
        plates.push(stack);

        const glow = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: glowTex,
            color: 0x6fae7f,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            opacity: 0.22,
          }),
        );
        glow.position.set(pos.x, 0.1, pos.z);
        glow.scale.set(4.2, 4.2, 1);
        ring.add(glow);
        glows.push(glow);

        const label = labelSprite(job.name, "#DCE6EC");
        label.position.set(pos.x * 1.2, 0.95, pos.z * 1.2);
        ring.add(label);

        const link = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0.35, 0),
            new THREE.Vector3(pos.x * 0.9, 0.12, pos.z * 0.9),
          ]),
          lineMat.clone(),
        );
        ring.add(link);
        links.push(link);
      });
    };

    /* -------------------------------------------------------- the globe */
    const globeGroup = new THREE.Group();
    globeGroup.visible = false;
    scene.add(globeGroup);
    const globeGeo = new THREE.SphereGeometry(7, 40, 28);
    globeGroup.add(
      new THREE.Mesh(
        globeGeo,
        new THREE.MeshStandardMaterial({
          color: 0x121b24,
          roughness: 0.9,
          metalness: 0,
        }),
      ),
    );
    globeGroup.add(
      new THREE.LineSegments(
        new THREE.WireframeGeometry(new THREE.SphereGeometry(7.02, 26, 18)),
        new THREE.LineBasicMaterial({
          color: 0x24384a,
          transparent: true,
          opacity: 0.55,
        }),
      ),
    );
    const markerGeo = new THREE.SphereGeometry(0.2, 12, 10);
    const markerMat = new THREE.MeshStandardMaterial({
      color: PALETTE.moss,
      emissive: PALETTE.moss,
      emissiveIntensity: 1.5,
    });
    // Scattered sites, all running the same process, all green.
    const sites: [number, number][] = [
      [53.7, -0.3], [52.5, 13.4], [45.5, 9.2], [48.9, 2.3], [40.4, -3.7],
      [59.3, 18.1], [-33.9, 151.2], [-36.8, 174.8], [43.7, -79.4], [39.7, -105],
      [30.3, -97.7], [-23.5, -46.6], [35.7, 139.7], [1.35, 103.8], [50.1, 8.7],
    ];
    for (const [lat, lon] of sites) {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const m = new THREE.Mesh(markerGeo, markerMat);
      m.position.set(
        -7.1 * Math.sin(phi) * Math.cos(theta),
        7.1 * Math.cos(phi),
        7.1 * Math.sin(phi) * Math.sin(theta),
      );
      globeGroup.add(m);
    }

    /* ------------------------------------------------------------ post */
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.5, 0.55, 0.45);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    let w = 0;
    let hgt = 0;
    const resize = () => {
      const r = mount.getBoundingClientRect();
      w = Math.max(1, r.width);
      hgt = Math.max(1, r.height);
      renderer.setSize(w, hgt, false);
      composer.setSize(w, hgt);
      bloom.resolution.set(w, hgt);
      camera.aspect = w / hgt;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    let yaw = 0.5;
    let pitch = 0.5;
    let drag: { x: number; y: number } | null = null;
    let touched = false;
    const down = (e: PointerEvent) => {
      drag = { x: e.clientX, y: e.clientY };
      touched = true;
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!drag) return;
      yaw -= (e.clientX - drag.x) * 0.006;
      pitch = Math.max(0.16, Math.min(1.35, pitch + (e.clientY - drag.y) * 0.004));
      drag = { x: e.clientX, y: e.clientY };
    };
    const up = () => {
      drag = null;
    };
    renderer.domElement.addEventListener("pointerdown", down);
    renderer.domElement.addEventListener("pointermove", move);
    renderer.domElement.addEventListener("pointerup", up);
    renderer.domElement.addEventListener("pointercancel", up);

    const dummy = new THREE.Object3D();
    const col = new THREE.Color();
    const tint = new THREE.Color();
    let builtFor = -1;
    let camDist = 25.5;
    let raf = 0;

    const frame = (t: number) => {
      const st = state.current;

      if (builtFor !== rebuild.current) {
        buildRing(st.jobs);
        builtFor = rebuild.current;
      }

      const showGlobe = st.mode === "proposed" && st.globe;
      globeGroup.visible = showGlobe;
      ring.visible = !showGlobe;
      fleet.visible = !showGlobe;

      if (showGlobe) {
        globeGroup.rotation.y += reduced ? 0 : 0.0016;
        camDist += (22 - camDist) * 0.05;
      } else {
        camDist += (25.5 - camDist) * 0.05;

        /* the fleet in the middle */
        const n = Math.min(st.mult, 12);
        for (let i = 0; i < n; i++) {
          const cols = Math.ceil(Math.sqrt(n));
          const r = Math.floor(i / cols);
          const c = i % cols;
          const ox = (c - (cols - 1) / 2) * 3.4;
          const oz = (r - (Math.ceil(n / cols) - 1) / 2) * 2.3;
          dummy.position.set(ox, 0, oz);
          dummy.rotation.set(0, reduced ? 0 : t * 0.00016, 0);
          // A lone caravan is the hero of the picture, so it gets more size.
          dummy.scale.setScalar(n === 1 ? 1.9 : 1.2);
          dummy.updateMatrix();
          fleet.setMatrixAt(i, dummy.matrix);
          col.setHex(0xf2f6f8);
          fleet.setColorAt(i, col);
        }
        fleet.count = n;
        fleet.instanceMatrix.needsUpdate = true;
        if (fleet.instanceColor) fleet.instanceColor.needsUpdate = true;

        /* the ring takes its temperature from the load */
        tint.setHex(heatColour(st.heat));
        /*
         * The pad is the job itself and stays a cool steel: doing the work once
         * is not the problem. Everything stacked on top is the same information
         * being entered again, and that is what warms to red. The colour is the
         * duplication, not the process.
         */
        // Today: the job itself stays a cool steel and only the duplication
        // heats up. Proposed: there is no duplication, so the whole ring is
        // green and stays green however much volume is added.
        const cool = new THREE.Color(
          st.mode === "proposed" ? PALETTE.moss : 0x5d7180,
        );
        for (let i = 0; i < pads.length; i++) {
          const m = pads[i].material as THREE.MeshStandardMaterial;
          m.color.lerp(cool, 0.08);
          m.emissive.lerp(cool, 0.08);
          m.emissiveIntensity = st.mode === "proposed" ? 0.55 : 0.12;

          const stacked = plates[i].length > 0;
          const gm = glows[i].material as THREE.SpriteMaterial;
          gm.color.lerp(stacked ? tint : cool, 0.08);
          const glowTarget = stacked
            ? 0.12 + st.heat * 0.5
            : st.mode === "proposed"
              ? 0.26
              : 0.08;
          gm.opacity += (glowTarget - gm.opacity) * 0.08;

          for (const plate of plates[i]) {
            const pm = plate.material as THREE.MeshStandardMaterial;
            pm.color.lerp(tint, 0.08);
            pm.emissive.lerp(tint, 0.08);
            pm.emissiveIntensity = 0.2 + st.heat * 0.9;
          }

          const lm = links[i].material as THREE.LineBasicMaterial;
          lm.color.lerp(stacked ? tint : cool, 0.06);
          lm.opacity = stacked ? 0.28 + st.heat * 0.6 : st.mode === "proposed" ? 0.45 : 0.2;
        }
      }

      if (!touched && !reduced) yaw += 0.0011;
      camera.position.set(
        Math.sin(yaw) * Math.cos(pitch) * camDist,
        Math.sin(pitch) * camDist,
        Math.cos(yaw) * Math.cos(pitch) * camDist,
      );
      camera.lookAt(0, 0.4, 0);

      composer.render();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", down);
      renderer.domElement.removeEventListener("pointermove", move);
      renderer.domElement.removeEventListener("pointerup", up);
      renderer.domElement.removeEventListener("pointercancel", up);
      composer.dispose();
      renderer.dispose();
      vanGeo.dispose();
      padGeo.dispose();
      plateGeo.dispose();
      globeGeo.dispose();
      markerGeo.dispose();
      glowTex.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  const proposed = mode === "proposed";

  /* The rail carries the live reading, so the right column moves as you drive. */
  usePublishStatus({
    headline: proposed ? "Nothing is entered twice." : `${v.label}.`,
    detail: proposed
      ? "Twelve stages, no re-entry, so the work per caravan stops growing and the desk stops being the ceiling."
      : v.said,
    tone: proposed ? "moss" : h > 0.55 ? "flag" : h > 0.3 ? "brass" : "moss",
    figures: [
      {
        value: fmt(Math.round(l.hours)),
        label: "hours a year on the desk",
        tone: proposed ? "moss" : "text",
      },
      {
        value: fmt(Math.round(l.duplicatedHours)),
        label: "of those, entered again",
        tone: l.duplicatedHours > 0 ? "flag" : "moss",
      },
      {
        value: fmt(l.throttled),
        label: "turned away",
        tone: l.throttled > 0 ? "flag" : "moss",
      },
    ],
  });

  return (
    <div className="hub">
      <div className="hub-stage" ref={mountRef} />

      <div className="hub-hud" aria-live="polite">
        <div className="hud-cell">
          <b>{fmt(units)}</b>
          <span>caravans a year</span>
        </div>
        <div className="hud-cell">
          <b style={{ color: proposed ? "var(--color-moss)" : undefined }}>
            {fmt(Math.round(l.hours))}
          </b>
          <span>hours a year on the order desk</span>
        </div>
        <div className="hud-cell">
          <b className={l.duplicatedHours > 0 ? "bad" : "ok"}>
            {fmt(Math.round(l.duplicatedHours))}
          </b>
          <span>of those, entering it again</span>
        </div>
        <div className={`hud-cell ${l.throttled > 0 ? "flag" : ""}`}>
          <b className={l.throttled > 0 ? "bad" : "ok"}>{fmt(l.throttled)}</b>
          <span>turned away, desk cannot take them</span>
        </div>
      </div>

      <p className="hub-say">
        <b
          style={{
            color: proposed
              ? "var(--color-moss)"
              : `#${heatColour(h).toString(16).padStart(6, "0")}`,
          }}
        >
          {proposed ? "Nothing is entered twice." : `${v.label}.`}
        </b>{" "}
        {proposed
          ? "Twelve stages, no re-entry, so the work per caravan stops growing and the desk stops being the ceiling."
          : v.said}
      </p>

      <div className="hub-ctl">
        <div className="adder">
          <button
            type="button"
            onClick={() => setMult((m) => Math.max(1, m - 1))}
            disabled={mult <= 1}
            aria-label="One fewer year of volume"
          >
            &#8722;
          </button>
          <span>
            <b>{mult}×</b> today&rsquo;s volume
          </span>
          <button
            type="button"
            onClick={() => setMult((m) => Math.min(6, m + 1))}
            disabled={mult >= 6}
            aria-label="Add another year of volume"
          >
            &#43;
          </button>
        </div>

        {proposed ? (
          <button
            type="button"
            className={`mini big${globe ? " on" : ""}`}
            aria-pressed={globe}
            onClick={() => setGlobe((g) => !g)}
          >
            {globe ? "Back to one site" : "Zoom out"}
          </button>
        ) : null}

        <span className="ssim-hint">Drag to look around</span>
      </div>

    </div>
  );
}
