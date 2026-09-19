"use client";

import { useEffect } from "react";
import { FooterMark } from "@/components/content/FooterMark";
import { BackToTop } from "@/components/core/BackToTop";
import { LINKS } from "@/lib/links";
import { quietFade } from "@/lib/reveal";
import { useFooterLantern } from "@/lib/useFooterLantern";
import "@/styles/footer.css";

// A ZT Nature nao tem a seta para cima, entao um "↑" cairia numa fonte de
// sistema e, no corpo desta fileira, a troca ficaria obvia ao lado das letras.
// O desenho vem em currentColor e medido em em, entao acompanha o corpo do
// link e vira rosa no hover junto com a palavra.
function ArrowUp() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="square"
      className="footer-arrow"
    >
      <path d="M12 20V5" />
      <path d="M4.5 12.5 12 4.5l7.5 8" />
    </svg>
  );
}

export function SiteFooter() {
  // Um ref so para o <footer>: a lanterna manda nele e o quietFade tambem
  // dispara a partir dele.
  const root = useFooterLantern();

  // The counterpoint of silence after the Now panel: the links and the way
  // back up just appear, with no stagger and no travel to notice.
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    return quietFade(
      node,
      Array.from(node.querySelectorAll(".footer-links, .footer-end")),
    );
  }, [root]);

  return (
    <footer
      ref={root}
      id="footer"
      data-cursor-skin="invert"
      className="site-footer grain relative overflow-hidden border-t border-ink-850 bg-ink-850 text-paper-000"
    >
      <span aria-hidden className="footer-glow" />

      <FooterMark />

      <nav aria-label="Elle Fanning elsewhere" className="footer-links">
        {LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noreferrer noopener"
            data-cursor="Visit"
            className="footer-link"
          >
            {link.label}
          </a>
        ))}

        <BackToTop className="footer-link">
          Back to top
          <ArrowUp />
        </BackToTop>
      </nav>

      <p className="footer-end">Fan project — not affiliated</p>
    </footer>
  );
}
