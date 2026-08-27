"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const CELL_VW = 0.3;
const CELL_VW_NARROW = 0.8;
const NARROW_MAX = 760;
const PAN_FACTOR = 0.4;
const PAN_MIN_VH = 1.2;
const PAN_MAX_VH = 2.1;
const CAPTION_VH = 0.75;

function smallViewportHeight() {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:absolute;top:0;left:0;width:0;height:100svh;visibility:hidden;pointer-events:none";
  document.body.appendChild(probe);
  const height = probe.getBoundingClientRect().height;
  probe.remove();
  return height || window.innerHeight;
}

function fitTitle(
  title: HTMLElement | null,
  year: HTMLElement | null,
) {
  const row = title?.parentElement;
  if (!title || !row || !year) return;
  const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
  const room = row.clientWidth - year.offsetWidth - gap;
  const natural = title.scrollWidth;
  const fit = natural > room && natural > 0 ? room / natural : 1;
  title.style.setProperty("--title-fit", fit.toFixed(4));
}

export function useEditorialReel(count: number) {
  const track = useRef<HTMLDivElement>(null);
  const capWrap = useRef<HTMLDivElement>(null);
  const capBlock = useRef<HTMLDivElement>(null);
  const capTitle = useRef<HTMLParagraphElement>(null);
  const capYear = useRef<HTMLSpanElement>(null);

  const [active, setActive] = useState<number | null>(null);
  const [shown, setShown] = useState(0);
  const [armed, setArmed] = useState(false);
  const activeRef = useRef<number | null>(null);
  const anchor = useRef(0);
  const armedRef = useRef(false);
  const capScroll = useRef(1);
  const panScroll = useRef(1);

  const open = useCallback((index: number) => {
    if (activeRef.current === index) return;
    activeRef.current = index;
    anchor.current = window.scrollY;
    setActive(index);
    setShown(index);
  }, []);

  const close = useCallback(() => {
    if (activeRef.current === null) return;
    activeRef.current = null;
    setActive(null);
  }, []);

  useEffect(() => {
    const trackNode = track.current;
    if (!trackNode) return;

    let ticket = 0;

    function progress() {
      ticket = 0;
      if (!trackNode) return;
      const rect = trackNode.getBoundingClientRect();
      if (!armedRef.current && rect.top < window.innerHeight * 2) {
        armedRef.current = true;
        setArmed(true);
      }
      const q = Math.min(Math.max(-rect.top / panScroll.current, 0), 1);
      const c =
        activeRef.current === null
          ? 0
          : Math.min(
              Math.max((window.scrollY - anchor.current) / capScroll.current, 0),
              1,
            );
      trackNode.style.setProperty("--q", q.toFixed(4));
      trackNode.style.setProperty("--c", c.toFixed(4));
    }

    function schedule() {
      if (!ticket) ticket = requestAnimationFrame(progress);
    }

    function measure() {
      if (!trackNode) return;
      const vw = document.documentElement.clientWidth;
      const vh = smallViewportHeight();
      if (!vw || !vh) return;

      const cellW = (vw <= NARROW_MAX ? CELL_VW_NARROW : CELL_VW) * vw;
      const panMax = Math.max(0, count * cellW - vw);
      panScroll.current = Math.min(
        Math.max(panMax * PAN_FACTOR, PAN_MIN_VH * vh),
        PAN_MAX_VH * vh,
      );
      capScroll.current = CAPTION_VH * vh;

      const style = trackNode.style;
      style.setProperty("--cell-w", `${cellW.toFixed(2)}px`);
      style.setProperty("--pan-max", `${panMax.toFixed(2)}px`);
      style.setProperty(
        "--track-h",
        `${(vh + panScroll.current + capScroll.current).toFixed(2)}px`,
      );

      fitTitle(capTitle.current, capYear.current);

      const wrap = capWrap.current;
      const block = capBlock.current;
      if (wrap && block) {
        const travel = Math.max(0, wrap.clientHeight - block.offsetHeight);
        style.setProperty("--cap-travel", `${travel.toFixed(2)}px`);
      }

      progress();
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(document.documentElement);
    if (capBlock.current) observer.observe(capBlock.current);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(ticket);
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("keydown", onKey);
    };
  }, [count, close]);

  useEffect(() => {
    const trackNode = track.current;
    if (!trackNode) return;
    trackNode.style.setProperty("--c", "0");
    fitTitle(capTitle.current, capYear.current);
    const wrap = capWrap.current;
    const block = capBlock.current;
    if (wrap && block) {
      const travel = Math.max(0, wrap.clientHeight - block.offsetHeight);
      trackNode.style.setProperty("--cap-travel", `${travel.toFixed(2)}px`);
    }
  }, [active]);

  return {
    track,
    capWrap,
    capBlock,
    capTitle,
    capYear,
    active,
    shown,
    armed,
    open,
    close,
  };
}
