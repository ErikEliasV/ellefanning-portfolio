"use client";

import { useCursor } from "@/lib/useCursor";
import "@/styles/cursor.css";

const CORNERS = ["cur-tl", "cur-tr", "cur-br", "cur-bl"];

export function Cursor() {
  const { shell, dot, label, fine } = useCursor();

  if (!fine) return null;

  return (
    <div ref={shell} aria-hidden className="cur">
      {CORNERS.map((corner) => (
        <span key={corner} className={`cur-corner ${corner}`} />
      ))}
      <span ref={dot} className="cur-dot" />
      <span ref={label} className="cur-label" />
    </div>
  );
}
