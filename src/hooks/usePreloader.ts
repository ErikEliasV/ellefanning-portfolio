"use client";

import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";
import { release as openSound } from "@/lib/audio";
import { lockScroll, onTick, scrollTo } from "@/lib/scroll";

const SIGNALS = 3;
const MIN_MS = 1500;
const CEIL_MS = 6000;
const HOLD_MS = 360;
const EXIT_MS = 420;
const CHASE = 0.11;

export const PLATE = "/images/ellefanning-preloader.webp";

export type PreloaderPhase = "loading" | "ready" | "exit" | "done";

export function usePreloader() {
  const plate = useRef<HTMLDivElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const [phase, setPhase] = useState<PreloaderPhase>("loading");

  useEffect(() => {
    const node = plate.current;
    if (!node) return;

    lockScroll(true);
    history.scrollRestoration = "manual";
    scrollTo(0, { immediate: true, force: true });

    openSound();

    const start = performance.now();
    const timers: number[] = [];

    let live = true;
    let untick: (() => void) | null = null;
    let landed = 0;
    let shown = 0;
    let armed = false;
    let left = false;

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
      if (!slot) return;

      const cells = slot.children;
      if (cells.length !== text.length) {
        slot.textContent = text;
        return;
      }

      for (let at = 0; at < text.length; at += 1) {
        const cell = cells[at];
        if (cell.textContent !== text[at]) cell.textContent = text[at];
      }
    }

    function leave() {
      if (!live || left) return;
      left = true;
      untick?.();
      untick = null;
      document.documentElement.dataset.entered = "";
      setPhase("exit");
      timers.push(
        window.setTimeout(() => {
          if (!live) return;
          scrollTo(0, { immediate: true, force: true });
          lockScroll(false);
          setPhase("done");
        }, EXIT_MS),
      );
    }

    function arm() {
      if (left || armed) return;
      armed = true;
      untick?.();
      untick = null;
      setPhase("ready");
      timers.push(window.setTimeout(leave, HOLD_MS));
    }

    function tick(now: number) {
      const goal = Math.min(landed / SIGNALS, (now - start) / MIN_MS, 1);
      shown += (goal - shown) * CHASE;
      if (goal - shown < 0.002) shown = goal;
      paint();
      if (shown >= 1) arm();
    }

    document.fonts.ready.then(typeset, typeset);

    const backdrop = document.createElement("img");
    backdrop.src = asset(PLATE);
    backdrop.decode().then(land, land);

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

    timers.push(window.setTimeout(leave, CEIL_MS + MIN_MS + HOLD_MS));

    untick = onTick(tick);

    return () => {
      live = false;
      untick?.();
      timers.forEach((id) => clearTimeout(id));
      window.removeEventListener("load", land);
      lockScroll(false);
    };
  }, []);

  return { plate, readout, phase };
}
