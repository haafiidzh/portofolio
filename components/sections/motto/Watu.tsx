"use client";

import { useEffect, useId, useRef } from "react";

// Watu: decorative river-pebble mascot standing on the Motto band's top border.
// Not interactive. All motion is class toggles + transform/opacity (see .watu* in
// globals.css); timers are plain setTimeout, paused when hidden/offscreen/hovered.
const rand = (a: number, b: number) => a + Math.random() * (b - a);

export default function Watu() {
  const uid = useId().replace(/:/g, "");
  const laneRef = useRef<HTMLDivElement>(null);
  const posRef = useRef<HTMLDivElement>(null);
  const faceRef = useRef<HTMLDivElement>(null);
  const jumpRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lane = laneRef.current!;
    const pos = posRef.current!;
    const face = faceRef.current!;
    const jump = jumpRef.current!;
    const section = lane.parentElement!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
    const mobile = matchMedia("(max-width: 767px)");

    let x = 0; // px offset from the SSR left:12% anchor
    let dir = 1;
    let timer = 0;
    let lastJump = -1e9;
    let lastReact = -1e9;
    let visible = false;
    let hovered = false;
    let running = false;

    const setTimer = (fn: () => void, ms: number) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(fn, ms);
    };
    const flip = (d: number) => {
      dir = d;
      face.style.transform = d < 0 ? "scaleX(-1)" : "";
    };
    // Freeze at the on-screen position (mid-walk) so pausing never snaps.
    const freeze = () => {
      const m = new DOMMatrixReadOnly(getComputedStyle(pos).transform);
      x = m.m41;
      pos.style.transition = "none";
      pos.style.setProperty("--x", `${x}px`);
      pos.classList.remove("is-walking");
    };
    const clearPoses = () => {
      pos.classList.remove("is-walking", "is-sitting", "is-looking");
    };
    const hop = (apex?: number) => {
      jump.style.setProperty("--apex", `${apex ?? (mobile.matches ? -14 : -22)}px`);
      jump.classList.remove("is-jumping");
      void jump.offsetWidth;
      jump.classList.add("is-jumping");
    };
    const canJump = () => performance.now() - lastJump >= (mobile.matches ? 20000 : 12000);
    const doJump = () => {
      if (!canJump()) return false;
      lastJump = performance.now();
      hop();
      return true;
    };

    const idle = () => {
      clearPoses();
      setTimer(pick, rand(2500, 6000));
    };
    function pick() {
      if (!running) return;
      const r = Math.random();
      if (r < 0.55) walk();
      else if (r < 0.75) look();
      else if (r < 0.9) sit();
      else {
        doJump();
        setTimer(idle, 900);
      }
    }
    function walk() {
      const w = lane.clientWidth;
      const mw = pos.offsetWidth;
      const min = 16;
      const max = w - 16 - mw;
      const anchor = w * 0.12;
      const cur = anchor + x;
      let d = Math.random() < 0.5 ? -1 : 1;
      if (cur <= min + 20) d = 1;
      else if (cur >= max - 20) d = -1;
      const [lo, hi] = mobile.matches ? [30, 120] : [40, 220];
      const room = d > 0 ? max - cur : cur - min;
      const dist = Math.min(rand(lo, hi), room);
      if (dist < 20) return idle();
      flip(d);
      const speed = mobile.matches ? 18 : 28;
      const dur = dist / speed;
      pos.classList.add("is-walking");
      pos.style.transition = `transform ${dur}s linear`;
      x += d * dist;
      pos.style.setProperty("--x", `${x}px`);
      setTimer(() => {
        pos.classList.remove("is-walking");
        if (Math.random() < 0.25) doJump();
        setTimer(idle, 700);
      }, dur * 1000);
    }
    function look() {
      pos.classList.add("is-looking");
      setTimer(() => flip(-dir), 900);
      window.setTimeout(() => pos.classList.remove("is-looking"), 1800);
      setTimer(idle, 1900);
    }
    function sit() {
      pos.classList.add("is-sitting");
      setTimer(idle, rand(4000, 7000));
    }

    const start = () => {
      if (running || reduce.matches || !visible || document.hidden || hovered) return;
      running = true;
      idle();
    };
    const stop = () => {
      if (!running) return;
      running = false;
      window.clearTimeout(timer);
      freeze();
      clearPoses();
    };
    const sync = () => {
      if (reduce.matches || !visible || document.hidden) {
        hovered = false;
        stop();
      } else if (!hovered) start();
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      sync();
    });
    io.observe(section);
    document.addEventListener("visibilitychange", sync);
    reduce.addEventListener("change", sync);

    const onEnter = () => {
      hovered = true;
      stop();
      pos.classList.add("is-looking");
    };
    const onLeave = () => {
      hovered = false;
      pos.classList.remove("is-looking");
      sync();
    };
    section.addEventListener("pointerenter", onEnter);
    section.addEventListener("pointerleave", onLeave);

    let raf = 0;
    const onMove = (ev: PointerEvent) => {
      if (raf || !finePointer.matches || mobile.matches || reduce.matches) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = pos.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        if (Math.abs(ev.clientX - cx) > 120 || performance.now() - lastReact < 8000) return;
        lastReact = performance.now();
        flip(ev.clientX < cx ? -1 : 1);
        hop(-10);
      });
    };
    section.addEventListener("pointermove", onMove);

    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reduce.removeEventListener("change", sync);
      section.removeEventListener("pointerenter", onEnter);
      section.removeEventListener("pointerleave", onLeave);
      section.removeEventListener("pointermove", onMove);
    };
  }, []);

  const body = `watu-body-${uid}`;
  return (
    <div ref={laneRef} className="watu-lane" aria-hidden="true" data-ambient>
      <div ref={posRef} className="watu">
        <div ref={faceRef} className="watu-face">
          <div ref={jumpRef} className="watu-jump" onAnimationEnd={(e) => e.currentTarget.classList.remove("is-jumping")}>
            <svg className="watu-svg" viewBox="0 0 48 40" width="44" height="37" aria-hidden="true" focusable="false">
              <defs>
                <linearGradient id={body} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#d9c4fa" />
                  <stop offset=".45" stopColor="#b38cf0" />
                  <stop offset="1" stopColor="#8f5ae0" />
                </linearGradient>
              </defs>
              <rect className="watu-leg watu-leg--back" x="13" y="29" width="6" height="11" rx="3" fill="#8f5ae0" stroke="#1f0036" strokeWidth="1.25" />
              <rect className="watu-leg watu-leg--front" x="29" y="29" width="6" height="11" rx="3" fill="#8f5ae0" stroke="#1f0036" strokeWidth="1.25" />
              <path
                className="watu-body"
                d="M5 30 C3 21 8 11 19 8 C29 5 42 8 44.5 19 C46 27 42 33 35 33.5 L12 33.5 C8 33.5 6 32 5 30 Z"
                fill={`url(#${body})`}
                stroke="#1f0036"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <ellipse cx="16" cy="13" rx="6" ry="2.2" transform="rotate(-20 16 13)" fill="#ffffff" opacity=".55" />
              <g transform="translate(14.5 24) rotate(45)" fill="#6a1cb0" opacity=".9">
                <ellipse cx="0" cy="-2.1" rx="1.2" ry="1.9" />
                <ellipse cx="0" cy="2.1" rx="1.2" ry="1.9" />
                <ellipse cx="-2.1" cy="0" rx="1.9" ry="1.2" />
                <ellipse cx="2.1" cy="0" rx="1.9" ry="1.2" />
              </g>
              <g className="watu-eyes" style={{ animationDelay: `-${(Math.abs(uid.length * 1.7) % 5).toFixed(1)}s` }}>
                <g className="watu-gaze">
                  <ellipse cx="31" cy="19" rx="1.7" ry="2.3" fill="#1f0036" />
                  <ellipse cx="38" cy="18.5" rx="1.7" ry="2.3" fill="#1f0036" />
                  <circle cx="31.6" cy="18.2" r=".6" fill="#f4f1f8" />
                  <circle cx="38.6" cy="17.7" r=".6" fill="#f4f1f8" />
                </g>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
