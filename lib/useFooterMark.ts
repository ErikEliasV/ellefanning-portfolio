"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";

import { onTick } from "@/lib/scroll";

// The lantern used to need a cursor to exist. It now walks the lockup on its
// own whenever the footer is on screen, and steps aside the moment a real
// pointer takes over.
const OPEN_MIN = 140;
const OPEN_VW = 0.16;
const OPEN_MAX = 320;
const LEAD_MS = 400;
const SWEEP_MS = 2600;
const REST_MS = 2200;
const SPAN = LEAD_MS + SWEEP_MS + REST_MS;
const IDLE_MS = 3000;
const OVERSHOOT = 0.12;
const MY_FROM = 0.28;
const MY_TO = 0.72;
const FOLLOW = 0.5;
const OPEN_S = 0.45;
const SHUT_S = 0.7;

export function useFooterMark() {
  const mark = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const node = mark.current;
    if (!node) return;

    const point = { x: 0, y: 0 };
    const size = { w: node.offsetWidth, h: node.offsetHeight };

    // Tweening a plain object and writing the variables here keeps this free of
    // any guess about how GSAP infers the unit of a custom property.
    const at = { x: 0, y: 0 };
    const lens = { r: 0, glow: 0 };

    const follow = { duration: FOLLOW, ease: "power3" };
    const toX = gsap.quickTo(at, "x", follow);
    const toY = gsap.quickTo(at, "y", follow);

    let untick: (() => void) | null = null;
    let last = 0;
    let cycle = 0;
    let lastInput = 0;
    let auto = true;
    let opened = false;

    function radius() {
      return Math.min(
        Math.max(OPEN_MIN, window.innerWidth * OPEN_VW),
        OPEN_MAX,
      );
    }

    function open(on: boolean) {
      if (opened === on) return;
      opened = on;
      gsap.to(lens, {
        r: on ? radius() : 0,
        glow: on ? 1 : 0,
        duration: on ? OPEN_S : SHUT_S,
        ease: on ? "power2.out" : "power2.inOut",
        overwrite: true,
      });
    }

    function frame(now: number) {
      if (!node) return;

      const step = last ? Math.min(now - last, 100) : 0;
      last = now;

      if (lastInput && now - lastInput < IDLE_MS) {
        const box = node.getBoundingClientRect();
        const x = point.x - box.left;
        const y = point.y - box.top;

        if (auto) {
          auto = false;
          cycle = 0;
          toX(x, x);
          toY(y, y);
        } else {
          toX(x);
          toY(y);
        }

        open(true);
      } else {
        auto = true;
        cycle = (cycle + step) % SPAN;

        const into = cycle - LEAD_MS;

        if (into < 0) {
          // Park at the start of the run while it is still dark, so the sweep
          // does not have to travel there with the lantern already lit.
          const x = -OVERSHOOT * size.w;
          const y = MY_FROM * size.h;
          toX(x, x);
          toY(y, y);
          open(false);
        } else if (into > SWEEP_MS) {
          open(false);
        } else {
          // A diagonal, so one pass crosses both lines of the lockup.
          const k = into / SWEEP_MS;
          toX((k * (1 + OVERSHOOT * 2) - OVERSHOOT) * size.w);
          toY((MY_FROM + (MY_TO - MY_FROM) * k) * size.h);
          open(true);
        }
      }

      node.style.setProperty("--mx", `${Math.round(at.x)}px`);
      node.style.setProperty("--my", `${Math.round(at.y)}px`);
      node.style.setProperty("--lens-r", `${lens.r.toFixed(1)}px`);
      node.style.setProperty("--lens-glow", lens.glow.toFixed(3));
    }

    function run() {
      if (untick) return;
      last = 0;
      untick = onTick(frame);
    }

    function halt() {
      untick?.();
      untick = null;
    }

    function aim(event: PointerEvent) {
      if (event.pointerType !== "mouse") return;
      point.x = event.clientX;
      point.y = event.clientY;
      lastInput = performance.now();
    }

    function drop() {
      lastInput = 0;
    }

    const watcher = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) run();
      else halt();
    });
    watcher.observe(node);

    const sizer = new ResizeObserver(() => {
      size.w = node.offsetWidth;
      size.h = node.offsetHeight;
    });
    sizer.observe(node);

    node.addEventListener("pointerenter", aim, { passive: true });
    node.addEventListener("pointermove", aim, { passive: true });
    node.addEventListener("pointerleave", drop, { passive: true });

    return () => {
      halt();
      gsap.killTweensOf(lens);
      watcher.disconnect();
      sizer.disconnect();
      node.removeEventListener("pointerenter", aim);
      node.removeEventListener("pointermove", aim);
      node.removeEventListener("pointerleave", drop);
      node.style.removeProperty("--lens-r");
      node.style.removeProperty("--lens-glow");
    };
  }, []);

  return mark;
}
