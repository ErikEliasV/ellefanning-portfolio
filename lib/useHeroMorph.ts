"use client";

import { useEffect, useRef } from "react";

const IMG_RATIO = 1900 / 1140;
const SIL_RATIO = 1490 / 1054;
const SIL_LEFT = 224 / 1900;
const SIL_TOP = 86 / 1140;
const SIL_WIDTH = 1490 / 1900;

const FRAME_W = 1920;

const A_SIL_W_VW = 1.0342;
const A_SIL_W_VH = 1.6;
const A_SIL_W_MAX_VW = 1.9;
const A_SIL_SHOW = 0.38;
const A_SIL_CX_VW = 0.5115;
const A_RISE_VH = 0.22;

const B_SIL_W_VW = 1.04;
const B_HEADROOM = 0.12;

const MORPH_VH = 0.7;

const ENTRY_TEXT = "ELLE FANNING";
const ENTRY_W_VW = 1017.6 / FRAME_W;
const ENTRY_W_MIN = 280;
const ENTRY_W_MAX_VW = 0.86;
const ENTRY_CAP_K = 91.2 / 1017.6;
const ENTRY_TOP_VH = 363.2 / 1219.2;

const PAPER_WIDTH = 2717.464;
const PAPER_CAP_TOP = -6.778;
const PAPER_GLYPH_LEFT = -63.71;
const PAPER_LINE = 736.142;
const PAPER_K = 0.84;

const SAMPLE = "FANNING.";
const SAMPLE_SIZE = 1000;

type Face = {
  w: number;
  cap: number;
  asc: number;
  desc: number;
  bbLeft: number;
};

type EntryFace = {
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
    cap: metrics.actualBoundingBoxAscent / SAMPLE_SIZE,
    asc: metrics.fontBoundingBoxAscent / SAMPLE_SIZE,
    desc: metrics.fontBoundingBoxDescent / SAMPLE_SIZE,
    bbLeft: metrics.actualBoundingBoxLeft / SAMPLE_SIZE,
  };
}

function measureEntry(family: string): EntryFace | null {
  const context = context2d();
  if (!context || !family) return null;

  context.letterSpacing = "0em";
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  context.font = `400 ${SAMPLE_SIZE}px ${family}`;

  const metrics = context.measureText(ENTRY_TEXT);
  if (!metrics.width) return null;

  return {
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

function fitEntry(face: EntryFace, width: number, cap: number, capTop: number) {
  const size = cap / face.cap;
  const track = (width / size - face.ink) / (ENTRY_TEXT.length - 1);
  const offset = size * ((1 - face.asc - face.desc) / 2 + face.asc);
  return {
    size,
    track: track * size,
    top: capTop - offset + face.cap * size,
    left: face.bbLeft * size,
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
    let faces: { lockup: Face; entry: { g: EntryFace; e: EntryFace } } | null = null;

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

      const entryW = Math.min(Math.max(ENTRY_W_VW * vw, ENTRY_W_MIN), ENTRY_W_MAX_VW * vw);
      const entryCap = ENTRY_CAP_K * entryW;
      const entryTop = ENTRY_TOP_VH * vh;
      const entryG = fitEntry(faces.entry.g, entryW, entryCap, entryTop);
      const entryE = fitEntry(faces.entry.e, entryW, entryCap, entryTop);

      const paper = fit(
        faces.lockup,
        PAPER_WIDTH * ub,
        PAPER_CAP_TOP * ub,
        PAPER_GLYPH_LEFT * ub,
        PAPER_LINE * ub,
      );

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

      set("--entry-left", (vw - entryW) / 2);
      set("--entry-width", entryW);
      set("--entry-g-size", entryG.size);
      set("--entry-g-top", entryG.top);
      set("--entry-g-left", entryG.left);
      set("--entry-g-track", entryG.track);
      set("--entry-e-size", entryE.size);
      set("--entry-e-top", entryE.top);
      set("--entry-e-left", entryE.left);
      set("--entry-e-track", entryE.track);

      set("--paper-line", PAPER_LINE * ub);
      set("--paper-k", PAPER_K, "");
      set("--paper-size", paper.size);
      set("--paper-top", paper.top);
      set("--paper-left", paper.left);

      trackNode.dataset.ready = "";
      progress();
    }

    const root = getComputedStyle(document.documentElement);
    const grotesk = root.getPropertyValue("--font-nature").trim();
    const editorial = root.getPropertyValue("--font-oskon").trim();

    document.fonts.ready.then(() => {
      if (!live) return;
      const lockup = measureFace(editorial);
      const entryG = measureEntry(grotesk);
      const entryE = measureEntry(editorial);
      if (!lockup || !entryG || !entryE) return;
      faces = { lockup, entry: { g: entryG, e: entryE } };
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
