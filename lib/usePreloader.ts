"use client";

import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";

const SIGNALS = 3;
const MIN_MS = 900;
const CEIL_MS = 6000;
const HOLD_MS = 140;
const EXIT_MS = 420;
const CHASE = 0.11;
const PORTRAIT = "/images/ellefanning-hero-portrait.webp";

export type PreloaderPhase = "loading" | "exit" | "done";

export function usePreloader() {
  const plate = useRef<HTMLDivElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const [phase, setPhase] = useState<PreloaderPhase>("loading");

  useEffect(() => {
    const node = plate.current;
    if (!node) return;

    const root = document.documentElement;
    const overflow = root.style.overflow;

    root.style.overflow = "hidden";
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    const start = performance.now();
    const timers: number[] = [];

    let live = true;
    let frame = 0;
    let landed = 0;
    let shown = 0;

    function release() {
      root.style.overflow = overflow;
    }

    function land() {
      if (live) landed = Math.min(landed + 1, SIGNALS);
    }

    function typeset() {
      if (live && node) node.dataset.typeset = "";
      land();
    }

    function paint() {
      if (!node) return;
      node.style.setProperty("--pre-p", shown.toFixed(4));
      const text = String(Math.round(shown * 100)).padStart(3, "0");
      const slot = readout.current;
      if (slot && slot.textContent !== text) slot.textContent = text;
    }

    function leave() {
      timers.push(
        window.setTimeout(() => {
          if (!live) return;
          setPhase("exit");
          timers.push(
            window.setTimeout(() => {
              if (!live) return;
              window.scrollTo(0, 0);
              release();
              setPhase("done");
            }, EXIT_MS),
          );
        }, HOLD_MS),
      );
    }

    function tick(now: number) {
      const goal = Math.min(landed / SIGNALS, (now - start) / MIN_MS, 1);
      shown += (goal - shown) * CHASE;
      if (goal - shown < 0.002) shown = goal;
      paint();
      if (shown >= 1) {
        leave();
        return;
      }
      frame = requestAnimationFrame(tick);
    }

    document.fonts.ready.then(typeset, typeset);

    const portrait = document.createElement("img");
    portrait.src = asset(PORTRAIT);
    portrait.decode().then(land, land);

    if (document.readyState === "complete") {
      land();
    } else {
      window.addEventListener("load", land, { once: true });
    }

    timers.push(
      window.setTimeout(() => {
        landed = SIGNALS;
      }, CEIL_MS),
    );

    frame = requestAnimationFrame(tick);

    return () => {
      live = false;
      cancelAnimationFrame(frame);
      timers.forEach((id) => clearTimeout(id));
      window.removeEventListener("load", land);
      release();
    };
  }, []);

  return { plate, readout, phase };
}
