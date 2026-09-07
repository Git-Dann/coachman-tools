"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import {
  newSim,
  step as advance,
  wastedShare,
  worst,
  worstByWait,
  type Sim,
} from "@/lib/flow";
import {
  PALETTE,
  caravanGeometry,
  glowTexture,
  labelSprite,
  stationPositions,
} from "@/lib/scene";

type Mode = "today" | "proposed";

/*
 * A caravan needs 36 ticks to cross the whole process today, so the tick has to
 * be quick or a queue never gets the chance to build while anyone is watching.
 * Movement is smoothed separately, so fast ticks still look fluid.
 */
const TICK = 85;
const MAX_VANS = 260;

/**
 * Run the season, in three dimensions.
 *
 * Caravans enter at one end and travel station to station. A station handles
 * one at a time, so anything behind it physically stacks up on the floor. You
 * see three things at once that a list cannot show you:
 *
 *   overlap  how many caravans are inside the process together
 *   spent    how much of their time is actual work
 *   wasted   how much of it is sitting in a queue behind something else
 *
 * The wasted share is a ratio out of the model, so it needs nobody to have been
 * timed: it is how much of a caravan's life is spent waiting rather than being
 * worked on.
 */
export function SeasonSim() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("today");
  const [running, setRunning] = useState(false);
  const [view, setView] = useState<Sim>(() => newSim("today"));

  const simRef = useRef<Sim>(view);
  const runRef = useRef(running);
  const modeRef = useRef<Mode>(mode);
  const resetRef = useRef(0);
  runRef.current = running;
  modeRef.current = mode;

  const reset = (m: Mode) => {
    const s = newSim(m);
    simRef.current = s;
    resetRef.current += 1;
    setView(s);
  };

  useEffect(() => {
    reset(mode);
  }, [mode]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ------------------------------------------------------------ setup */
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";

    const scene = new THREE.Scene();
    /*
     * The ground colour goes on the scene, not the renderer clear colour.
     * setClearColor sends the value through the composer's colour conversion a
     * second time and the whole frame came back as a flat grey wash; a scene
     * background is colour-managed once, on the way out.
     */
    scene.background = new THREE.Color(PALETTE.ink);
    // Tight fog, so the far end of the line falls away into the page colour
    // instead of sitting there as a grey haze.
    scene.fog = new THREE.Fog(PALETTE.ink, 16, 52);

    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 200);

    /* light: cool key, warm fill, so the metal reads without looking flat */
    scene.add(new THREE.AmbientLight(0x6d8394, 0.42));
    const key = new THREE.DirectionalLight(0xdfeaf2, 1.9);
    key.position.set(-14, 22, 14);
    scene.add(key);
    const warm = new THREE.DirectionalLight(0xd9a24b, 0.5);
    warm.position.set(16, 9, -12);
    scene.add(warm);

    /* floor: barely there, just enough to give the caravans somewhere to be */
    const grid = new THREE.GridHelper(90, 45, 0x1c2836, 0x121a22);
    (grid.material as THREE.Material).opacity = 0.5;
    (grid.material as THREE.Material).transparent = true;
    scene.add(grid);

    /* ------------------------------------------------------- stations */
    const glowTex = glowTexture();
    const stationGroup = new THREE.Group();
    scene.add(stationGroup);

    let positions: THREE.Vector3[] = [];
    let pads: THREE.Mesh[] = [];
    let glows: THREE.Sprite[] = [];
    let labels: THREE.Sprite[] = [];
    let waitBars: THREE.Mesh[] = [];
    let builtFor = -1;

    const padGeo = new THREE.CylinderGeometry(1.15, 1.15, 0.12, 28);
    const barGeo = new THREE.BoxGeometry(0.34, 1, 0.34);
    barGeo.translate(0, 0.5, 0);

    const buildStations = (sim: Sim) => {
      stationGroup.clear();
      pads = [];
      glows = [];
      labels = [];
      waitBars = [];
      positions = stationPositions(sim.stations.length);

      sim.stations.forEach((s, i) => {
        const colour = s.removed
          ? PALETTE.flag
          : s.paper
            ? PALETTE.brass
            : PALETTE.steel;

        const pad = new THREE.Mesh(
          padGeo,
          new THREE.MeshStandardMaterial({
            color: colour,
            emissive: colour,
            emissiveIntensity: 0.12,
            roughness: 0.55,
            metalness: 0.15,
          }),
        );
        pad.position.copy(positions[i]);
        stationGroup.add(pad);
        pads.push(pad);

        const glow = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: glowTex,
            color: colour,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            opacity: 0,
          }),
        );
        glow.position.set(positions[i].x, 0.18, positions[i].z);
        glow.scale.set(5.5, 5.5, 1);
        stationGroup.add(glow);
        glows.push(glow);

        const label = labelSprite(s.short, "#9DAFBA");
        label.position.set(positions[i].x, 1.85, positions[i].z);
        stationGroup.add(label);
        labels.push(label);

        // A column that grows with the waiting time swallowed here.
        const bar = new THREE.Mesh(
          barGeo,
          new THREE.MeshStandardMaterial({
            color: PALETTE.flag,
            emissive: PALETTE.flag,
            emissiveIntensity: 0.6,
            roughness: 0.4,
          }),
        );
        bar.position.set(positions[i].x, 0.06, positions[i].z - 2.1);
        bar.scale.y = 0.001;
        bar.visible = false;
        stationGroup.add(bar);
        waitBars.push(bar);
      });

      // the track between stations
      const pts = positions.map((p) => new THREE.Vector3(p.x, 0.07, p.z));
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: PALETTE.dim, transparent: true, opacity: 0.7 }),
      );
      stationGroup.add(line);

      const inLbl = labelSprite("IN", "#6C7D89");
      inLbl.position.set(positions[0].x - 3.2, 1.1, positions[0].z);
      stationGroup.add(inLbl);
      const outLbl = labelSprite("OUT", "#6FAE7F");
      const lastP = positions[positions.length - 1];
      outLbl.position.set(lastP.x + 3.4, 1.1, lastP.z);
      stationGroup.add(outLbl);
    };

    /* -------------------------------------------------------- caravans */
    const vanGeo = caravanGeometry();
    const vanMat = new THREE.MeshStandardMaterial({
      color: 0xe9eff3,
      roughness: 0.42,
      metalness: 0.08,
    });
    const vans = new THREE.InstancedMesh(vanGeo, vanMat, MAX_VANS);
    vans.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    vans.count = 0;
    vans.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(MAX_VANS * 3),
      3,
    );
    scene.add(vans);

    /* ----------------------------------------------------------- bloom */
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.5, 0.5, 0.5);
    composer.addPass(bloom);
    /*
     * Without this the composer writes a linear buffer straight to the screen,
     * tone mapping and colour space get applied twice, and the blacks lift into
     * a grey haze. OutputPass does the conversion once, at the end.
     */
    composer.addPass(new OutputPass());

    /* ------------------------------------------------------------ size */
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

    /* --------------------------------------------------------- camera */
    let yaw = -0.42;
    let drag: { x: number; y: number } | null = null;
    let userMoved = false;
    const onDown = (e: PointerEvent) => {
      drag = { x: e.clientX, y: e.clientY };
      userMoved = true;
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!drag) return;
      yaw += (e.clientX - drag.x) * 0.005;
      drag = { x: e.clientX, y: e.clientY };
    };
    const onUp = () => {
      drag = null;
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("pointercancel", onUp);

    /* ----------------------------------------------------------- loop */
    const dummy = new THREE.Object3D();
    const col = new THREE.Color();
    // Where each instance slot currently sits, so it can ease to its target
    // rather than snapping every tick.
    const cur = new Float32Array(MAX_VANS * 3);
    const seeded = new Uint8Array(MAX_VANS);
    let acc = 0;
    let last = performance.now();
    let lastReset = resetRef.current;
    let raf = 0;

    const frame = (now: number) => {
      const dt = Math.min(now - last, 120);
      last = now;

      if (resetRef.current !== lastReset || builtFor !== simRef.current.stations.length) {
        buildStations(simRef.current);
        builtFor = simRef.current.stations.length;
        lastReset = resetRef.current;
      }

      if (runRef.current) {
        acc += dt;
        let guard = 0;
        while (acc >= TICK && guard < 4) {
          simRef.current = advance(simRef.current, 3);
          acc -= TICK;
          guard++;
        }
        setView(simRef.current);
      } else {
        acc = 0;
      }

      const sim = simRef.current;

      /* Ease a slot towards where it should be. A slot that has just come into
         use starts at its target, so nothing flies in from the origin. */
      const place = (slot: number, x: number, y: number, z: number, sc: number) => {
        const o = slot * 3;
        if (!seeded[slot]) {
          cur[o] = x;
          cur[o + 1] = y;
          cur[o + 2] = z;
          seeded[slot] = 1;
        } else {
          const e = 0.22;
          cur[o] += (x - cur[o]) * e;
          cur[o + 1] += (y - cur[o + 1]) * e;
          cur[o + 2] += (z - cur[o + 2]) * e;
        }
        dummy.position.set(cur[o], cur[o + 1], cur[o + 2]);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(sc);
        dummy.updateMatrix();
        vans.setMatrixAt(slot, dummy.matrix);
      };

      /* place the caravans: one on each busy pad, the rest stacked behind */
      let n = 0;
      for (let i = 0; i < sim.stations.length && n < MAX_VANS; i++) {
        const p = positions[i];
        if (!p) continue;

        if (sim.active[i]) {
          place(n, p.x, 0.12, p.z, 1);
          col.setHex(PALETTE.moss);
          vans.setColorAt(n, col);
          n++;
        }

        // The queue, physically piled up behind the station.
        const q = Math.min(sim.queue[i], 26);
        for (let k = 0; k < q && n < MAX_VANS; k++) {
          const row = Math.floor(k / 2);
          const side = k % 2 === 0 ? -1 : 1;
          place(n, p.x - 1.9 - row * 1.05, 0.12, p.z + side * 0.62, 0.92);
          // Deeper in the queue reads hotter: it has been waiting longer.
          col.setHex(row > 5 ? PALETTE.flag : row > 2 ? PALETTE.brass : 0x9dafba);
          vans.setColorAt(n, col);
          n++;
        }
      }
      for (let k = n; k < MAX_VANS; k++) seeded[k] = 0;
      vans.count = n;
      vans.instanceMatrix.needsUpdate = true;
      if (vans.instanceColor) vans.instanceColor.needsUpdate = true;

      /* station feedback */
      const maxWait = Math.max(1, ...sim.waitAt);
      for (let i = 0; i < pads.length; i++) {
        const m = pads[i].material as THREE.MeshStandardMaterial;
        const busy = sim.active[i];
        m.emissiveIntensity += ((busy ? 0.95 : 0.12) - m.emissiveIntensity) * 0.14;
        const gm = glows[i].material as THREE.SpriteMaterial;
        gm.opacity += ((busy ? 0.5 : 0.06) - gm.opacity) * 0.12;

        const bar = waitBars[i];
        const target = (sim.waitAt[i] / maxWait) * 5.5;
        bar.visible = sim.waitAt[i] > 0;
        bar.scale.y += (Math.max(0.001, target) - bar.scale.y) * 0.1;
        const bm = bar.material as THREE.MeshStandardMaterial;
        bm.opacity = 1;
        (labels[i].material as THREE.SpriteMaterial).opacity =
          sim.queue[i] > 0 ? 1 : 0.6;
      }

      if (!reduced && !userMoved) yaw += 0.0006;
      // Framed so the whole line stays inside the viewport at any yaw.
      const dist = 24;
      camera.position.set(
        Math.sin(yaw) * dist,
        11,
        Math.cos(yaw) * dist + 1,
      );
      camera.lookAt(0, 1.4, 0);

      composer.render();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerup", onUp);
      renderer.domElement.removeEventListener("pointercancel", onUp);
      composer.dispose();
      renderer.dispose();
      vanGeo.dispose();
      padGeo.dispose();
      barGeo.dispose();
      glowTex.dispose();
      scene.traverse((o) => {
        const any = o as THREE.Mesh;
        if (any.material) {
          const mats = Array.isArray(any.material) ? any.material : [any.material];
          for (const m of mats) m.dispose();
        }
      });
      mount.removeChild(renderer.domElement);
    };
  }, []);

  const wasted = wastedShare(view);
  const jam = worst(view);
  const worstWait = worstByWait(view);

  return (
    <div className="ssim">
      <div className="ssim-stage" ref={mountRef} />

      <div className="ssim-hud" aria-live="polite">
        <div className="hud-cell">
          <b>{view.released - view.shipped}</b>
          <span>in the process at once</span>
        </div>
        <div className="hud-cell">
          <b className="ok">{view.shipped}</b>
          <span>out of the door</span>
        </div>
        <div className="hud-cell wide">
          <div className="split" aria-hidden="true">
            <i className="work" style={{ width: `${(1 - wasted) * 100}%` }} />
            <i className="wait" style={{ width: `${wasted * 100}%` }} />
          </div>
          <b className={wasted > 0.5 ? "bad" : ""}>
            {Math.round(wasted * 100)}% waiting
          </b>
          <span>
            {view.workTicks + view.waitTicks === 0
              ? "press play"
              : `only ${100 - Math.round(wasted * 100)}% of a caravan's time is work`}
          </span>
        </div>
        <div className={`hud-cell ${jam && jam.queue > 2 ? "flag" : ""}`}>
          <b className="sm">{worstWait ? worstWait.station.short : "—"}</b>
          <span>
            {worstWait ? "swallows the most time" : "nothing waiting yet"}
          </span>
        </div>
      </div>

      <div className="ssim-ctl">
        <button
          type="button"
          className={`play${running ? " on" : ""}`}
          onClick={() => setRunning((r) => !r)}
        >
          {running ? "Pause" : view.tick ? "Resume" : "Run the season"}
        </button>
        <button type="button" className="mini big" onClick={() => reset(mode)}>
          Reset
        </button>
        <div className="tgl inline compact" role="group" aria-label="Process">
          <button
            type="button"
            aria-pressed={mode === "today"}
            onClick={() => setMode("today")}
          >
            Today
          </button>
          <button
            type="button"
            aria-pressed={mode === "proposed"}
            onClick={() => setMode("proposed")}
          >
            Proposed
          </button>
        </div>
        <span className="ssim-hint">Drag to look around</span>
      </div>
    </div>
  );
}
