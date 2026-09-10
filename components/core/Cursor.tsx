"use client";

import { useCursor } from "@/lib/useCursor";
import "@/styles/cursor.css";

export function Cursor() {
  const { shell, dot, label, fine } = useCursor();

  if (!fine) return null;

  return (
    <div ref={shell} aria-hidden className="cur">
      <span className="cur-blob" />
      <span ref={dot} className="cur-dot" />
      <span ref={label} className="cur-label" />
    </div>
  );
}
