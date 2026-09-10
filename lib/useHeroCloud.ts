"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { asset } from "@/lib/asset";
import { pixel } from "@/lib/audio";
import { onTick } from "@/lib/scroll";
import { HERO_FIELD } from "@/lib/useHeroField";
import type { Cloud } from "@/lib/heroCloud";

const DRIFT_WAIT_COARSE = 1200;
const DRIFT_WAIT_FINE = 6000;
const DRIFT_FADE = 1400;
const DRIFT_AMP_COARSE = 1;
const DRIFT_AMP_FINE = 0.45;
const DRIFT_SPEED = 0.055;
const DRIFT_SKEW = 0.79;
const DRIFT_PHASE = 1.7;
const DRIFT_SPAN_X = 0.34;
const DRIFT_SPAN_Y = 0.26;
const TAU = Math.PI * 2;

export function useHeroCloud() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const value = useRef(0);
  const [ready, setReady] = useState(false);

  const progress = useCallback((p: number) => {
    value.current = p;
  }, []);

  useEffect(() => {
    const node = canvas.current;
    if (!node) return;

    let cloud: Cloud | null = null;
    let untick: (() => void) | null = null;
    let live = true;
    let seen = false;
    let painted = false;
    let last = 0;
    let drift = 0;
    let lastInput = 0;
    let coarse = window.matchMedia("(pointer: coarse)").matches;

    const frame = (now: number) => {
      if (!cloud) return;

      const step = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;

      if (!lastInput) lastInput = now;
      const wait = coarse ? DRIFT_WAIT_COARSE : DRIFT_WAIT_FINE;
      const ceiling = coarse ? DRIFT_AMP_COARSE : DRIFT_AMP_FINE;
      const held = Math.min(Math.max((now - lastInput - wait) / DRIFT_FADE, 0), 1);

      if (held > 0) {
        drift += step;
        const turn = drift * DRIFT_SPEED * TAU;
        cloud.setPointer(
          0.5 + DRIFT_SPAN_X * Math.sin(turn),
          0.5 + DRIFT_SPAN_Y * Math.sin(turn * DRIFT_SKEW + DRIFT_PHASE),
          held * ceiling > 0,
        );
      }

      cloud.setProgress(value.current);
      cloud.frame(step);

      // The crossfade only starts once there is a real frame underneath it, so
      // the flat renderer is never traded for an empty canvas.
      if (!painted) {
        painted = true;
        setReady(true);
      }
    };

    const run = () => {
      if (untick || !cloud) return;
      last = 0;
      lastInput = 0;
      untick = onTick(frame);
    };

    const halt = () => {
      untick?.();
      untick = null;
    };

    const onMove = (event: PointerEvent) => {
      if (!cloud) return;
      const box = node.getBoundingClientRect();
      if (!box.width || !box.height) return;

      coarse = event.pointerType !== "mouse";
      lastInput = performance.now();

      const x = (event.clientX - box.left) / box.width;
      const y = (event.clientY - box.top) / box.height;
      const inside = x >= 0 && x <= 1 && y >= 0 && y <= 1;

      cloud.setPointer(x, 1 - y, inside);
    };

    const onLeave = () => cloud?.setPointer(0.5, 0.5, false);

    const image = new Image();
    image.decoding = "async";

    image.onload = () => {
      if (!live) return;

      void import("@/lib/heroCloud")
        .then(({ createCloud }) => {
          if (!live) return;
          cloud = createCloud({ canvas: node, image, onBlock: pixel });
          if (!cloud) return;
          if (seen) run();
        })
        .catch(() => {});
    };

    image.src = asset(HERO_FIELD);

    const sizer = new ResizeObserver(() => cloud?.resize());
    sizer.observe(node);

    const watcher = new IntersectionObserver((entries) => {
      seen = entries.some((entry) => entry.isIntersecting);
      if (seen) run();
      else halt();
    });
    watcher.observe(node);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      live = false;
      halt();
      sizer.disconnect();
      watcher.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      document.removeEventListener("pointerleave", onLeave);
      image.onload = null;
      cloud?.dispose();
      cloud = null;
    };
  }, []);

  return { canvas, progress, ready };
}
