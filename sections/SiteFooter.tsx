"use client";

import { useEffect, useRef } from "react";
import { FooterMark } from "@/components/content/FooterMark";
import { BackToTop } from "@/components/core/BackToTop";
import { Rule } from "@/components/core/Rule";
import { LINKS } from "@/lib/links";
import { quietFade } from "@/lib/reveal";
import "@/styles/footer.css";

const MARKS = [
  "Actress · Producer",
  "Portfolio · 2026 edition",
  "Fan project — not affiliated",
];

export function SiteFooter() {
  const root = useRef<HTMLElement>(null);

  // The counterpoint of silence after the Now panel: the links and the way
  // back up just appear, with no stagger and no travel to notice.
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    return quietFade(
      node,
      Array.from(node.querySelectorAll(".footer-links, .footer-end")),
    );
  }, []);

  return (
    <footer
      ref={root}
      id="footer"
      data-cursor-skin="invert"
      className="site-footer grain relative overflow-hidden border-t border-ink-850 bg-ink-850 text-paper-000"
    >
      <FooterMark />

      <div className="bleed footer-body">
        <Rule tone="periwinkle" />

        <div className="grid gap-8 md:grid-cols-[1fr_auto]">
          <ul className="footer-links flex flex-col">
            {LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  data-cursor="Visit"
                  className="group flex items-baseline justify-between gap-6 border-b border-periwinkle-400 py-3 font-text text-label font-bold uppercase tracking-label-wide text-paper-000 transition-colors duration-[140ms] ease-[var(--ease-out)] hover:text-rose-400"
                >
                  <span className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="inline-block size-2 bg-rose-400"
                    />
                    {link.label}
                  </span>
                  <span className="text-periwinkle-400 transition-colors duration-[140ms] ease-[var(--ease-out)] group-hover:text-rose-400">
                    {link.value}
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <div className="flex flex-col justify-end gap-2 font-text text-label-sm uppercase tracking-label text-periwinkle-400 md:text-micro md:text-right">
            {MARKS.map((mark) => (
              <span key={mark}>{mark}</span>
            ))}
          </div>
        </div>

        <div className="footer-end flex items-center justify-between gap-4 font-text text-label-sm uppercase tracking-label-wide text-ink-500 md:text-micro">
          <BackToTop className="inline-flex min-h-[44px] items-center transition-colors duration-[140ms] ease-[var(--ease-out)] hover:text-rose-400">
            &uarr; Back to top
          </BackToTop>
          <span>End</span>
        </div>
      </div>
    </footer>
  );
}
