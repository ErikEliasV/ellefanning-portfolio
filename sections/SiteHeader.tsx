"use client";

import { SECTIONS } from "@/lib/sections";
import { useHeaderGlass } from "@/lib/useHeaderGlass";
import "@/styles/header.css";

export function SiteHeader() {
  const { shell, hot, active, open, ride, bind } = useHeaderGlass();

  return (
    <header ref={shell} className="hdr" data-open={open ? "" : undefined}>
      <div aria-hidden className="hdr-tint" />
      <div aria-hidden className="hdr-edge" />

      <nav
        className="hdr-nav"
        aria-label="Sections"
        data-open={open ? "" : undefined}
      >
        {SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="hdr-link"
            data-hot={hot === section.id ? "" : undefined}
            aria-current={active === section.id ? "true" : undefined}
            onClick={(event) => ride(event, section.id)}
            {...bind(section.id)}
          >
            {section.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
