"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { asset } from "@/lib/asset";
import { maskReveal } from "@/lib/reveal";

const PHOTO = "/images/ellefanning-footer-mark.webp";

export function FooterMark() {
  // So o reveal de entrada mora aqui. A lanterna subiu para o <footer>
  // (lib/useFooterLantern.ts) e chega nesta camada pelas variaveis herdadas,
  // porque agora ela banha o rodape inteiro e nao so o nome.
  const mark = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const node = mark.current;
    if (!node) return;
    return maskReveal(node, [node], 0);
  }, []);

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

      <span aria-hidden className="footer-lens">
        <span className="footer-line">Elle</span>
        <span className="footer-line">
          Fanning<span className="footer-dot">.</span>
        </span>
      </span>
    </h2>
  );
}
