"use client";

import { useEffect } from "react";
import type { CSSProperties } from "react";
import { asset } from "@/lib/asset";
import { maskReveal } from "@/lib/reveal";
import { useFooterMark } from "@/lib/useFooterMark";

const PHOTO = "/images/ellefanning-footer-mark.webp";

export function FooterMark() {
  const mark = useFooterMark();

  useEffect(() => {
    const node = mark.current;
    if (!node) return;
    return maskReveal(node, [node], 0);
  }, [mark]);

  return (
    <h2
      ref={mark}
      className="footer-mark"
      style={{ "--mark-photo": `url(${asset(PHOTO)})` } as CSSProperties}
    >
      <span className="footer-line">Elle</span>
      <span className="footer-line">
        Fanning<span className="footer-dot">.</span>
      </span>

      <span aria-hidden className="footer-glow" />

      <span aria-hidden className="footer-lens">
        <span className="footer-line">Elle</span>
        <span className="footer-line">
          Fanning<span className="footer-dot">.</span>
        </span>
      </span>
    </h2>
  );
}
