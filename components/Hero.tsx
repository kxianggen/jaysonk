"use client";

import { useCallback, useEffect, useRef } from "react";
import type MatterNS from "matter-js";
import { heroBox, heroSketch, heroWords, type HeroWord } from "@/lib/content";
import { useMotion } from "@/lib/motion";

/*
  The hero is plain HTML: every word is a real element and every link a real <a>, so keyboards,
  screen readers and no-JS visitors get working links. One matter-js world decides where words
  should be; each frame we copy that onto the element as a CSS transform.

  Hover / focus a link -> CONTACT hangs from its top-right corner and swings like a clock pendulum
                          (passes through the other words, so nothing gets knocked).
  Drag any word (mouse) -> it follows the cursor on a spring; whatever it hits starts falling.
  Click / tap / Enter   -> CONTACT swings ~1 s, now hitting things, then everything falls to the
                          bottom of the screen; at ~2 s the page goes to the section (RESUME opens
                          the PDF). Later clicks go straight there.
  Motion off            -> none of the above; links go straight to their target.
*/

const HINGE_MS = 1000;
const GO_MS = 2000;
const GRAVITY = 1.7;
const SWING_TARGET = 0.46; // ~26 degrees each side of the hanging angle while hovering
const DRAG_SLOP = 5;
const CAT_WORD = 0x0001;
const CAT_EDGE = 0x0002;

type Mode = "rest" | "hover" | "falling" | "fallen" | "play";
type Rest = { cx: number; cy: number; a: number; w: number; h: number };
type Sim = {
  M: typeof MatterNS;
  engine: MatterNS.Engine;
  bodies: MatterNS.Body[];
  rest: Rest[];
  hinge: MatterNS.Constraint | null;
  drag: { c: MatterNS.Constraint; i: number } | null;
  tween: { i: number; x: number; y: number; a: number; t0: number } | null;
  swing: { sign: number; peak: number };
  raf: number;
  calm: number;
  timers: number[];
};

const pct = (v: number, of: number) => `${(v / of) * 100}%`;
const restAngle = (el: HTMLElement) => parseFloat(getComputedStyle(el).getPropertyValue("--r")) || 0;
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

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

  const C = heroWords.findIndex((w) => w.target === "contact");

  const setMode = (m: Mode) => {
    modeRef.current = m;
    stageRef.current?.setAttribute("data-phase", m);
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
      if (el) el.style.transform = "";
    });
    setMode("rest");
  }, []);

  const render = (sim: Sim, i: number) => {
    const el = wordRefs.current[i];
    const b = sim.bodies[i];
    const r = sim.rest[i];
    if (el) el.style.transform = `translate(${b.position.x - r.cx}px, ${b.position.y - r.cy}px) rotate(${b.angle}rad)`;
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
        if (el) el.style.transform = "";
        if (hoverRef.current.pendingHang && hoverRef.current.count > 0) hang();
        hoverRef.current.pendingHang = false;
      }
    }

    // keep the hover pendulum at a steady clock-like swing
    if (sim.hinge && modeRef.current === "hover") {
      const b = sim.bodies[C];
      // hanging from a corner, the word rests a little off vertical: its centre sits right
      // under the hinge. Measure the swing from that resting angle.
      const r = sim.rest[C];
      const eq = -Math.PI / 2 + Math.atan2(r.h * 0.9, r.w);
      let phi = b.angle - eq;
      phi = Math.atan2(Math.sin(phi), Math.cos(phi));
      const sign = phi > 0 ? 1 : -1;
      sim.swing.peak = Math.max(sim.swing.peak, Math.abs(phi));
      if (sim.swing.sign !== 0 && sign !== sim.swing.sign && sim.swing.peak > 0.02) {
        const k = Math.min(1.12, Math.max(0.72, SWING_TARGET / sim.swing.peak));
        M.Body.setVelocity(b, { x: b.velocity.x * k, y: b.velocity.y * k });
        M.Body.setAngularVelocity(b, b.angularVelocity * k);
        sim.swing.peak = 0;
      }
      sim.swing.sign = sign;
    }

    let moving = 0;
    sim.bodies.forEach((b, i) => {
      if (b.isStatic) return;
      render(sim, i);
      if (b.speed > 0.06 || Math.abs(b.angularVelocity) > 0.002) moving++;
    });
    sim.calm = moving === 0 ? sim.calm + 1 : 0;
    const busy = sim.hinge || sim.drag || sim.tween || modeRef.current === "falling";
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
    const edge = { isStatic: true, label: "edge", collisionFilter: { category: CAT_EDGE, mask: CAT_WORD } };
    M.Composite.add(engine.world, [
      M.Bodies.rectangle(W / 2, H + 50, W * 3, 100, edge),
      M.Bodies.rectangle(-50, H / 2, 100, H * 4, edge),
      M.Bodies.rectangle(W + 50, H / 2, 100, H * 4, edge),
    ]);
    const rest: Rest[] = [];
    const bodies = wordRefs.current.map((el, i) => {
      const box = el!.getBoundingClientRect(); // rotation keeps the centre where it is
      const r: Rest = {
        cx: box.left + box.width / 2 - sRect.left,
        cy: box.top + box.height / 2 - sRect.top,
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
      hinge: null,
      drag: null,
      tween: null,
      swing: { sign: 0, peak: 0 },
      raf: 0,
      calm: 0,
      timers: [],
    };
    return simRef.current;
  };

  const isAtRest = (sim: Sim, i: number) => sim.bodies[i].isStatic && !(sim.tween && sim.tween.i === i);

  /* ---------------- pendulum ---------------- */

  function hang() {
    const sim = ensureSim();
    if (!sim || sim.hinge) return;
    if (sim.tween?.i === C) {
      hoverRef.current.pendingHang = true;
      return;
    }
    const b = sim.bodies[C];
    if (!b.isStatic) return; // CONTACT has already been knocked away
    const { M } = sim;
    const r = sim.rest[C];
    const pivot = {
      x: r.cx + (r.w / 2) * Math.cos(r.a) + (r.h / 2) * Math.sin(r.a),
      y: r.cy + (r.w / 2) * Math.sin(r.a) - (r.h / 2) * Math.cos(r.a),
    };
    M.Body.setStatic(b, false);
    b.frictionAir = 0.002;
    b.collisionFilter.mask = modeRef.current === "falling" ? CAT_WORD | CAT_EDGE : CAT_EDGE;
    sim.hinge = M.Constraint.create({
      pointA: pivot,
      bodyB: b,
      pointB: { x: pivot.x - b.position.x, y: pivot.y - b.position.y },
      stiffness: 1,
      damping: 0,
      length: 0,
    });
    M.Composite.add(sim.engine.world, sim.hinge);
    sim.swing = { sign: 0, peak: 0 };
    wake();
  }

  const unhang = () => {
    const sim = simRef.current;
    if (!sim || !sim.hinge || modeRef.current !== "hover") return;
    const { M } = sim;
    M.Composite.remove(sim.engine.world, sim.hinge);
    sim.hinge = null;
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
    const wasHanging = !!sim.hinge;
    setMode("falling");
    if (sim.tween?.i === C) {
      sim.tween = null;
      M.Body.setStatic(sim.bodies[C], false);
    }
    if (!wasHanging && isAtRest(sim, C)) hang();
    const contact = sim.bodies[C];
    contact.collisionFilter.mask = CAT_WORD | CAT_EDGE; // from now on it hits things
    contact.frictionAir = 0.012;
    if (wasHanging) M.Body.setAngularVelocity(contact, contact.angularVelocity * 1.4);
    wake();

    const holdMs = sim.hinge ? HINGE_MS : 150;
    sim.timers.push(
      window.setTimeout(() => {
        if (sim.hinge) {
          M.Composite.remove(sim.engine.world, sim.hinge);
          sim.hinge = null;
        }
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

  const onLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, word: HeroWord) => {
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
      if (start.i === C && sim.hinge) {
        M.Composite.remove(sim.engine.world, sim.hinge);
        sim.hinge = null;
      }
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
        stiffness: 0.18,
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
        <h1 className="sr-only">Jayson Kong is an AI engineer based in Kuala Lumpur.</h1>
        <img
          className="sketch"
          src="/hero-sketch-640.webp"
          srcSet="/hero-sketch-320.webp 320w, /hero-sketch-640.webp 640w"
          sizes="220px"
          width={868}
          height={908}
          alt="Pencil sketch of Jayson sitting cross-legged on the floor, typing on a laptop"
          fetchPriority="high"
          draggable={false}
          style={{ left: pct(heroSketch.x - x0, BW), top: pct(heroSketch.y - y0, BH), width: pct(heroSketch.w, BW) }}
        />
        <nav className="cloud" aria-label="Sections">
          {heroWords.map((w, i) => {
            const style = {
              left: pct(w.x - x0, BW),
              top: pct(w.y - y0, BH),
              "--r": `${w.r}deg`,
            } as React.CSSProperties;
            const ref = (el: HTMLElement | null) => {
              wordRefs.current[i] = el;
            };
            if (!w.href) {
              return (
                <span
                  key={i}
                  ref={ref}
                  className="word"
                  style={style}
                  aria-hidden="true"
                  onPointerDown={(e) => onPointerDown(e, i)}
                >
                  {w.text}
                </span>
              );
            }
            return (
              <a
                key={i}
                ref={ref}
                href={w.href}
                className="word link"
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
              </a>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
