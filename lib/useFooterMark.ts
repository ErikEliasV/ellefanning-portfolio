"use client";

import { useEffect, useRef } from "react";

export function useFooterMark() {
  const mark = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const node = mark.current;
    if (!node) return;

    const point = { x: 0, y: 0 };
    let frame = 0;

    function paint() {
      frame = 0;
      if (!node) return;

      const box = node.getBoundingClientRect();
      node.style.setProperty("--mx", `${Math.round(point.x - box.left)}px`);
      node.style.setProperty("--my", `${Math.round(point.y - box.top)}px`);
    }

    function aim(event: PointerEvent) {
      point.x = event.clientX;
      point.y = event.clientY;
    }

    function enter(event: PointerEvent) {
      aim(event);
      paint();
    }

    function move(event: PointerEvent) {
      aim(event);
      if (!frame) frame = requestAnimationFrame(paint);
    }

    node.addEventListener("pointerenter", enter, { passive: true });
    node.addEventListener("pointermove", move, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      node.removeEventListener("pointerenter", enter);
      node.removeEventListener("pointermove", move);
    };
  }, []);

  return mark;
}
