"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

import { isLocked, scrollTo } from "@/lib/scroll";

const MIN_THUMB = 120;

function clamp01(x: number) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

export function useScrollbar() {
  const rail = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLSpanElement>(null);

  const [live, setLive] = useState(false);
  const [drag, setDrag] = useState(false);
  const [fine, setFine] = useState(false);

  const span = useRef({ max: 0, travel: 0 });
  const grab = useRef(0);

  const paint = useCallback(() => {
    const railEl = rail.current;
    const thumbEl = thumb.current;
    if (!railEl || !thumbEl) return;

    const doc = document.documentElement;
    const view = window.innerHeight;
    const max = doc.scrollHeight - view;

    if (max <= 1 || isLocked()) {
      setLive(false);
      return;
    }
    setLive(true);

    const track = railEl.clientHeight;
    const height = Math.max(MIN_THUMB, Math.round(track * (view / doc.scrollHeight)));
    const travel = Math.max(track - height, 0);
    span.current = { max, travel };

    thumbEl.style.height = `${height}px`;
    thumbEl.style.transform = `translate3d(0, ${Math.round(travel * clamp01(window.scrollY / max))}px, 0)`;
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(pointer: fine)");
    const read = () => setFine(query.matches);

    read();
    query.addEventListener("change", read);

    return () => query.removeEventListener("change", read);
  }, []);

  useEffect(() => {
    if (!fine) return;

    const first = window.setTimeout(paint, 0);

    window.addEventListener("scroll", paint, { passive: true });
    window.addEventListener("resize", paint);

    const sizer = new ResizeObserver(paint);
    sizer.observe(document.documentElement);

    const watch = new MutationObserver(paint);
    watch.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style"],
    });

    return () => {
      window.clearTimeout(first);
      window.removeEventListener("scroll", paint);
      window.removeEventListener("resize", paint);
      sizer.disconnect();
      watch.disconnect();
    };
  }, [paint, fine]);

  const ride = useCallback((clientY: number) => {
    const railEl = rail.current;
    if (!railEl) return;

    const { max, travel } = span.current;
    if (travel <= 0) return;

    const top = railEl.getBoundingClientRect().top;
    const p = clamp01((clientY - top - grab.current) / travel);
    scrollTo(p * max, { immediate: true });
  }, []);

  const onThumbDown = useCallback(
    (event: ReactPointerEvent<HTMLSpanElement>) => {
      const thumbEl = thumb.current;
      if (!thumbEl || event.button !== 0) return;

      event.preventDefault();
      thumbEl.setPointerCapture(event.pointerId);
      grab.current = event.clientY - thumbEl.getBoundingClientRect().top;
      setDrag(true);
    },
    [],
  );

  const onThumbMove = useCallback(
    (event: ReactPointerEvent<HTMLSpanElement>) => {
      const thumbEl = thumb.current;
      if (!thumbEl?.hasPointerCapture(event.pointerId)) return;
      ride(event.clientY);
    },
    [ride],
  );

  const onThumbUp = useCallback((event: ReactPointerEvent<HTMLSpanElement>) => {
    const thumbEl = thumb.current;
    if (thumbEl?.hasPointerCapture(event.pointerId)) {
      thumbEl.releasePointerCapture(event.pointerId);
    }
    setDrag(false);
  }, []);

  const onRailDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.target === thumb.current || event.button !== 0) return;

      const thumbEl = thumb.current;
      grab.current = thumbEl ? thumbEl.offsetHeight / 2 : 0;
      ride(event.clientY);
    },
    [ride],
  );

  return { rail, thumb, fine, live, drag, onThumbDown, onThumbMove, onThumbUp, onRailDown };
}
