"use client";

import type { MouseEvent, ReactNode } from "react";

import { scrollTo } from "@/lib/scroll";

type BackToTopProps = {
  className?: string;
  children: ReactNode;
};

export function BackToTop({ className, children }: BackToTopProps) {
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
