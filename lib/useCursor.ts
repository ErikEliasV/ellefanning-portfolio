"use client";

import { useEffect, useRef, useState } from "react";

const CHASE = 0.2;
const SETTLED = 0.4;
const IDLE = 80;
const HOT = 148;
const OUTSET = 10;
const PRESS = 6;
const ARM = 24;
const AREA = 0.34;
const TALL = 0.82;
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
    const corners = Array.from(
      node.querySelectorAll<HTMLElement>(".cur-corner"),
    );

    let frame = 0;
    let hot: HTMLElement | null = null;
    let snap = false;
    let down = false;
    let live = false;

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
      const near = half - ARM;
      const deep = rise - ARM;

      node.style.transform = `translate3d(${x}px, ${y}px, 0)`;

      if (corners[0]) {
        corners[0].style.transform = `translate3d(${-half}px, ${-rise}px, 0)`;
      }
      if (corners[1]) {
        corners[1].style.transform = `translate3d(${near}px, ${-rise}px, 0)`;
      }
      if (corners[2]) {
        corners[2].style.transform = `translate3d(${near}px, ${deep}px, 0)`;
      }
      if (corners[3]) {
        corners[3].style.transform = `translate3d(${-half}px, ${deep}px, 0)`;
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

    function tick() {
      aim();

      box.x += (goal.x - box.x) * CHASE;
      box.y += (goal.y - box.y) * CHASE;
      box.w += (goal.w - box.w) * CHASE;
      box.h += (goal.h - box.h) * CHASE;

      const rest =
        !snap &&
        Math.abs(goal.x - box.x) < SETTLED &&
        Math.abs(goal.y - box.y) < SETTLED &&
        Math.abs(goal.w - box.w) < SETTLED &&
        Math.abs(goal.h - box.h) < SETTLED;

      if (rest) {
        box.x = goal.x;
        box.y = goal.y;
        box.w = goal.w;
        box.h = goal.h;
      }

      paint();
      frame = rest ? 0 : requestAnimationFrame(tick);
    }

    function wake() {
      if (!frame) frame = requestAnimationFrame(tick);
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
      point.x = event.clientX;
      point.y = event.clientY;

      if (!live) {
        live = true;
        box.x = point.x;
        box.y = point.y;
        node.dataset.live = "";
        root.dataset.cursorOn = "";
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

      if (snap) node.dataset.snap = "";
      else delete node.dataset.snap;

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
      requestAnimationFrame(() => retag(hot));
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
      cancelAnimationFrame(frame);
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
