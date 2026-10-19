"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type MatterNS from "matter-js";
import { heroBox, heroSketch, heroWords, site, type HeroWord } from "@/lib/content";
import { useMotion } from "@/lib/motion";

/*
  The hero is plain HTML: every word is a real element and every link a real <a>, so keyboards,
  screen readers and no-JS visitors get working links. One matter-js world decides where words
  should be; each frame we copy that onto the element as a CSS transform.

  Hover / focus a link -> CONTACT drops to hang straight down from its right end and swings like a
                          clock pendulum: one second left, one second right, same height every time.
                          The swing is scripted (not simulated) so it never wobbles; it passes through
                          the other words, so nothing gets knocked.
  Drag any word (mouse) -> it follows the cursor on a spring; whatever it hits starts falling. Loose
                          words move in slow motion (PLAY_SPEED) so the knock-on is easy to watch.
  Click / tap / Enter   -> CONTACT swings ~1 s, now hitting things, then everything falls to the
                          bottom of the screen; at ~2 s the page goes to the section (RESUME opens
                          the PDF). Later clicks go straight there.
  Motion off            -> none of the above; links go straight to their target.
  "Grab me!"            -> on each page load one random word (from those marked `hint` in content.ts) gets a speech bubble and hops now and
                          then. Once that word is grabbed or knocked loose, the bubble goes away.
                          Hidden on touch screens and with motion off (no dragging there).
*/

const HINGE_MS = 1000;
const GO_MS = 2000;
const GRAVITY = 1.7;
const SWING_DEG = 18; // pendulum swing each side of straight down
const SWING_PERIOD = 2000; // ms for a full left-right-left swing (1 s each way)
const PLAY_SPEED = 0.5; // physics speed after grabbing words (1 = real time)
const FALL_SPEED = 0.75; // physics speed for the click-to-navigate fall
const DRAG_SLOP = 5;
const CAT_WORD = 0x0001;
const CAT_EDGE = 0x0002;

type Mode = "rest" | "hover" | "falling" | "fallen" | "play";
type Rest = { cx: number; cy: number; a: number; w: number; h: number };
// scripted pendulum: P = pivot (CONTACT's right end at rest), arm = pivot to centre, d0 = start angle
// measured from straight down
type Pend = { P: { x: number; y: number }; arm: number; t0: number; d0: number };
type Sim = {
  M: typeof MatterNS;
  engine: MatterNS.Engine;
  bodies: MatterNS.Body[];
  rest: Rest[];
  pend: Pend | null;
  drag: { c: MatterNS.Constraint; i: number } | null;
  tween: { i: number; x: number; y: number; a: number; t0: number } | null;
  raf: number;
  calm: number;
  timers: number[];
};

const pct = (v: number, of: number) => `${(v / of) * 100}%`;
const restAngle = (el: HTMLElement) => parseFloat(getComputedStyle(el).getPropertyValue("--r")) || 0;
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const smooth = (t: number) => t * t * (3 - 2 * t);
const DOWN = -Math.PI / 2; // word hanging straight down from its right end
const physicsSpeed = (m: Mode) => (m === "falling" || m === "fallen" ? FALL_SPEED : PLAY_SPEED);

/* Pendulum angle at time t (ms since it started) and its rate (rad/ms). It starts at the resting
   angle with zero speed, swings down through vertical and settles into a steady swing of
   ±SWING_DEG by the end of the first second: amplitude eases from d0 to A while
   theta = DOWN + amp * cos(wt). */
function pendAngle(d0: number, t: number) {
  const w = (2 * Math.PI) / SWING_PERIOD;
  const A = (SWING_DEG * Math.PI) / 180;
  const u = Math.min(1, t / (SWING_PERIOD / 2));
  const amp = d0 + (A - d0) * smooth(u);
  const dAmp = u < 1 ? ((A - d0) * 6 * u * (1 - u)) / (SWING_PERIOD / 2) : 0;
  return { theta: DOWN + amp * Math.cos(w * t), rate: dAmp * Math.cos(w * t) - amp * w * Math.sin(w * t) };
}

export default function Hero() {
  const { motion, setMotion } = useMotion();
  const stageRef = useRef<HTMLElement>(null);
  const wordRefs = useRef<(HTMLElement | null)[]>([]);
  const matterRef = useRef<typeof MatterNS | null>(null);
  const simRef = useRef<Sim | null>(null);
  const modeRef = useRef<Mode>("rest");
  const targetRef = useRef<HeroWord["target"]>(undefined);
  const hoverRef = useRef({ count: 0, leaveTimer: 0, pendingHang: false });
  const dragStart = useRef<{ i: number; x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const motionRef = useRef(motion);
  motionRef.current = motion;
  const [hint, setHint] = useState(-1);
  const hintRef = useRef(-1);

  // pick the "Grab me!" word after hydration so server and client HTML match
  useEffect(() => {
    const pool = heroWords.flatMap((w, i) => (w.hint ? [i] : []));
    const i = pool[Math.floor(Math.random() * pool.length)];
    hintRef.current = i;
    setHint(i);
  }, []);

  const C = heroWords.findIndex((w) => w.target === "contact");

  const setMode = (m: Mode) => {
    modeRef.current = m;
    stageRef.current?.setAttribute("data-phase", m);
    if (simRef.current) simRef.current.engine.timing.timeScale = physicsSpeed(m);
  };

  const loadMatter = useCallback(async () => {
    if (!matterRef.current) matterRef.current = (await import("matter-js")).default;
    return matterRef.current;
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => void loadMatter(), 1200);
    return () => window.clearTimeout(id);
  }, [loadMatter]);

  /* ---------------- world ---------------- */

  const stagePoint = (clientX: number, clientY: number) => {
    const r = stageRef.current!.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  };

  const destroySim = useCallback(() => {
    const sim = simRef.current;
    if (sim) {
      cancelAnimationFrame(sim.raf);
      sim.timers.forEach((t) => window.clearTimeout(t));
      sim.M.Engine.clear(sim.engine);
      simRef.current = null;
    }
    wordRefs.current.forEach((el) => {
      if (el) {
        el.style.transform = "";
        delete el.dataset.moving;
      }
    });
    setMode("rest");
  }, []);

  const render = (sim: Sim, i: number) => {
    const el = wordRefs.current[i];
    const b = sim.bodies[i];
    const r = sim.rest[i];
    if (!el) return;
    el.style.transform = `translate(${b.position.x - r.cx}px, ${b.position.y - r.cy}px) rotate(${b.angle}rad)`;
    el.dataset.moving = "";
    // the "Grab me!" word was grabbed or knocked loose (CONTACT's hover swing doesn't count)
    if (i === hintRef.current && !(i === C && (sim.pend || sim.tween?.i === C))) {
      stageRef.current?.setAttribute("data-hint-done", "");
    }
  };

  const tick = useCallback(() => {
    const sim = simRef.current;
    if (!sim) return;
    const { M } = sim;
    M.Engine.update(sim.engine, 1000 / 60);

    // ease a word (CONTACT after hover) back to its resting pose
    if (sim.tween) {
      const { i, x, y, a, t0 } = sim.tween;
      const r = sim.rest[i];
      const t = Math.min(1, (performance.now() - t0) / 480);
      const k = ease(t);
      M.Body.setPosition(sim.bodies[i], { x: x + (r.cx - x) * k, y: y + (r.cy - y) * k });
      M.Body.setAngle(sim.bodies[i], a + (r.a - a) * k);
      render(sim, i);
      if (t >= 1) {
        sim.tween = null;
        const el = wordRefs.current[i];
        if (el) {
          el.style.transform = "";
          delete el.dataset.moving;
        }
        if (hoverRef.current.pendingHang && hoverRef.current.count > 0) hang();
        hoverRef.current.pendingHang = false;
      }
    }

    // scripted clock pendulum
    if (sim.pend) {
      posePend(sim, performance.now());
      render(sim, C);
    }

    let moving = 0;
    sim.bodies.forEach((b, i) => {
      if (b.isStatic) return;
      render(sim, i);
      if (b.speed > 0.06 || Math.abs(b.angularVelocity) > 0.002) moving++;
    });
    sim.calm = moving === 0 ? sim.calm + 1 : 0;
    const busy = sim.pend || sim.drag || sim.tween || modeRef.current === "falling";
    if (!busy && sim.calm > 40) {
      sim.raf = 0; // everything settled: stop until the next interaction
      return;
    }
    sim.raf = requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [C]);

  const wake = () => {
    const sim = simRef.current;
    if (sim && !sim.raf) {
      sim.calm = 0;
      sim.raf = requestAnimationFrame(tick);
    }
  };

  const ensureSim = (): Sim | null => {
    if (simRef.current) return simRef.current;
    const M = matterRef.current;
    const stage = stageRef.current;
    if (!M || !stage) return null;
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    const sRect = stage.getBoundingClientRect();
    const engine = M.Engine.create({ gravity: { x: 0, y: GRAVITY } });
    engine.timing.timeScale = physicsSpeed(modeRef.current);
    const edge = { isStatic: true, label: "edge", collisionFilter: { category: CAT_EDGE, mask: CAT_WORD } };
    M.Composite.add(engine.world, [
      M.Bodies.rectangle(W / 2, H + 50, W * 3, 100, edge),
      M.Bodies.rectangle(-50, H / 2, 100, H * 4, edge),
      M.Bodies.rectangle(W + 50, H / 2, 100, H * 4, edge),
    ]);
    const rest: Rest[] = [];
    const bodies = wordRefs.current.map((el, i) => {
      // left/top place the word's centre (CSS translate -50% does the centring), and rotation keeps
      // the centre put. Reading offsets rather than the on-screen box ignores the "Grab me!" hop.
      const parent = (el!.offsetParent as HTMLElement).getBoundingClientRect();
      const r: Rest = {
        cx: parent.left - sRect.left + el!.offsetLeft,
        cy: parent.top - sRect.top + el!.offsetTop,
        a: (restAngle(el!) * Math.PI) / 180,
        w: el!.offsetWidth,
        h: el!.offsetHeight,
      };
      rest.push(r);
      const b = M.Bodies.rectangle(r.cx, r.cy, r.w, r.h * 0.9, {
        angle: r.a,
        restitution: 0.15,
        friction: 0.3,
        frictionAir: 0.012,
        chamfer: { radius: 2 },
        label: `word-${i}`,
        collisionFilter: { category: CAT_WORD, mask: CAT_WORD | CAT_EDGE },
      });
      M.Body.setStatic(b, true);
      return b;
    });
    M.Composite.add(engine.world, bodies);

    // a moving word knocks loose any resting word it touches (not during the hover swing)
    M.Events.on(engine, "collisionStart", ({ pairs }) => {
      if (modeRef.current === "hover" || modeRef.current === "rest") return;
      for (const { bodyA, bodyB } of pairs) {
        for (const [a, b] of [
          [bodyA, bodyB],
          [bodyB, bodyA],
        ]) {
          if (!a.isStatic && b.isStatic && b.label.startsWith("word-")) M.Body.setStatic(b, false);
        }
      }
    });

    simRef.current = {
      M,
      engine,
      bodies,
      rest,
      pend: null,
      drag: null,
      tween: null,
      raf: 0,
      calm: 0,
      timers: [],
    };
    return simRef.current;
  };

  const isAtRest = (sim: Sim, i: number) => sim.bodies[i].isStatic && !(sim.tween && sim.tween.i === i);

  /* ---------------- pendulum ---------------- */

  // place CONTACT on the pendulum at time `now`, and give it the matching velocity so that
  // anything it hits (during the click swing) gets a realistic knock, and a release looks continuous
  function posePend(sim: Sim, now: number) {
    const p = sim.pend!;
    const { M } = sim;
    const b = sim.bodies[C];
    const { theta, rate } = pendAngle(p.d0, now - p.t0);
    M.Body.setAngle(b, theta);
    M.Body.setPosition(b, { x: p.P.x - p.arm * Math.cos(theta), y: p.P.y - p.arm * Math.sin(theta) });
    // rate is per real ms; matter wants per 16.7 ms of simulated time
    const k = (1000 / 60) / sim.engine.timing.timeScale;
    M.Body.setAngularVelocity(b, rate * k);
    M.Body.setVelocity(b, { x: p.arm * Math.sin(theta) * rate * k, y: -p.arm * Math.cos(theta) * rate * k });
  }

  function hang() {
    const sim = ensureSim();
    if (!sim || sim.pend) return;
    if (sim.tween?.i === C) {
      hoverRef.current.pendingHang = true;
      return;
    }
    const b = sim.bodies[C];
    if (!b.isStatic) return; // CONTACT has already been knocked away
    const { M } = sim;
    const r = sim.rest[C];
    M.Body.setStatic(b, false);
    b.frictionAir = 0.012;
    b.collisionFilter.mask = modeRef.current === "falling" ? CAT_WORD | CAT_EDGE : CAT_EDGE;
    sim.pend = {
      P: { x: r.cx + (r.w / 2) * Math.cos(r.a), y: r.cy + (r.w / 2) * Math.sin(r.a) },
      arm: r.w / 2,
      t0: performance.now(),
      d0: r.a - DOWN,
    };
    wake();
  }

  // let go of the pendulum: CONTACT keeps its current speed and becomes a normal falling word
  const releasePend = (sim: Sim) => {
    if (!sim.pend) return;
    posePend(sim, performance.now());
    sim.pend = null;
  };

  const unhang = () => {
    const sim = simRef.current;
    if (!sim || !sim.pend || modeRef.current !== "hover") return;
    const { M } = sim;
    sim.pend = null;
    const b = sim.bodies[C];
    sim.tween = { i: C, x: b.position.x, y: b.position.y, a: b.angle, t0: performance.now() };
    M.Body.setStatic(b, true);
    b.collisionFilter.mask = CAT_WORD | CAT_EDGE;
    setMode(sim.bodies.some((x, i) => i !== C && !x.isStatic) ? "play" : "rest");
    wake();
  };

  const onEnter = () => {
    const h = hoverRef.current;
    window.clearTimeout(h.leaveTimer);
    h.count += 1;
    if (!motionRef.current) return;
    const m = modeRef.current;
    if (m !== "rest" && m !== "play" && m !== "hover") return;
    void loadMatter().then(() => {
      if (hoverRef.current.count === 0 || !motionRef.current) return;
      const mm = modeRef.current;
      if (mm !== "rest" && mm !== "play") return;
      const sim = ensureSim();
      if (!sim || !isAtRest(sim, C)) {
        if (sim?.tween?.i === C) hoverRef.current.pendingHang = true;
        return;
      }
      setMode("hover");
      hang();
    });
  };

  const onLeave = () => {
    const h = hoverRef.current;
    h.count = Math.max(0, h.count - 1);
    window.clearTimeout(h.leaveTimer);
    // small delay so moving from one link to the next doesn't restart the swing
    h.leaveTimer = window.setTimeout(() => {
      if (h.count === 0) {
        h.pendingHang = false;
        unhang();
      }
    }, 140);
  };

  /* ---------------- navigation + fall ---------------- */

  const go = useCallback((target: HeroWord["target"]) => {
    if (!target) return;
    if (target === "resume") {
      window.location.href = "/resume.pdf";
      return;
    }
    const el = document.getElementById(target);
    if (!el) return;
    el.scrollIntoView({ behavior: motionRef.current ? "smooth" : "auto", block: "start" });
    history.replaceState(null, "", `#${target}`);
    el.focus({ preventScroll: true });
  }, []);

  const runFall = async () => {
    await loadMatter();
    const sim = ensureSim();
    if (!sim) return go(targetRef.current);
    const { M } = sim;
    setMode("falling");
    if (sim.tween?.i === C) {
      // CONTACT was easing home after a hover: snap it home and swing from there
      const r = sim.rest[C];
      sim.tween = null;
      M.Body.setPosition(sim.bodies[C], { x: r.cx, y: r.cy });
      M.Body.setAngle(sim.bodies[C], r.a);
    }
    if (!sim.pend && isAtRest(sim, C)) hang();
    sim.bodies[C].collisionFilter.mask = CAT_WORD | CAT_EDGE; // from now on it hits things
    wake();

    const holdMs = sim.pend ? HINGE_MS : 150;
    sim.timers.push(
      window.setTimeout(() => {
        releasePend(sim);
        sim.bodies
          .map((b, i) => ({ b, i }))
          .filter((x) => x.b.isStatic)
          .sort((p, q) => p.b.position.y - q.b.position.y)
          .forEach(({ b }, k) =>
            sim.timers.push(window.setTimeout(() => b.isStatic && M.Body.setStatic(b, false), 35 * k)),
          );
      }, holdMs),
      window.setTimeout(() => {
        setMode("fallen");
        go(targetRef.current);
      }, holdMs + (GO_MS - HINGE_MS)),
    );
  };

  const onLinkClick = (e: React.MouseEvent<HTMLElement>, word: HeroWord) => {
    if (suppressClick.current) {
      e.preventDefault();
      suppressClick.current = false;
      return;
    }
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    targetRef.current = word.target;
    if (!motionRef.current || modeRef.current === "fallen") return go(word.target);
    if (modeRef.current === "falling") return; // already on its way; the latest click wins
    void runFall();
  };

  /* ---------------- drag (mouse / pen) ---------------- */

  const onPointerDown = (e: React.PointerEvent, i: number) => {
    if (!motionRef.current || e.pointerType === "touch" || e.button !== 0) return;
    dragStart.current = { i, x: e.clientX, y: e.clientY };
    void loadMatter();
  };

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const start = dragStart.current;
      const sim0 = simRef.current;
      if (sim0?.drag) {
        const p = stagePoint(e.clientX, e.clientY);
        sim0.drag.c.pointA = p;
        return;
      }
      if (!start) return;
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) < DRAG_SLOP) return;
      dragStart.current = null;
      const sim = ensureSim();
      if (!sim) return;
      const { M } = sim;
      const b = sim.bodies[start.i];
      if (start.i === C && sim.pend) sim.pend = null;
      if (sim.tween?.i === start.i) sim.tween = null;
      if (b.isStatic) M.Body.setStatic(b, false);
      b.collisionFilter.mask = CAT_WORD | CAT_EDGE;
      b.frictionAir = 0.02;
      if (modeRef.current === "rest" || modeRef.current === "hover") setMode("play");
      const p = stagePoint(e.clientX, e.clientY);
      const c = M.Constraint.create({
        pointA: p,
        bodyB: b,
        pointB: { x: p.x - b.position.x, y: p.y - b.position.y },
        // matter scales constraint strength by the physics speed; undo that so the word still
        // keeps up with the cursor in slow motion
        stiffness: Math.min(1, 0.18 / sim.engine.timing.timeScale),
        damping: 0.1,
        length: 0,
      });
      M.Composite.add(sim.engine.world, c);
      sim.drag = { c, i: start.i };
      suppressClick.current = true;
      stageRef.current?.setAttribute("data-dragging", "");
      wake();
    };
    const up = () => {
      dragStart.current = null;
      const sim = simRef.current;
      if (sim?.drag) {
        sim.M.Composite.remove(sim.engine.world, sim.drag.c);
        sim.bodies[sim.drag.i].frictionAir = 0.012;
        sim.drag = null;
        stageRef.current?.removeAttribute("data-dragging");
        wake();
        // the click that follows this pointerup is swallowed by onLinkClick
        window.setTimeout(() => (suppressClick.current = false), 0);
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- reset on motion off / resize ---------------- */

  useEffect(() => {
    if (!motion) destroySim();
  }, [motion, destroySim]);

  useEffect(() => {
    let w = window.innerWidth;
    const onResize = () => {
      if (Math.abs(window.innerWidth - w) < 2) return; // ignore phone URL-bar height changes
      w = window.innerWidth;
      destroySim();
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      destroySim();
    };
  }, [destroySim]);

  /* ---------------- markup ---------------- */

  const { x0, y0, w: BW, h: BH } = heroBox;

  return (
    <header className="hero" ref={stageRef}>
      <button type="button" className="motion-toggle" aria-pressed={motion} onClick={() => setMotion(!motion)}>
        MOTION: {motion ? "ON" : "OFF"}
      </button>

      <div className="hero-box" style={{ aspectRatio: `${BW} / ${BH}`, "--font": `${(heroBox.font / BW) * 100}cqw` } as React.CSSProperties}>
        <h1 className="sr-only">{site.bio}</h1>
        <img
          className="sketch"
          src="/hero-drawing.svg"
          width={400}
          height={340}
          alt="Line drawing of Jayson wearing wired earphones, smiling at his laptop, with a cup of coffee beside it"
          fetchPriority="high"
          draggable={false}
          style={{ left: pct(heroSketch.x - x0, BW), top: pct(heroSketch.y - y0, BH), width: pct(heroSketch.w, BW) }}
        />
        <nav className="cloud" aria-label="Sections">
          {/* While CONTACT swings it slides out from under the cursor. This invisible copy stays at
              its resting spot so hovering / clicking there keeps working instead of flickering. */}
          {C >= 0 && (
            <span
              className="word contact-ghost"
              aria-hidden="true"
              style={{ left: pct(heroWords[C].x - x0, BW), top: pct(heroWords[C].y - y0, BH), "--r": `${heroWords[C].r}deg` } as React.CSSProperties}
              onClick={(e) => onLinkClick(e, heroWords[C])}
              onPointerDown={(e) => onPointerDown(e, C)}
              onPointerEnter={onEnter}
              onPointerLeave={onLeave}
            >
              {heroWords[C].text}
            </span>
          )}
          {heroWords.map((w, i) => {
            const style = {
              left: pct(w.x - x0, BW),
              top: pct(w.y - y0, BH),
              "--r": `${w.r}deg`,
              // how far the upright "Grab me!" bubble must sit above a tilted word to clear it
              "--lift": `${(0.45 * Math.cos((w.r * Math.PI) / 180) + 2.9 * Math.abs(Math.sin((w.r * Math.PI) / 180))).toFixed(2)}em`,
            } as React.CSSProperties;
            const ref = (el: HTMLElement | null) => {
              wordRefs.current[i] = el;
            };
            const bubble =
              i === hint ? (
                <span className="hint" aria-hidden="true">
                  Grab me!
                </span>
              ) : null;
            const hintClass = i === hint ? " has-hint" : "";
            if (!w.href) {
              return (
                <span
                  key={i}
                  ref={ref}
                  className={`word${hintClass}`}
                  style={style}
                  aria-hidden="true"
                  onPointerDown={(e) => onPointerDown(e, i)}
                >
                  {w.text}
                  {bubble}
                </span>
              );
            }
            return (
              <a
                key={i}
                ref={ref}
                href={w.href}
                className={`word link${i === C ? " is-contact" : ""}${hintClass}`}
                style={style}
                draggable={false}
                onClick={(e) => onLinkClick(e, w)}
                onPointerDown={(e) => onPointerDown(e, i)}
                onPointerEnter={onEnter}
                onPointerLeave={onLeave}
                onFocus={onEnter}
                onBlur={onLeave}
              >
                {w.arrows ? (
                  <>
                    <span className="arrows" aria-hidden="true">
                      <i>&gt;</i>
                      <i>&gt;</i>
                      <i>&gt;</i>
                    </span>
                    <span className="link-text">{w.text}</span>
                    <span className="arrows" aria-hidden="true">
                      <i>&gt;</i>
                      <i>&gt;</i>
                      <i>&gt;</i>
                    </span>
                  </>
                ) : (
                  <span className="link-text">{w.text}</span>
                )}
                {bubble}
              </a>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
