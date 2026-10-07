"use client";

import type { MouseEvent, ReactNode } from "react";

import { scrollTo } from "@/lib/scroll";

type BackToTopProps = {
  className?: string;
  children: ReactNode;
};

export function BackToTop({ className, children }: BackToTopProps) {
  // The href stays for keyboard and for a page whose script never arrived; the
  // handler exists because a native hash jump moves the document behind Lenis's
  // back and leaves it easing toward a place nobody is at any more.
  function ride(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    scrollTo(0);
  }

  return (
    <a href="#hero" className={className} onClick={ride}>
      {children}
    </a>
  );
}
