"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";

const CELL_VW = 0.3;
const CELL_VW_NARROW = 0.8;
const NARROW_MAX = 760;
const PAN_FACTOR = 0.42;
const PAN_MIN_VH = 1.2;
const PAN_MAX_VH = 2;
const INTENT_PX = 12;
const SETTLE_MS = 620;

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
  const capWrap = useRef<HTMLDivElement>(null);
  const capBlock = useRef<HTMLDivElement>(null);
  const capTitle = useRef<HTMLParagraphElement>(null);
  const capYear = useRef<HTMLSpanElement>(null);

  const [active, setActive] = useState<number | null>(null);
  const [shown, setShown] = useState(0);
  const [armed, setArmed] = useState(false);
  const [settled, setSettled] = useState(false);

  const activeRef = useRef<number | null>(null);
  const armedRef = useRef(false);
  const settledRef = useRef(false);
  const settleTimer = useRef(0);

  const engaged = useRef(false);
  const pointer = useRef({ x: -1, inside: false, travel: 0 });
  const geometry = useRef({ cell: 1, panMax: 0, panScroll: 1, q: 0 });

  const rest = useCallback(() => {
    if (settledRef.current) {
      settledRef.current = false;
      setSettled(false);
    }
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      settledRef.current = true;
      setSettled(true);
    }, SETTLE_MS);
  }, []);

  const focus = useCallback(
    (index: number | null) => {
      if (activeRef.current === index) return;
      activeRef.current = index;
      setActive(index);
      if (index !== null) setShown(index);
      rest();
    },
    [rest],
  );

  const sync = useCallback(() => {
    if (!engaged.current || !pointer.current.inside) {
      focus(null);
      return;
    }
    const { cell, panMax, q } = geometry.current;
    const raw = Math.floor((pointer.current.x + q * panMax) / cell);
    focus(Math.min(Math.max(raw, 0), count - 1));
  }, [count, focus]);

  const close = useCallback(() => {
    engaged.current = false;
    pointer.current.travel = 0;
    focus(null);
  }, [focus]);

  const onPointerEnter = useCallback((event: ReactPointerEvent) => {
    pointer.current.x = event.clientX;
    pointer.current.inside = true;
    pointer.current.travel = 0;
  }, []);

  const onPointerMove = useCallback(
    (event: ReactPointerEvent) => {
      const previous = pointer.current.x;
      pointer.current.x = event.clientX;
      pointer.current.inside = true;
      if (previous >= 0) {
        pointer.current.travel += Math.abs(event.clientX - previous);
      }
      if (!engaged.current && pointer.current.travel >= INTENT_PX) {
        engaged.current = true;
      }
      sync();
    },
    [sync],
  );

  const onPointerLeave = useCallback(() => {
    pointer.current = { x: -1, inside: false, travel: 0 };
    close();
  }, [close]);

  const onTap = useCallback(
    (event: ReactMouseEvent) => {
      if (activeRef.current !== null) {
        close();
        return;
      }
      pointer.current.x = event.clientX;
      pointer.current.inside = true;
      engaged.current = true;
      sync();
    },
    [close, sync],
  );

  const onFocusCell = useCallback(
    (index: number) => {
      engaged.current = true;
      pointer.current.inside = true;
      focus(index);
    },
    [focus],
  );

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
      const q = Math.min(Math.max(-rect.top / geometry.current.panScroll, 0), 1);
      geometry.current.q = q;
      trackNode.style.setProperty("--q", q.toFixed(4));
      rest();
      sync();
    }

    function schedule() {
      if (!ticket) ticket = requestAnimationFrame(progress);
    }

    function measure() {
      if (!trackNode) return;
      const vw = document.documentElement.clientWidth;
      const vh = smallViewportHeight();
      if (!vw || !vh) return;

      const cell = (vw <= NARROW_MAX ? CELL_VW_NARROW : CELL_VW) * vw;
      const panMax = Math.max(0, count * cell - vw);
      const panScroll = Math.min(
        Math.max(panMax * PAN_FACTOR, PAN_MIN_VH * vh),
        PAN_MAX_VH * vh,
      );
      geometry.current = { ...geometry.current, cell, panMax, panScroll };

      const style = trackNode.style;
      style.setProperty("--cell-w", `${cell.toFixed(2)}px`);
      style.setProperty("--pan-max", `${panMax.toFixed(2)}px`);
      style.setProperty("--track-h", `${(vh + panScroll).toFixed(2)}px`);

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
      window.clearTimeout(settleTimer.current);
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("keydown", onKey);
    };
  }, [count, close, rest, sync]);

  useEffect(() => {
    const trackNode = track.current;
    if (!trackNode) return;
    fitTitle(capTitle.current, capYear.current);
    const wrap = capWrap.current;
    const block = capBlock.current;
    if (wrap && block) {
      const travel = Math.max(0, wrap.clientHeight - block.offsetHeight);
      trackNode.style.setProperty("--cap-travel", `${travel.toFixed(2)}px`);
    }
  }, [shown]);

  return {
    track,
    capWrap,
    capBlock,
    capTitle,
    capYear,
    active,
    shown,
    armed,
    settled,
    close,
    onPointerEnter,
    onPointerMove,
    onPointerLeave,
    onTap,
    onFocusCell,
  };
}
