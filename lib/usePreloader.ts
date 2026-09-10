"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";
import { release as openSound } from "@/lib/audio";
import { lockScroll, onTick } from "@/lib/scroll";

const SIGNALS = 3;
const MIN_MS = 900;
const CEIL_MS = 6000;
const HOLD_MS = 140;
const EXIT_MS = 420;
const CHASE = 0.11;
const PORTRAIT = "/images/ellefanning-hero-portrait.webp";

export type PreloaderPhase = "loading" | "ready" | "exit" | "done";

export function usePreloader() {
  const plate = useRef<HTMLDivElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const gate = useRef<HTMLButtonElement>(null);
  const leave = useRef(() => {});
  const [phase, setPhase] = useState<PreloaderPhase>("loading");

  const enter = useCallback(() => leave.current(), []);

  useEffect(() => {
    const node = plate.current;
    if (!node) return;

    lockScroll(true);
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    const start = performance.now();
    const timers: number[] = [];

    let live = true;
    let untick: (() => void) | null = null;
    let landed = 0;
    let shown = 0;
    let left = false;

    function release() {
      lockScroll(false);
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

    // The plate now waits on the reader instead of dismissing itself, so the
    // click doubles as the gesture that lets the score start.
    function arm() {
      timers.push(
        window.setTimeout(() => {
          if (live) setPhase("ready");
        }, HOLD_MS),
      );
    }

    leave.current = () => {
      if (!live || left) return;
      left = true;
      openSound();
      setPhase("exit");
      timers.push(
        window.setTimeout(() => {
          if (!live) return;
          window.scrollTo(0, 0);
          release();
          setPhase("done");
        }, EXIT_MS),
      );
    };

    function tick(now: number) {
      const goal = Math.min(landed / SIGNALS, (now - start) / MIN_MS, 1);
      shown += (goal - shown) * CHASE;
      if (goal - shown < 0.002) shown = goal;
      paint();
      if (shown >= 1) {
        untick?.();
        untick = null;
        arm();
      }
    }

    // The gate spans from the lockup's baseline down to the footer rule, so the
    // footer's real height has to reach CSS.
    function measure() {
      if (!node) return;
      const foot = node.querySelector<HTMLElement>(".pre-foot");
      if (foot) node.style.setProperty("--pre-foot", `${foot.offsetHeight}px`);
    }

    measure();
    const sizer = new ResizeObserver(measure);
    sizer.observe(node);

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

    untick = onTick(tick);

    return () => {
      live = false;
      sizer.disconnect();
      untick?.();
      timers.forEach((id) => clearTimeout(id));
      window.removeEventListener("load", land);
      release();
    };
  }, []);

  useEffect(() => {
    if (phase === "ready") gate.current?.focus();
  }, [phase]);

  return { plate, readout, gate, phase, enter };
}
