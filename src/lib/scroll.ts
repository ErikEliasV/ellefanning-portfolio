"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

type Tick = (now: number) => void;

const REDUCED = "(prefers-reduced-motion: reduce)";
const LERP = 0.06;
const GLIDE_EASE = "power3.out";
const GLIDE_STOP = ["touchstart", "pointerdown", "wheel", "keydown"] as const;

let lenis: Lenis | null = null;
let booted = false;
let reduced = false;
let locked = false;
let gliding: gsap.core.Tween | null = null;

const ticks = new Set<Tick>();

function drive() {
  const now = performance.now();
  lenis?.raf(now);
  ticks.forEach((fn) => fn(now));
}

export function isReduced() {
  return reduced;
}

export function isLocked() {
  return locked;
}

export function onTick(fn: Tick) {
  ticks.add(fn);
  return () => {
    ticks.delete(fn);
  };
}

export function scrollTo(
  target: string | number,
  opts?: Parameters<Lenis["scrollTo"]>[1],
) {
  if (lenis) {
    lenis.scrollTo(target, opts);
    return;
  }
  if (typeof target === "number") {
    window.scrollTo(0, target);
    return;
  }
  document.querySelector(target)?.scrollIntoView();
}

export function stopGlide() {
  gliding?.kill();
  gliding = null;
}

export function glideTo(y: number, seconds: number) {
  stopGlide();
  if (reduced || seconds <= 0) {
    scrollTo(y, { immediate: true });
    return;
  }
  const at = { y: window.scrollY };
  gliding = gsap.to(at, {
    y,
    duration: seconds,
    ease: GLIDE_EASE,
    onUpdate: () => scrollTo(at.y, { immediate: true }),
    onComplete: () => {
      gliding = null;
    },
  });
}

export function lockScroll(on: boolean) {
  locked = on;
  document.documentElement.style.overflow = on ? "hidden" : "";
  if (!lenis) return;
  if (on) lenis.stop();
  else lenis.start();
}

export function bootScroll() {
  if (booted) return () => {};
  booted = true;

  gsap.registerPlugin(ScrollTrigger);
  gsap.ticker.lagSmoothing(0);

  const query = window.matchMedia(REDUCED);
  reduced = query.matches;

  const build = () => {
    if (reduced || lenis) return;
    lenis = new Lenis({ lerp: LERP, syncTouch: false });
    lenis.on("scroll", () => ScrollTrigger.update());
  };

  const tear = () => {
    lenis?.destroy();
    lenis = null;
  };

  const onChange = () => {
    reduced = query.matches;
    if (reduced) tear();
    else build();
    ScrollTrigger.refresh();
  };

  build();
  gsap.ticker.add(drive);
  query.addEventListener("change", onChange);
  GLIDE_STOP.forEach((name) =>
    window.addEventListener(name, stopGlide, { passive: true }),
  );

  return () => {
    query.removeEventListener("change", onChange);
    GLIDE_STOP.forEach((name) => window.removeEventListener(name, stopGlide));
    stopGlide();
    gsap.ticker.remove(drive);
    tear();
    booted = false;
  };
}
