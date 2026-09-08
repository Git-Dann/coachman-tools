"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import {
  PALETTE,
  caravanGeometry,
  fitDistance,
  labelSprite,
  ringGeometry,
  sizeFixedLabel,
} from "@/lib/scene";
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
import { STEPS } from "@/content/steps";
import { HANDOFFS } from "@/content/handoffs";
import { HANDOFF_STEP } from "@/content/people";
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
  const [picked, setPicked] = useState<number | null>(null);
  const pickedRef = useRef<number | null>(null);
  pickedRef.current = picked;

  const jobs = useMemo(
    () => (mode === "today" ? todayJobs() : proposedJobs()),
    [mode],
  );
  const units = mult * UNITS_PER_STEP;
  const l = useMemo(() => load(jobs, units, DESK_PEOPLE), [jobs, units]);
  /*
   * What the same volume would cost the way it is done now. The proposed side
   * needs this rather than a "turned away" count: nothing gets turned away in
   * a process whose admin cost per caravan is flat, you just staff it, and the
   * honest comparison is how many people each way of working needs.
   */
  const todayAt = useMemo(
    () => load(todayJobs(), units, DESK_PEOPLE),
    [units],
  );
  const h = mode === "today" ? heat(l.ratio) : 0;
  const v = verdict(l.ratio);

  /* refs the render loop reads without re-creating the scene */
  const state = useRef({ jobs, mult, heat: h, mode, globe });
  state.current = { jobs, mult, heat: h, mode, globe };
  const onPick = useRef<(i: number | null) => void>(() => {});
  onPick.current = (i) => setPicked((p) => (p === i ? null : i));
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

    const ringGeo = ringGeometry(1.35, 1.52);
    const vanGeo = caravanGeometry();
    const vanMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.45,
      metalness: 0.05,
    });

    /* ---------------------------------------------------- the caravans */
    // Room for a hundred. A caravan manufacturer at six a year would not need
    // a system at all.
    const FLEET_MAX = 100;
    const fleet = new THREE.InstancedMesh(vanGeo, vanMat, FLEET_MAX);
    fleet.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(FLEET_MAX * 3),
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
    let marks: THREE.Mesh[] = [];
    let labels: THREE.Sprite[] = [];
    let links: THREE.Line[] = [];
    let nodeAt: THREE.Vector3[] = [];

    const RADIUS = 9.6;

    const buildRing = (js: Job[], proposed: boolean) => {
      ring.clear();
      pads = [];
      plates = [];
      marks = [];
      labels = [];
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

        /*
         * A ring on the floor under each job, carrying the heat. Only in
         * today's picture: in the proposed one the pad is already a plain green
         * disc, and a second ring around every one of the twelve was drawing
         * each stage twice for nothing.
         */
        if (!proposed) {
          const mark = new THREE.Mesh(
            ringGeo,
            new THREE.MeshBasicMaterial({
              color: 0x6fae7f,
              transparent: true,
              opacity: 0.5,
              depthWrite: false,
              side: THREE.DoubleSide,
            }),
          );
          mark.position.set(pos.x, 0.035, pos.z);
          ring.add(mark);
          marks.push(mark);
        }

        // Held at one size on screen. The ring is seen at an angle, so a name
        // on the near side was three times the size of one on the far side and
        // the picture read as noise rather than as twelve equal stages.
        const label = labelSprite(job.name, "#C6D5DF", false, true);
        label.position.set(pos.x * 1.18, 1.05, pos.z * 1.18);
        ring.add(label);
        labels.push(label);

        /*
         * Today, every job hangs off the middle, so it gets a spoke. That is
         * the point of that picture and the reason it looks like a hub.
         *
         * Proposed is one process, so it gets one line: an unbroken circle
         * through the twelve stages, drawn once below. Twelve spokes said the
         * same thing twelve times and made the simpler process look busier
         * than the broken one.
         */
        if (!proposed) {
          const link = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(0, 0.35, 0),
              new THREE.Vector3(pos.x * 0.9, 0.12, pos.z * 0.9),
            ]),
            lineMat.clone(),
          );
          ring.add(link);
          links.push(link);
        }
      });

      if (proposed) {
        const loop = new THREE.LineLoop(
          new THREE.BufferGeometry().setFromPoints(
            nodeAt.map((p) => new THREE.Vector3(p.x, 0.06, p.z)),
          ),
          new THREE.LineBasicMaterial({
            color: 0x4c7f5c,
            transparent: true,
            opacity: 0.8,
          }),
        );
        ring.add(loop);
      }
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
    // RenderPass straight into OutputPass. The bloom pass that used to sit
    // between them hazed the whole ring. OutputPass is not optional: without it
    // the composer double-encodes the colours and the scene washes out grey.
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new OutputPass());

    /*
     * How much room the picture needs.
     *
     * The ring itself is a known radius. The names are drawn at one size on
     * screen rather than in the world, so they cannot be added to that as a
     * world measure: instead the ring gets whatever share of the frame is left
     * once the widest name has taken its cut off each side.
     *
     * Vertically it needs far less. The ring is flat and seen from above, so it
     * stands about a third as high on screen as it is wide.
     */
    const REACH_V = 9.5;
    const RING_REACH = RADIUS * 1.18 + 1.1;
    let widestLabel = 4;
    const measureReach = () => {
      widestLabel = labels.reduce(
        (m, l) => Math.max(m, l.userData.ratio as number),
        3,
      );
    };

    let w = 0;
    let hgt = 0;
    let labelPx = 13;
    const ringReach = () => {
      const share = Math.min(0.42, (labelPx * widestLabel) / Math.max(1, w));
      return RING_REACH / (1 - share);
    };
    const resize = () => {
      const r = mount.getBoundingClientRect();
      w = Math.max(1, r.width);
      hgt = Math.max(1, r.height);
      renderer.setSize(w, hgt, false);
      composer.setSize(w, hgt);
      camera.aspect = w / hgt;
      camera.updateProjectionMatrix();
      // Scaled to the canvas: the same name has to read on a phone and on a
      // projector, and a fixed pixel size cannot do both.
      labelPx = Math.max(10.5, Math.min(17, w / 92));
      for (const l of labels) sizeFixedLabel(l, labelPx, hgt);
      const k = Math.max(1, fitDistance(camera, ringReach(), REACH_V) / 25.5);
      (scene.fog as THREE.Fog).near = 26 * k;
      (scene.fog as THREE.Fog).far = 90 * k;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    let yaw = 0.5;
    let pitch = 0.5;
    let drag: { x: number; y: number } | null = null;
    let touched = false;
    let moved = false;
    const down = (e: PointerEvent) => {
      drag = { x: e.clientX, y: e.clientY };
      moved = false;
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) {
        moved = true;
        touched = true;
      }
      yaw -= dx * 0.006;
      pitch = Math.max(0.16, Math.min(1.35, pitch + dy * 0.004));
      drag = { x: e.clientX, y: e.clientY };
    };
    const up = (e: PointerEvent) => {
      const wasDragging = drag !== null;
      drag = null;
      if (!wasDragging || moved) return;
      // A click, not a drag. Take whichever job is nearest to it on screen.
      const rect = renderer.domElement.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      let best = -1;
      let bestD = 46;
      const v = new THREE.Vector3();
      for (let i = 0; i < nodeAt.length; i++) {
        v.copy(nodeAt[i]).project(camera);
        const sx = ((v.x + 1) / 2) * rect.width;
        const sy = ((1 - v.y) / 2) * rect.height;
        const d = Math.hypot(sx - cx, sy - cy);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      onPick.current(best >= 0 ? best : null);
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
        buildRing(st.jobs, st.mode === "proposed");
        measureReach();
        // The reach only settles once the labels exist, so the framing and the
        // fog have to be worked out again now they do.
        resize();
        builtFor = rebuild.current;
      }

      const minDist = fitDistance(camera, ringReach(), REACH_V);

      const showGlobe = st.mode === "proposed" && st.globe;
      globeGroup.visible = showGlobe;
      ring.visible = !showGlobe;
      fleet.visible = !showGlobe;

      if (showGlobe) {
        globeGroup.rotation.y += reduced ? 0 : 0.0016;
        camDist += (Math.max(22, minDist * 0.88) - camDist) * 0.05;
      } else {
        camDist += (Math.max(25.5, minDist) - camDist) * 0.05;

        /*
         * The fleet in the middle. It is laid out as a block that always takes
         * up the same room, so the caravans shrink as you add them rather than
         * spilling over the ring. One on its own is the hero of the picture and
         * gets the size to match.
         */
        const n = Math.min(st.mult, FLEET_MAX);
        const cols = Math.ceil(Math.sqrt(n));
        const rows = Math.ceil(n / cols);
        const SPAN = 6.8;
        const gap = SPAN / Math.max(2, Math.max(cols, rows));
        const size = n === 1 ? 1.9 : Math.min(1.25, gap * 0.52);
        for (let i = 0; i < n; i++) {
          const c = i % cols;
          const r = Math.floor(i / cols);
          dummy.position.set(
            (c - (cols - 1) / 2) * gap,
            0,
            (r - (rows - 1) / 2) * gap * 0.8,
          );
          dummy.rotation.set(0, reduced ? 0 : t * 0.00016, 0);
          dummy.scale.setScalar(size);
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

          // Proposed has no floor rings, so there may be nothing here to tint.
          const stacked = plates[i].length > 0;
          const mark = marks[i];
          if (mark) {
            const gm = mark.material as THREE.MeshBasicMaterial;
            gm.color.lerp(stacked ? tint : cool, 0.08);
            gm.opacity += (0.34 + st.heat * 0.5 - gm.opacity) * 0.08;
          }

          for (const plate of plates[i]) {
            const pm = plate.material as THREE.MeshStandardMaterial;
            pm.color.lerp(tint, 0.08);
            pm.emissive.lerp(tint, 0.08);
            pm.emissiveIntensity = 0.2 + st.heat * 0.9;
          }

          const isPicked = pickedRef.current === i;
          pads[i].scale.setScalar(
            pads[i].scale.x + ((isPicked ? 1.45 : 1) - pads[i].scale.x) * 0.16,
          );
          pads[i].position.y +=
            ((isPicked ? 0.45 : 0) - pads[i].position.y) * 0.16;
          if (isPicked) m.emissiveIntensity = 1.1;

          // Proposed has one circle rather than a spoke per stage, so there is
          // not necessarily a line here to tint.
          const link = links[i];
          if (link) {
            const lm = link.material as THREE.LineBasicMaterial;
            lm.color.lerp(stacked ? tint : cool, 0.06);
            lm.opacity = stacked ? 0.28 + st.heat * 0.6 : 0.2;
          }
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
      ringGeo.dispose();
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
      proposed
        ? {
            value: fmt(l.peopleNeeded),
            label: `people on the desk, not ${fmt(todayAt.peopleNeeded)}`,
            tone: "moss" as const,
          }
        : {
            value: fmt(l.throttled),
            label: "turned away",
            tone: l.throttled > 0 ? ("flag" as const) : ("moss" as const),
          },
    ],
  });

  /* What the clicked job actually is, drawn from the record. */
  const job = picked !== null ? jobs[picked] : null;
  const step = job && mode === "today" ? STEPS.find((x) => x.n === job.id) : null;
  const reEntries =
    job && mode === "today"
      ? HANDOFFS.filter((_, k) => HANDOFF_STEP[k] === job.id)
      : [];

  return (
    <div className="hub">
      <div className="hub-stage" ref={mountRef}>
        {job ? (
          <div className="probe" role="dialog" aria-label={job.name}>
            <div className="probe-h">
              <b>{job.name}</b>
              <button type="button" onClick={() => setPicked(null)} aria-label="Close">
                &#10005;
              </button>
            </div>
            {step ? <p className="probe-w">{step.w}</p> : null}
            <ul className="probe-figs">
              <li>
                <b className={job.duplication ? "bad" : "ok"}>{job.duplication}</b>
                <span>entered again</span>
              </li>
              <li>
                <b>{job.minutes}</b>
                <span>minutes a caravan</span>
              </li>
              <li>
                <b className={job.duplication ? "bad" : undefined}>
                  {fmt(Math.round((job.minutes * units) / 60))}
                </b>
                <span>hours a year</span>
              </li>
            </ul>
            {step ? <p className="probe-d">{step.d}</p> : null}
            {reEntries.length ? (
              <>
                <p className="probe-label">
                  {reEntries.length === 1
                    ? "The re-entry inside it"
                    : "The re-entries inside it"}
                </p>
                <ul className="probe-list">
                  {reEntries.map(([t, d]) => (
                    <li key={t}>
                      <b>{t}</b>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="probe-clean">
                Nothing is entered twice here.
              </p>
            )}
          </div>
        ) : null}
      </div>

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
        {proposed ? (
          <div className="hud-cell">
            <b className="ok">{fmt(l.peopleNeeded)}</b>
            <span>
              people on the desk, against {fmt(todayAt.peopleNeeded)} the way it
              is done now
            </span>
          </div>
        ) : (
          <div className={`hud-cell ${l.throttled > 0 ? "flag" : ""}`}>
            <b className={l.throttled > 0 ? "bad" : "ok"}>{fmt(l.throttled)}</b>
            <span>turned away, desk cannot take them</span>
          </div>
        )}
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
        {/* A slider, because a hundred steps is not something to click through,
            and the whole argument of the proposed side is that a hundred is
            not a stupid number to ask for. */}
        <label className="volume">
          <span>
            <b>{mult}&times;</b> today&rsquo;s volume
            <i>{fmt(units)} caravans a year</i>
          </span>
          <input
            type="range"
            min={1}
            max={100}
            step={1}
            value={mult}
            onChange={(e) => setMult(Number(e.target.value))}
            aria-label="Years of volume"
          />
        </label>

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
