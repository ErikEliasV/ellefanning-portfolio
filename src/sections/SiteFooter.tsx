"use client";

import { useEffect } from "react";
import type { MouseEvent } from "react";
import { FooterMark } from "@/components/footer/FooterMark";
import { LINKS } from "@/data/links";
import { quietFade } from "@/lib/reveal";
import { scrollTo } from "@/lib/scroll";
import { useFooterLantern } from "@/hooks/useFooterLantern";
import "@/styles/footer.css";

function rise(event: MouseEvent<HTMLElement>) {
  const target = event.target instanceof Element ? event.target : null;
  if (target?.closest("a, button")) return;
  if (window.getSelection()?.toString()) return;
  scrollTo(0);
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
      data-cursor-icon="up"
      onClick={rise}
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
      </nav>

      <p className="footer-end">Fan project — not affiliated</p>
    </footer>
  );
}
