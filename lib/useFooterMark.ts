"use client";

import { useEffect, useRef } from "react";

// The lantern used to need a cursor to exist. It now walks the lockup on its
// own whenever the footer is on screen, and steps aside the moment a real
// pointer takes over.
const OPEN_R = "clamp(78px, 9.4vw, 180px)";
const LEAD_MS = 400;
const SWEEP_MS = 2600;
const REST_MS = 2200;
const SPAN = LEAD_MS + SWEEP_MS + REST_MS;
const IDLE_MS = 3000;
const OVERSHOOT = 0.12;
const MY_FROM = 0.28;
const MY_TO = 0.72;

export function useFooterMark() {
  const mark = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const node = mark.current;
    if (!node) return;

    const point = { x: 0, y: 0 };
    const size = { w: node.offsetWidth, h: node.offsetHeight };

    let raf = 0;
    let last = 0;
    let cycle = 0;
    let lastInput = 0;
    let auto = true;

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (!node) return;

      const step = last ? Math.min(now - last, 100) : 0;
      last = now;

      if (lastInput && now - lastInput < IDLE_MS) {
        if (auto) {
          auto = false;
          cycle = 0;
          node.style.removeProperty("--lens-r");
        }
        const box = node.getBoundingClientRect();
        node.style.setProperty("--mx", `${Math.round(point.x - box.left)}px`);
        node.style.setProperty("--my", `${Math.round(point.y - box.top)}px`);
        return;
      }

      auto = true;
      cycle = (cycle + step) % SPAN;

      const into = cycle - LEAD_MS;
      if (into < 0 || into > SWEEP_MS) {
        node.style.setProperty("--lens-r", "0px");
        return;
      }

      // A diagonal, so one pass crosses both lines of the lockup.
      const k = into / SWEEP_MS;
      const travel = (k * (1 + OVERSHOOT * 2) - OVERSHOOT) * size.w;
      node.style.setProperty("--lens-r", OPEN_R);
      node.style.setProperty("--mx", `${Math.round(travel)}px`);
      node.style.setProperty(
        "--my",
        `${Math.round((MY_FROM + (MY_TO - MY_FROM) * k) * size.h)}px`,
      );
    }

    function run() {
      if (raf) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    }

    function halt() {
      cancelAnimationFrame(raf);
      raf = 0;
    }

    function aim(event: PointerEvent) {
      if (event.pointerType !== "mouse") return;
      point.x = event.clientX;
      point.y = event.clientY;
      lastInput = performance.now();
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

    return () => {
      halt();
      watcher.disconnect();
      sizer.disconnect();
      node.removeEventListener("pointerenter", aim);
      node.removeEventListener("pointermove", aim);
      node.style.removeProperty("--lens-r");
    };
  }, []);

  return mark;
}
