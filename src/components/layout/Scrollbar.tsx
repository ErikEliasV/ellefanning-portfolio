"use client";

import { useScrollbar } from "@/hooks/useScrollbar";
import "@/styles/scrollbar.css";

export function Scrollbar() {
  const { rail, thumb, fine, live, drag, onThumbDown, onThumbMove, onThumbUp, onRailDown } =
    useScrollbar();

  if (!fine) return null;

  return (
    <div
      ref={rail}
      aria-hidden
      className="bar"
      data-live={live ? "" : undefined}
      data-drag={drag ? "" : undefined}
      onPointerDown={onRailDown}
    >
      <span
        ref={thumb}
        className="bar-thumb"
        onPointerDown={onThumbDown}
        onPointerMove={onThumbMove}
        onPointerUp={onThumbUp}
        onPointerCancel={onThumbUp}
      />
    </div>
  );
}
