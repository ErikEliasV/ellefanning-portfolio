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

const ROSE_LEFT = 941 / FRAME_W;
const MORPH_VH = 0.7;

const INK_WIDTH = 1911.794;
const INK_CAP_TOP = 17.744;
const INK_GLYPH_LEFT = -35.5;
const INK_LINE = 517.892;

const PAPER_A_WIDTH = 1222.335;
const PAPER_A_CAP_TOP = -342.258;
const PAPER_A_GLYPH_LEFT = 728.83;
const PAPER_A_LINE = 331.122;

const PAPER_B_WIDTH = 2717.464;
const PAPER_B_CAP_TOP = -6.778;
const PAPER_B_GLYPH_LEFT = -63.71;
const PAPER_B_LINE = 736.142;

const SAMPLE = "FANNING.";
const SAMPLE_SIZE = 1000;

type Face = {
  w: number;
  cap: number;
  asc: number;
  desc: number;
  bbLeft: number;
};

function measureFace(family: string): Face | null {
  const context = document.createElement("canvas").getContext("2d");
  if (!context || !family) return null;

  context.letterSpacing = "-0.01em";
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  context.font = `400 ${SAMPLE_SIZE}px ${family}`;

  const metrics = context.measureText(SAMPLE);
  if (!metrics.width) return null;

  return {
    w: metrics.width / SAMPLE_SIZE,
    cap: metrics.actualBoundingBoxAscent / SAMPLE_SIZE,
    asc: metrics.fontBoundingBoxAscent / SAMPLE_SIZE,
    desc: metrics.fontBoundingBoxDescent / SAMPLE_SIZE,
    bbLeft: metrics.actualBoundingBoxLeft / SAMPLE_SIZE,
  };
}

function fit(face: Face, width: number, capTop: number, glyphLeft: number, line: number) {
  const size = width / face.w;
  const offset = (line - (face.asc + face.desc) * size) / 2 + face.asc * size;
  return {
    size,
    top: capTop - offset + face.cap * size,
    left: glyphLeft + face.bbLeft * size,
  };
}

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

export function useHeroMorph(onProgress?: (value: number) => void) {
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trackNode = track.current;
    if (!trackNode) return;

    let ticket = 0;
    let morph = 1;
    let live = true;
    let faces: { g: Face; e: Face } | null = null;

    function progress() {
      ticket = 0;
      if (!trackNode) return;
      const value = Math.min(Math.max(-trackNode.getBoundingClientRect().top / morph, 0), 1);
      trackNode.style.setProperty("--p", value.toFixed(4));
      trackNode.style.setProperty("--inv", (1 - value).toFixed(4));
      onProgress?.(value);
    }

    function schedule() {
      if (!ticket) ticket = requestAnimationFrame(progress);
    }

    function measure() {
      if (!trackNode || !faces) return;
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

      const inkG = fit(faces.g, INK_WIDTH * ua, INK_CAP_TOP * ua, INK_GLYPH_LEFT * ua, INK_LINE * ua);
      const inkE = fit(faces.e, INK_WIDTH * ua, INK_CAP_TOP * ua, INK_GLYPH_LEFT * ua, INK_LINE * ua);

      const paperAg = fit(
        faces.g, PAPER_A_WIDTH * ua, PAPER_A_CAP_TOP * ua, PAPER_A_GLYPH_LEFT * ua, PAPER_A_LINE * ua,
      );
      const paperBg = fit(
        faces.g, PAPER_B_WIDTH * ub, PAPER_B_CAP_TOP * ub, PAPER_B_GLYPH_LEFT * ub, PAPER_B_LINE * ub,
      );
      const paperAe = fit(
        faces.e, PAPER_A_WIDTH * ua, PAPER_A_CAP_TOP * ua, PAPER_A_GLYPH_LEFT * ua, PAPER_A_LINE * ua,
      );
      const paperBe = fit(
        faces.e, PAPER_B_WIDTH * ub, PAPER_B_CAP_TOP * ub, PAPER_B_GLYPH_LEFT * ub, PAPER_B_LINE * ub,
      );

      const set = (name: string, value: number, unit = "px") =>
        trackNode.style.setProperty(name, `${Math.round(value * 100) / 100}${unit}`);

      set("--morph", morph);
      set("--frame-h-a", vh);
      set("--frame-h-b", frameHb);
      set("--rose-left", ROSE_LEFT * vw);

      set("--img-w", boxB.width);
      set("--img-h", boxB.height);
      set("--img-dx", boxA.x - boxB.x);
      set("--img-dy", boxA.y - boxB.y);
      set("--img-x", boxB.x);
      set("--img-y", boxB.y);
      set("--img-k", silWa / silWb, "");

      set("--ink-line", INK_LINE * ua);
      set("--ink-g-size", inkG.size);
      set("--ink-g-top", inkG.top);
      set("--ink-g-left", inkG.left);
      set("--ink-e-size", inkE.size);
      set("--ink-e-top", inkE.top);
      set("--ink-e-left", inkE.left);

      set("--paper-line", PAPER_B_LINE * ub);
      set("--paper-k", paperAg.size / paperBg.size, "");

      set("--paper-g-size", paperBg.size);
      set("--paper-g-top", paperBg.top);
      set("--paper-g-left", paperBg.left);
      set("--paper-g-dx", paperAg.left - paperBg.left);
      set("--paper-g-dy", paperAg.top - paperBg.top);

      set("--paper-e-size", paperBe.size);
      set("--paper-e-top", paperBe.top);
      set("--paper-e-left", paperBe.left);
      set("--paper-e-dx", paperAe.left - paperBe.left);
      set("--paper-e-dy", paperAe.top - paperBe.top);

      trackNode.dataset.ready = "";
      progress();
    }

    const root = getComputedStyle(document.documentElement);
    const grotesk = root.getPropertyValue("--font-nature").trim();
    const editorial = root.getPropertyValue("--font-oskon").trim();

    document.fonts.ready.then(() => {
      if (!live) return;
      const g = measureFace(grotesk);
      const e = measureFace(editorial);
      if (!g || !e) return;
      faces = { g, e };
      measure();
    });

    const observer = new ResizeObserver(measure);
    observer.observe(document.documentElement);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", schedule, { passive: true });

    return () => {
      live = false;
      cancelAnimationFrame(ticket);
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", schedule);
    };
  }, [onProgress]);

  return track;
}
