"use client";

import { useEffect } from "react";
import { FooterMark } from "@/components/footer/FooterMark";
import { BackToTop } from "@/components/footer/BackToTop";
import { LINKS } from "@/data/links";
import { quietFade } from "@/lib/reveal";
import { useFooterLantern } from "@/hooks/useFooterLantern";
import "@/styles/footer.css";

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
  const root = useFooterLantern();

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
