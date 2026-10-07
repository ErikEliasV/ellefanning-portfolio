"use client";

import { useEffect, useRef } from "react";

import { onTick } from "@/lib/scroll";
import { onViewport, smallViewportHeight } from "@/lib/viewport";

const IMG_RATIO = 1900 / 1140;
const SIL_RATIO = 1490 / 1054;
const SIL_LEFT = 224 / 1900;
const SIL_TOP = 86 / 1140;
const SIL_WIDTH = 1490 / 1900;

const FRAME_W = 1920;

const A_SIL_W_VW = 1.0342;
const A_SIL_W_VH = 1.6;
const A_SIL_W_MAX_VW = 1.9;

const NARROW_MAX = 1023;
const PHONE_W = 402;
const PHONE_H = 874;

const A_SIL_W_MAX_VW_NARROW = 830.5 / PHONE_W;
const A_SIL_SHOW_NARROW = (PHONE_H - 533.98) / 587.3;
const A_SIL_CX_VW_NARROW = 257.05 / PHONE_W;

const B_SIL_W_VW_NARROW = 1109.6 / PHONE_W;
const B_SIL_CX_VW_NARROW = 260.62 / PHONE_W;
const B_SIL_TOP_VH_NARROW = 231.05 / PHONE_H;

const A_SIL_SHOW = 0.37;
const A_SIL_CX_VW = 0.5115;
const A_RISE_VH = 0.22;

const B_SIL_W_VW = 1.04;
const B_SIL_CX_VW = 0.5;
const B_HEADROOM = 0.12;

const MORPH_VH = 0.7;

const PAPER_WIDTH = 2717.464;
const PAPER_CAP_TOP = -6.778;
const PAPER_GLYPH_LEFT = -63.71;
const PAPER_LINE = 736.142;

const START_INK = 989.9986;
const START_CAP = 199.637;
const START_BLOCK = 409.8396;
const START_LINE = 205.16;
const START_TOP = 471.8876;
const START_HEAD = 1160 + (86 / 1140) * 1430;

const START_W_VW = START_INK / FRAME_W;
const START_BLOCK_K = START_BLOCK / START_INK;
const START_LINE_K = START_LINE / START_INK;
const START_CAP_K = START_CAP / START_INK;

const START_TOP_K = START_TOP / START_HEAD;
const START_GAP_K = 0.1;
const START_W_MIN = 280;

const START_W_VW_NARROW = 314 / PHONE_W;
const START_TOP_VH_NARROW = 236 / PHONE_H;
const B_INK_VW_NARROW = 1236.84 / PHONE_W;
const B_CAP_TOP_VH_NARROW = 64 / PHONE_H;
const B_INK_LEFT_VW_NARROW = -62 / PHONE_W;

const NARROW_LINE_K = 1.0038;

const SETTLE_CAP_K = 0.086;

const SAMPLE = "FANNING.";
const SAMPLE_SIZE = 1000;

type Face = {
  w: number;
  ink: number;
  cap: number;
  asc: number;
  desc: number;
  bbLeft: number;
};

function context2d() {
  return document.createElement("canvas").getContext("2d");
}

function measureFace(family: string): Face | null {
  const context = context2d();
  if (!context || !family) return null;

  context.letterSpacing = "-0.01em";
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  context.font = `400 ${SAMPLE_SIZE}px ${family}`;

  const metrics = context.measureText(SAMPLE);
  if (!metrics.width) return null;

  return {
    w: metrics.width / SAMPLE_SIZE,
    ink: (metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight) / SAMPLE_SIZE,
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

export function useHeroMorph(onProgress?: (value: number) => void) {
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trackNode = track.current;
    if (!trackNode) return;

    let morph = 1;
    let live = true;
    let face: Face | null = null;

    function progress() {
      if (!trackNode) return;
      const value = Math.min(Math.max(-trackNode.getBoundingClientRect().top / morph, 0), 1);
      trackNode.style.setProperty("--p", value.toFixed(4));
      trackNode.style.setProperty("--inv", (1 - value).toFixed(4));
      onProgress?.(value);
    }

    function measure() {
      if (!trackNode || !face) return;
      const vw = document.documentElement.clientWidth;
      const vh = smallViewportHeight();
      if (!vw || !vh) return;

      const ub = vw / FRAME_W;

      const narrow = vw <= NARROW_MAX;
      const capVw = narrow ? A_SIL_W_MAX_VW_NARROW : A_SIL_W_MAX_VW;
      const show = narrow ? A_SIL_SHOW_NARROW : A_SIL_SHOW;

      const silWa = Math.min(
        Math.max(A_SIL_W_VW * vw, A_SIL_W_VH * vh),
        capVw * vw,
      );
      const silHa = silWa / SIL_RATIO;

      const silWb = Math.max((narrow ? B_SIL_W_VW_NARROW : B_SIL_W_VW) * vw, silWa);
      const silHb = silWb / SIL_RATIO;
      const frameHb = narrow ? vh : Math.max(vh, silHb / (1 - B_HEADROOM));
      const silTb = narrow ? B_SIL_TOP_VH_NARROW * vh : frameHb - silHb;
      const boxB = imageBox(
        silWb,
        (narrow ? B_SIL_CX_VW_NARROW : B_SIL_CX_VW) * vw,
        silTb,
      );

      const silTa = Math.max(vh - show * silHa, silTb + A_RISE_VH * vh);
      const boxA = imageBox(
        silWa,
        (narrow ? A_SIL_CX_VW_NARROW : A_SIL_CX_VW) * vw,
        silTa,
      );

      morph = MORPH_VH * vh;

      const paperGlyphLeft = narrow ? B_INK_LEFT_VW_NARROW * vw : PAPER_GLYPH_LEFT * ub;
      const paperCapTop = narrow ? B_CAP_TOP_VH_NARROW * vh : PAPER_CAP_TOP * ub;

      const paperWidth = narrow
        ? ((B_INK_VW_NARROW * vw) / face.ink) * face.w
        : PAPER_WIDTH * ub;
      const paperLine = narrow
        ? (NARROW_LINE_K * face.cap * (B_INK_VW_NARROW * vw)) / face.ink
        : PAPER_LINE * ub;
      const paper = fit(face, paperWidth, paperCapTop, paperGlyphLeft, paperLine);

      const startTop = narrow ? START_TOP_VH_NARROW * vh : START_TOP_K * silTa;
      const room = Math.max(silTa - startTop, 0);
      const startInk = Math.max(
        Math.min(
          (narrow ? START_W_VW_NARROW : START_W_VW) * vw,
          room / (START_BLOCK_K + START_GAP_K),
        ),
        START_W_MIN,
      );
      const paperInk = face.ink * paper.size;
      const lockK = paperInk ? startInk / paperInk : 1;
      const lockLeft = (vw - startInk) / 2;
      const lockDx = lockLeft - paper.left - lockK * (paperGlyphLeft - paper.left);
      const lockDy = startTop - paper.top - lockK * (paperCapTop - paper.top);
      const lockClose = narrow ? 0 : (START_LINE_K * startInk) / lockK - paperLine;

      const set = (name: string, value: number, unit = "px") =>
        trackNode.style.setProperty(name, `${Math.round(value * 100) / 100}${unit}`);

      set("--morph", morph);
      set("--frame-h-a", vh);
      set("--frame-h-b", frameHb);

      set("--img-w", boxB.width);
      set("--img-h", boxB.height);
      set("--img-dx", boxA.x - boxB.x);
      set("--img-dy", boxA.y - boxB.y);
      set("--img-x", boxB.x);
      set("--img-y", boxB.y);
      set("--img-k", silWa / silWb, "");

      set("--paper-line", paperLine);
      set("--paper-size", paper.size);
      set("--paper-top", paper.top);
      set("--paper-left", paper.left);
      trackNode.style.setProperty("--lock-k", lockK.toFixed(4));
      set("--lock-dx", lockDx);
      set("--lock-dy", lockDy);
      set("--lock-close", lockClose);
      set("--lock-settle", SETTLE_CAP_K * START_CAP_K * startInk);

      trackNode.dataset.ready = "";
      progress();
    }

    const root = getComputedStyle(document.documentElement);
    const editorial = root.getPropertyValue("--font-oskon").trim();

    document.fonts.ready.then(() => {
      if (!live) return;
      const lockup = measureFace(editorial);
      if (!lockup) return;
      face = lockup;
      measure();
    });

    const unwatch = onViewport(measure);
    const untick = onTick(progress);

    return () => {
      live = false;
      untick();
      unwatch();
    };
  }, [onProgress]);

  return track;
}
