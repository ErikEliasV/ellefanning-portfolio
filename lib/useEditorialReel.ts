"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const CELL_VW = 0.3;
const CELL_HOVER_VW = 0.7;
const CELL_VW_NARROW = 0.8;
const NARROW_MAX = 760;
const PAN_FACTOR = 0.42;
const PAN_MIN_VH = 1.2;
const PAN_MAX_VH = 2;
const READ_VH = 0.8;
const READ_MIN = 420;
const IDLE_MS = 180;

function clamp01(value: number) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
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

function fitTitle(title: HTMLElement | null, year: HTMLElement | null) {
  const row = title?.parentElement;
  if (!title || !row || !year) return;
  title.style.width = "auto";
  const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
  const room = Math.max(0, row.clientWidth - year.offsetWidth - gap);
  const natural = title.scrollWidth;
  if (!natural || !room) return;
  const fit = Math.min(1, room / natural);
  title.style.width = `${Math.min(natural, room).toFixed(2)}px`;
  title.style.setProperty("--title-fit", fit.toFixed(4));
}

export function useEditorialReel(count: number) {
  const track = useRef<HTMLDivElement>(null);
  const pin = useRef<HTMLElement>(null);
  const capWrap = useRef<HTMLDivElement>(null);
  const capBlock = useRef<HTMLDivElement>(null);
  const capTitle = useRef<HTMLParagraphElement>(null);
  const capYear = useRef<HTMLSpanElement>(null);

  const [active, setActive] = useState<number | null>(null);
  const [shown, setShown] = useState(0);
  const [armed, setArmed] = useState(false);

  const activeRef = useRef<number | null>(null);
  const armedRef = useRef(false);
  const geometry = useRef({ cell: 1, panMax: 0, panScroll: 1, read: 1, frame: 0 });
  const openAt = useRef(0);
  const spent = useRef(0);
  const idle = useRef(0);
  const repaint = useRef(() => {});

  const scrolled = useCallback(() => {
    const node = track.current;
    return node ? -node.getBoundingClientRect().top : 0;
  }, []);

  const close = useCallback(() => {
    if (activeRef.current === null) return;
    const read = geometry.current.read;
    spent.current += clamp01((scrolled() - openAt.current) / read) * read;
    activeRef.current = null;
    setActive(null);
    repaint.current();
  }, [scrolled]);

  const open = useCallback(
    (index: number) => {
      if (activeRef.current !== null) {
        close();
        return;
      }
      activeRef.current = index;
      openAt.current = scrolled();
      track.current?.style.setProperty("--c", "0");
      setActive(index);
      setShown(index);
      repaint.current();
    },
    [close, scrolled],
  );

  useEffect(() => {
    const trackNode = track.current;
    if (!trackNode) return;

    let ticket = 0;

    function progress() {
      ticket = 0;
      const node = track.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      if (!armedRef.current && rect.top < window.innerHeight * 2) {
        armedRef.current = true;
        setArmed(true);
      }

      const { panScroll, read, frame } = geometry.current;
      const scroll = -rect.top;
      const index = activeRef.current;
      const live = index === null ? 0 : scroll - openAt.current;

      if (index !== null && (live < 0 || live >= read)) {
        close();
        return;
      }

      const style = node.style;
      style.setProperty("--q", clamp01((scroll - spent.current - live) / panScroll).toFixed(4));
      if (index !== null) style.setProperty("--c", (live / read).toFixed(4));
      style.setProperty(
        "--track-h",
        `${(frame + panScroll + spent.current + live).toFixed(2)}px`,
      );
    }

    function schedule() {
      const pinNode = pin.current;
      if (pinNode) {
        pinNode.setAttribute("data-scrolling", "");
        window.clearTimeout(idle.current);
        idle.current = window.setTimeout(
          () => pinNode.removeAttribute("data-scrolling"),
          IDLE_MS,
        );
      }
      if (!ticket) ticket = requestAnimationFrame(progress);
    }

    repaint.current = progress;

    function measure() {
      const node = track.current;
      if (!node) return;
      const vw = document.documentElement.clientWidth;
      const vh = smallViewportHeight();
      if (!vw || !vh) return;

      const cell = (vw <= NARROW_MAX ? CELL_VW_NARROW : CELL_VW) * vw;
      const panMax = Math.max(0, count * cell - vw);
      const panScroll = Math.min(
        Math.max(panMax * PAN_FACTOR, PAN_MIN_VH * vh),
        PAN_MAX_VH * vh,
      );
      geometry.current = {
        cell,
        panMax,
        panScroll,
        read: Math.max(READ_VH * vh, READ_MIN),
        frame: vh,
      };

      const hover = Math.max(CELL_HOVER_VW * vw, cell);
      const rest =
        count > 1
          ? Math.max((count * cell - hover) / (count - 1), cell * 0.4)
          : cell;

      const style = node.style;
      style.setProperty("--cell-w", `${cell.toFixed(2)}px`);
      style.setProperty("--cell-hover", `${hover.toFixed(2)}px`);
      style.setProperty("--cell-rest", `${rest.toFixed(2)}px`);
      style.setProperty("--pan-max", `${panMax.toFixed(2)}px`);

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
      window.clearTimeout(idle.current);
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("keydown", onKey);
    };
  }, [count, close]);

  useEffect(() => {
    const node = track.current;
    if (!node) return;
    fitTitle(capTitle.current, capYear.current);
    const wrap = capWrap.current;
    const block = capBlock.current;
    if (wrap && block) {
      const travel = Math.max(0, wrap.clientHeight - block.offsetHeight);
      node.style.setProperty("--cap-travel", `${travel.toFixed(2)}px`);
    }
  }, [shown]);

  return {
    track,
    pin,
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
