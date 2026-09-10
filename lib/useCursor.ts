"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";

import { onTick } from "@/lib/scroll";

const CHASE = 0.42;
const CHASE_EASE = "power3";
const SQUASH = 0.34;
const SQUASH_EASE = "power2";
const SETTLED = 0.4;
const IDLE = 80;
const HOT = 148;
const OUTSET = 10;
const PRESS = 6;
const AREA = 0.34;
const TALL = 0.82;
// Pixels of pointer travel per frame that already read as full stretch.
const VELOCITY_FULL = 46;
const VELOCITY_EASE = 0.2;
const VELOCITY_DECAY = 0.86;
const VELOCITY_REST = 0.4;
const STRETCH_MAX = 0.55;
const SQUEEZE_K = 0.64;
const PICK =
  'a[href], button, summary, label, [role="button"], [role="link"], [data-cursor]';

type Box = { x: number; y: number; w: number; h: number };

export function useCursor() {
  const shell = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLSpanElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const [fine, setFine] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(pointer: fine)");
    const read = () => setFine(query.matches);

    read();
    query.addEventListener("change", read);

    return () => query.removeEventListener("change", read);
  }, []);

  useEffect(() => {
    const node = shell.current;
    if (!fine || !node) return;

    const root = document.documentElement;
    const point = { x: 0, y: 0 };
    const box: Box = { x: 0, y: 0, w: IDLE, h: IDLE };
    const goal: Box = { x: 0, y: 0, w: IDLE, h: IDLE };
    const vel = { x: 0, y: 0 };
    const blob = node.querySelector<HTMLElement>(".cur-blob");

    let untick: (() => void) | null = null;
    let pendingRetag = false;
    let hot: HTMLElement | null = null;
    let snap = false;
    let down = false;
    let live = false;

    // The chase used to be a per-frame lerp, which ran twice as fast on a 120Hz
    // screen as on a 60Hz one. A tween is measured in seconds, so it does not.
    const chase = { duration: CHASE, ease: CHASE_EASE };
    const toX = gsap.quickTo(box, "x", chase);
    const toY = gsap.quickTo(box, "y", chase);
    const toW = gsap.quickTo(box, "w", chase);
    const toH = gsap.quickTo(box, "h", chase);

    const squash = { duration: SQUASH, ease: SQUASH_EASE };
    const toStretch = blob ? gsap.quickTo(blob, "scaleX", squash) : null;
    const toSqueeze = blob ? gsap.quickTo(blob, "scaleY", squash) : null;
    const toTilt = blob ? gsap.quickTo(blob, "rotation", squash) : null;

    if (blob) gsap.set(blob, { xPercent: -50, yPercent: -50 });

    function aim() {
      const tight = down ? PRESS : 0;

      if (snap && hot) {
        const rect = hot.getBoundingClientRect();
        goal.x = rect.left + rect.width / 2;
        goal.y = rect.top + rect.height / 2;
        goal.w = rect.width + OUTSET * 2 - tight;
        goal.h = rect.height + OUTSET * 2 - tight;
        return;
      }

      goal.x = point.x;
      goal.y = point.y;
      goal.w = (hot ? HOT : IDLE) - tight;
      goal.h = goal.w;
    }

    function paint() {
      if (!node) return;

      const x = Math.round(box.x);
      const y = Math.round(box.y);
      const half = Math.round(box.w / 2);
      const rise = Math.round(box.h / 2);

      node.style.transform = `translate3d(${x}px, ${y}px, 0)`;

      if (blob) {
        blob.style.width = `${Math.round(box.w)}px`;
        blob.style.height = `${Math.round(box.h)}px`;
      }

      const mark = dot.current;
      if (mark) {
        mark.style.transform = `translate3d(${Math.round(point.x) - x}px, ${Math.round(point.y) - y}px, 0)`;
      }

      const tag = label.current;
      if (tag) {
        tag.style.transform = `translate3d(${-half}px, ${rise + 8}px, 0)`;
      }
    }

    function shape() {
      if (!blob) return;

      const speed = Math.hypot(vel.x, vel.y);
      const stretch = snap
        ? 0
        : Math.min(speed / VELOCITY_FULL, 1) * STRETCH_MAX;

      toStretch?.(1 + stretch);
      toSqueeze?.(1 - stretch * SQUEEZE_K);
      if (!snap && speed > VELOCITY_REST) {
        toTilt?.((Math.atan2(vel.y, vel.x) * 180) / Math.PI);
      }
    }

    function tick() {
      aim();

      toX(goal.x);
      toY(goal.y);
      toW(goal.w);
      toH(goal.h);

      vel.x *= VELOCITY_DECAY;
      vel.y *= VELOCITY_DECAY;

      shape();
      paint();

      if (pendingRetag) {
        pendingRetag = false;
        retag(hot);
      }

      const rest =
        !snap &&
        Math.abs(goal.x - box.x) < SETTLED &&
        Math.abs(goal.y - box.y) < SETTLED &&
        Math.abs(goal.w - box.w) < SETTLED &&
        Math.abs(goal.h - box.h) < SETTLED &&
        Math.hypot(vel.x, vel.y) < VELOCITY_REST;

      if (rest) {
        untick?.();
        untick = null;
      }
    }

    function wake() {
      if (!untick) untick = onTick(tick);
    }

    function fits(hit: HTMLElement) {
      const rect = hit.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (!rect.width || !rect.height) return false;
      if (rect.height > vh * TALL) return false;
      return rect.width * rect.height <= vw * vh * AREA;
    }

    function move(event: PointerEvent) {
      if (!node) return;

      const dx = event.clientX - point.x;
      const dy = event.clientY - point.y;

      point.x = event.clientX;
      point.y = event.clientY;

      if (!live) {
        live = true;
        box.x = point.x;
        box.y = point.y;
        toX(point.x, point.x);
        toY(point.y, point.y);
        node.dataset.live = "";
        root.dataset.cursorOn = "";
      } else {
        vel.x += (dx - vel.x) * VELOCITY_EASE;
        vel.y += (dy - vel.y) * VELOCITY_EASE;
      }

      wake();
    }

    function over(event: PointerEvent) {
      if (!node) return;
      const from = event.target instanceof Element ? event.target : null;

      const field = from?.closest("[data-cursor-skin]");
      const tone = field instanceof HTMLElement ? field.dataset.cursorSkin : "";
      if (tone) node.dataset.skin = tone;
      else delete node.dataset.skin;

      const next = from?.closest(PICK);
      const hit = next instanceof HTMLElement ? next : null;
      retag(hit);
      if (hit === hot) return;

      hot = hit;
      snap = hit ? hit.dataset.cursorSnap !== "off" && fits(hit) : false;

      if (hit) node.dataset.hot = "";
      else delete node.dataset.hot;

      if (snap) {
        node.dataset.snap = "";
        toTilt?.(0);
        toStretch?.(1);
        toSqueeze?.(1);
      } else {
        delete node.dataset.snap;
      }

      wake();
    }

    function retag(hit: HTMLElement | null) {
      if (!node) return;

      const tag = hit?.dataset.cursor ?? "";
      const slot = label.current;
      if (slot && slot.textContent !== tag) slot.textContent = tag;

      if (tag) node.dataset.tag = "";
      else delete node.dataset.tag;
    }

    function press() {
      if (!node) return;
      down = true;
      node.dataset.down = "";
      wake();
    }

    function release() {
      if (!node) return;
      down = false;
      delete node.dataset.down;
      pendingRetag = true;
      wake();
    }

    function drift() {
      if (snap) wake();
    }

    function hide() {
      if (!node) return;
      live = false;
      down = false;
      delete node.dataset.live;
      delete node.dataset.down;
    }

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    window.addEventListener("pointerdown", press, { passive: true });
    window.addEventListener("pointerup", release, { passive: true });
    window.addEventListener("scroll", drift, { passive: true });
    window.addEventListener("blur", hide);
    document.addEventListener("pointerleave", hide);

    return () => {
      untick?.();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("scroll", drift);
      window.removeEventListener("blur", hide);
      document.removeEventListener("pointerleave", hide);
      delete root.dataset.cursorOn;
    };
  }, [fine]);

  return { shell, dot, label, fine };
}
