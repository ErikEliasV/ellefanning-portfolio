"use client";

import { useEffect, useRef } from "react";

const IMG_RATIO = 1900 / 1140;
const SIL_RATIO = 1490 / 1054;
const SIL_LEFT = 224 / 1900;
const SIL_TOP = 86 / 1140;
const SIL_WIDTH = 1490 / 1900;

const FRAME_W = 1920;
const TITLE_FIT_H = 1120;

const A_SIL_W_VW = 1.0342;
const A_SIL_W_VH = 1.6;
const A_SIL_W_MAX_VW = 1.9;
const A_SIL_SHOW = 0.38;
const A_SIL_CX_VW = 0.5115;
const A_RISE_VH = 0.22;

const B_SIL_W_VW = 1.04;
const B_HEADROOM = 0.12;

const LIME_LEFT = 941 / FRAME_W;
const MORPH_VH = 0.7;

const INK_LEFT = -54;
const INK_TOP = 26.03;
const INK_SIZE = 591.876;

const PAPER_A_LEFT = 717;
const PAPER_A_TOP = -336.96;
const PAPER_A_SIZE = 378.425;

const PAPER_B_LEFT = -90;
const PAPER_B_TOP = 5;
const PAPER_B_SIZE = 841.305;

function imageBox(silWidth: number, silCenterX: number, silTop: number) {
  const width = silWidth / SIL_WIDTH;
  const height = width / IMG_RATIO;
  return {
    width,
    height,
    x: silCenterX - silWidth / 2 - SIL_LEFT * width,
    y: silTop - SIL_TOP * height,
  };
}

function smallViewportHeight() {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:absolute;top:0;left:0;width:0;height:100svh;visibility:hidden;pointer-events:none";
  document.body.appendChild(probe);
  const height = probe.getBoundingClientRect().height;
  probe.remove();
  return height || window.innerHeight;
}

export function useHeroMorph() {
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trackNode = track.current;
    if (!trackNode) return;

    let ticket = 0;
    let morph = 1;

    function progress() {
      ticket = 0;
      if (!trackNode) return;
      const value = Math.min(Math.max(-trackNode.getBoundingClientRect().top / morph, 0), 1);
      trackNode.style.setProperty("--p", value.toFixed(4));
      trackNode.style.setProperty("--inv", (1 - value).toFixed(4));
    }

    function schedule() {
      if (!ticket) ticket = requestAnimationFrame(progress);
    }

    function measure() {
      if (!trackNode) return;
      const vw = document.documentElement.clientWidth;
      const vh = smallViewportHeight();
      if (!vw || !vh) return;

      const ua = Math.min(vw / FRAME_W, vh / TITLE_FIT_H);
      const ub = vw / FRAME_W;

      const silWa = Math.min(
        Math.max(A_SIL_W_VW * vw, A_SIL_W_VH * vh),
        A_SIL_W_MAX_VW * vw,
      );
      const silHa = silWa / SIL_RATIO;

      const silWb = Math.max(B_SIL_W_VW * vw, silWa);
      const silHb = silWb / SIL_RATIO;
      const frameHb = Math.max(vh, silHb / (1 - B_HEADROOM));
      const silTb = frameHb - silHb;
      const boxB = imageBox(silWb, vw / 2, silTb);

      const silTa = Math.max(vh - A_SIL_SHOW * silHa, silTb + A_RISE_VH * vh);
      const boxA = imageBox(silWa, A_SIL_CX_VW * vw, silTa);

      morph = MORPH_VH * vh;

      const set = (name: string, value: number, unit = "px") =>
        trackNode.style.setProperty(name, `${Math.round(value * 100) / 100}${unit}`);

      set("--morph", morph);
      set("--frame-h-a", vh);
      set("--frame-h-b", frameHb);
      set("--lime-left", LIME_LEFT * vw);

      set("--img-w", boxB.width);
      set("--img-h", boxB.height);
      set("--img-dx", boxA.x - boxB.x);
      set("--img-dy", boxA.y - boxB.y);
      set("--img-x", boxB.x);
      set("--img-y", boxB.y);
      set("--img-k", silWa / silWb, "");

      set("--ink-left", INK_LEFT * ua);
      set("--ink-top", INK_TOP * ua);
      set("--ink-size", INK_SIZE * ua);

      set("--paper-left", PAPER_B_LEFT * ub);
      set("--paper-top", PAPER_B_TOP * ub);
      set("--paper-size", PAPER_B_SIZE * ub);
      set("--paper-dx", PAPER_A_LEFT * ua - PAPER_B_LEFT * ub);
      set("--paper-dy", PAPER_A_TOP * ua - PAPER_B_TOP * ub);
      set("--paper-k", (PAPER_A_SIZE * ua) / (PAPER_B_SIZE * ub), "");

      trackNode.dataset.ready = "";
      progress();
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(document.documentElement);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", schedule, { passive: true });

    return () => {
      cancelAnimationFrame(ticket);
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", schedule);
    };
  }, []);

  return track;
}
