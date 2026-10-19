"use client";

import { useCallback, useEffect, useRef } from "react";
import type MatterNS from "matter-js";
import { heroWords, type HeroWord } from "@/lib/content";
import { useMotion } from "@/lib/motion";

/*
  The hero is plain HTML: every word is a real element and every link a real <a>, so keyboards,
  screen readers and no-JS visitors get working links. matter-js only computes where the words
  should be; each frame we copy that position onto the element as a CSS transform.

  Hover/focus on any link  -> CONTACT swings from its top-right corner (Web Animations API).
  Click / tap / Enter      -> CONTACT swings ~1 s on a physics hinge, drops, everything else
                              falls to the bottom of the screen, and after ~2 s we go to the
                              section (RESUME opens the PDF in this tab).
  Motion off               -> no swing, no fall, links go straight to their target.
*/

const SWING_DEG = 13;
const SWING_MS = 1700;
const HINGE_MS = 1000; // CONTACT swings on its hinge this long
const GO_MS = 2000; // then the page moves on
const GRAVITY = 1.7;

type Sim = {
  M: typeof MatterNS;
  engine: MatterNS.Engine;
  bodies: (MatterNS.Body | null)[];
  rest: { cx: number; cy: number }[];
  hinge: MatterNS.Constraint | null;
  raf: number;
  calm: number;
  timers: number[];
};

const rot = (deg: number) => `rotate(${deg}deg)`;
// resting angle of a word (desktop and phone layouts use different angles; CSS picks one)
const restAngle = (el: HTMLElement) => parseFloat(getComputedStyle(el).getPropertyValue("--rot")) || 0;

export default function Hero() {
  const { motion, setMotion } = useMotion();
  const stageRef = useRef<HTMLElement>(null);
  const cloudRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLElement | null)[]>([]);
  const matterRef = useRef<typeof MatterNS | null>(null);
  const swingRef = useRef<Animation | null>(null);
  const simRef = useRef<Sim | null>(null);
  const phaseRef = useRef<"rest" | "running" | "fallen">("rest");
  const targetRef = useRef<HeroWord["target"]>(undefined);
  const hoverCount = useRef(0);
  const motionRef = useRef(motion);
  motionRef.current = motion;

  const contactIndex = heroWords.findIndex((w) => w.target === "contact");

  const loadMatter = useCallback(async () => {
    if (!matterRef.current) matterRef.current = (await import("matter-js")).default;
    return matterRef.current;
  }, []);

  // Warm the physics library in the background so the first click has no delay.
  useEffect(() => {
    const id = window.setTimeout(() => void loadMatter(), 1500);
    return () => window.clearTimeout(id);
  }, [loadMatter]);

  /* ---------------- navigation ---------------- */

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

  /* ---------------- hover swing ---------------- */

  const startSwing = useCallback(() => {
    const el = wordRefs.current[contactIndex];
    if (!el || !motionRef.current || phaseRef.current !== "rest" || swingRef.current) return;
    const r = restAngle(el);
    swingRef.current = el.animate(
      [
        { transform: rot(r), easing: "cubic-bezier(.33,0,.67,1)" },
        { transform: rot(r + SWING_DEG), easing: "cubic-bezier(.33,0,.67,1)", offset: 0.25 },
        { transform: rot(r), easing: "cubic-bezier(.33,0,.67,1)", offset: 0.5 },
        { transform: rot(r - SWING_DEG * 0.8), easing: "cubic-bezier(.33,0,.67,1)", offset: 0.75 },
        { transform: rot(r) },
      ],
      { duration: SWING_MS, iterations: Infinity },
    );
  }, [contactIndex]);

  const stopSwing = useCallback(
    (settle = true) => {
      const el = wordRefs.current[contactIndex];
      const anim = swingRef.current;
      if (!el || !anim) return;
      const current = getComputedStyle(el).transform;
      anim.cancel();
      swingRef.current = null;
      if (settle && current && current !== "none") {
        el.animate([{ transform: current }, { transform: rot(restAngle(el)) }], {
          duration: 450,
          easing: "cubic-bezier(.2,.8,.3,1)",
        });
      }
    },
    [contactIndex],
  );

  const onEnter = () => {
    hoverCount.current += 1;
    void loadMatter();
    startSwing();
  };
  const onLeave = () => {
    hoverCount.current = Math.max(0, hoverCount.current - 1);
    if (hoverCount.current === 0) stopSwing();
  };

  /* ---------------- physics ---------------- */

  const resetWords = useCallback(() => {
    const sim = simRef.current;
    if (sim) {
      cancelAnimationFrame(sim.raf);
      sim.timers.forEach((t) => window.clearTimeout(t));
      sim.M.Engine.clear(sim.engine);
      simRef.current = null;
    }
    wordRefs.current.forEach((el) => {
      if (!el) return;
      el.style.transform = "";
      el.style.transformOrigin = "";
      el.classList.remove("is-free");
    });
    phaseRef.current = "rest";
    stageRef.current?.removeAttribute("data-phase");
  }, []);

  const runFall = useCallback(async () => {
    const stage = stageRef.current;
    const cloud = cloudRef.current;
    if (!stage || !cloud) return;
    phaseRef.current = "running";
    stage.setAttribute("data-phase", "running");

    const M = await loadMatter();
    const contact = wordRefs.current[contactIndex];
    // Read the swing angle (if mid-swing) before cancelling the animation.
    let contactAngle = contact ? restAngle(contact) : 0;
    if (contact) {
      const m = new DOMMatrixReadOnly(getComputedStyle(contact).transform);
      contactAngle = (Math.atan2(m.b, m.a) * 180) / Math.PI;
    }
    stopSwing(false);

    const W = stage.clientWidth;
    const H = stage.clientHeight;
    const sRect = stage.getBoundingClientRect();
    const cRect = cloud.getBoundingClientRect();
    const ox = cRect.left - sRect.left;
    const oy = cRect.top - sRect.top;

    const engine = M.Engine.create({ gravity: { x: 0, y: GRAVITY } });
    const wall = (x: number, y: number, w: number, h: number) =>
      M.Bodies.rectangle(x, y, w, h, { isStatic: true, label: "edge" });
    M.Composite.add(engine.world, [
      wall(W / 2, H + 50, W * 3, 100),
      wall(-50, H / 2, 100, H * 4),
      wall(W + 50, H / 2, 100, H * 4),
    ]);

    const rest: Sim["rest"] = [];
    let hinge: MatterNS.Constraint | null = null;
    const bodies = wordRefs.current.map((el, i) => {
      if (!el) {
        rest.push({ cx: 0, cy: 0 });
        return null;
      }
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const left = ox + el.offsetLeft;
      const top = oy + el.offsetTop;
      const restC = { cx: left + w / 2, cy: top + h / 2 };
      rest.push(restC);

      let cx = restC.cx;
      let cy = restC.cy;
      let angleDeg = restAngle(el);
      if (i === contactIndex) {
        // CONTACT is drawn rotated around its top-right corner; find its true centre.
        angleDeg = contactAngle;
        const a = (angleDeg * Math.PI) / 180;
        const px = left + w;
        const py = top;
        const dx = -w / 2;
        const dy = h / 2;
        cx = px + dx * Math.cos(a) - dy * Math.sin(a);
        cy = py + dx * Math.sin(a) + dy * Math.cos(a);
      }
      const body = M.Bodies.rectangle(cx, cy, w, h * 0.95, {
        angle: (angleDeg * Math.PI) / 180,
        restitution: 0.15,
        friction: 0.3,
        frictionAir: 0.012,
        chamfer: { radius: 2 },
        label: `word-${i}`,
      });
      if (i === contactIndex) {
        // hinge at the drawn top-right corner, which stays put while CONTACT rotates
        const px = left + w;
        const py = top;
        hinge = M.Constraint.create({
          pointA: { x: px, y: py },
          bodyB: body,
          pointB: { x: px - cx, y: py - cy },
          stiffness: 0.9,
          damping: 0.02,
          length: 0,
        });
        M.Body.setVelocity(body, { x: -2.5, y: 1.5 });
      } else {
        M.Body.setStatic(body, true);
      }
      el.style.transformOrigin = "50% 50%";
      el.classList.add("is-free");
      return body;
    });
    M.Composite.add(engine.world, bodies.filter(Boolean) as MatterNS.Body[]);
    if (hinge) M.Composite.add(engine.world, hinge);

    // A moving word knocks loose any frozen word it touches.
    M.Events.on(engine, "collisionStart", ({ pairs }) => {
      for (const { bodyA, bodyB } of pairs) {
        for (const [a, b] of [
          [bodyA, bodyB],
          [bodyB, bodyA],
        ]) {
          if (!a.isStatic && b.isStatic && b.label.startsWith("word-")) {
            M.Body.setStatic(b, false);
          }
        }
      }
    });

    const sim: Sim = { M, engine, bodies, rest, hinge, raf: 0, calm: 0, timers: [] };
    simRef.current = sim;

    const tick = () => {
      M.Engine.update(engine, 1000 / 60);
      let moving = 0;
      bodies.forEach((b, i) => {
        const el = wordRefs.current[i];
        if (!b || !el) return;
        const r = rest[i];
        el.style.transform = `translate(${b.position.x - r.cx}px, ${b.position.y - r.cy}px) rotate(${b.angle}rad)`;
        if (!b.isStatic && b.speed > 0.08) moving++;
      });
      sim.calm = moving === 0 ? sim.calm + 1 : 0;
      if (phaseRef.current === "fallen" && sim.calm > 45) return; // settled: stop the loop
      sim.raf = requestAnimationFrame(tick);
    };
    sim.raf = requestAnimationFrame(tick);

    // After the swing, let go of the hinge and make sure every word comes down, top first.
    sim.timers.push(
      window.setTimeout(() => {
        if (sim.hinge) {
          M.Composite.remove(engine.world, sim.hinge);
          sim.hinge = null;
        }
        const frozen = bodies
          .map((b, i) => ({ b, i }))
          .filter((x) => x.b && x.b.isStatic)
          .sort((a, b) => a.b!.position.y - b.b!.position.y);
        frozen.forEach(({ b }, k) => {
          sim.timers.push(
            window.setTimeout(() => {
              if (b && b.isStatic) M.Body.setStatic(b, false);
            }, 35 * k),
          );
        });
      }, HINGE_MS),
    );

    sim.timers.push(
      window.setTimeout(() => {
        phaseRef.current = "fallen";
        stage.setAttribute("data-phase", "fallen");
        go(targetRef.current);
      }, GO_MS),
    );
  }, [contactIndex, go, loadMatter, stopSwing]);

  const onLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, word: HeroWord) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    targetRef.current = word.target;
    if (!motionRef.current || phaseRef.current === "fallen") {
      go(word.target);
      return;
    }
    if (phaseRef.current === "running") return; // already on its way; the latest click wins
    void runFall();
  };

  // Motion switched off, or the window resized after a fall: tidy the words back into place.
  useEffect(() => {
    if (!motion) {
      stopSwing(false);
      resetWords();
    }
  }, [motion, resetWords, stopSwing]);

  useEffect(() => {
    let w = window.innerWidth;
    const onResize = () => {
      if (Math.abs(window.innerWidth - w) < 2) return; // ignore mobile URL-bar height changes
      w = window.innerWidth;
      resetWords();
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      resetWords();
    };
  }, [resetWords]);

  const bioSentence = "Jayson Kong is an AI engineer based in Kuala Lumpur.";

  return (
    <header className="hero" ref={stageRef}>
      <button
        type="button"
        className="motion-toggle"
        aria-pressed={motion}
        onClick={() => setMotion(!motion)}
      >
        MOTION: {motion ? "ON" : "OFF"}
      </button>

      <div className="hero-inner">
        <h1 className="sr-only">{bioSentence}</h1>
        <nav className="cloud" ref={cloudRef} aria-label="Sections">
          {heroWords.map((w, i) => {
            const [mx, my, mr] = w.m ?? [w.x, w.y, w.r];
            const style = {
              "--x": `${w.x}%`,
              "--y": `${w.y}%`,
              "--r": `${w.r}deg`,
              "--mx": `${mx}%`,
              "--my": `${my}%`,
              "--mr": `${mr}deg`,
            } as React.CSSProperties;
            if (!w.href) {
              return (
                <span
                  key={i}
                  className="word"
                  style={style}
                  aria-hidden="true"
                  ref={(el) => {
                    wordRefs.current[i] = el;
                  }}
                >
                  {w.text}
                </span>
              );
            }
            return (
              <a
                key={i}
                href={w.href}
                className={`word link${i === contactIndex ? " is-hinge" : ""}`}
                style={style}
                ref={(el) => {
                  wordRefs.current[i] = el;
                }}
                onClick={(e) => onLinkClick(e, w)}
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

        <img
          className="sketch"
          src="/hero-sketch-640.webp"
          srcSet="/hero-sketch-320.webp 320w, /hero-sketch-640.webp 640w"
          sizes="(max-width: 520px) 58vw, 300px"
          width={868}
          height={908}
          alt="Pencil sketch of Jayson sitting cross-legged on the floor, typing on a laptop"
          fetchPriority="high"
        />
      </div>
    </header>
  );
}
