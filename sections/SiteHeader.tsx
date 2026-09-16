"use client";

import type { CSSProperties } from "react";

import { asset } from "@/lib/asset";
import { SECTIONS } from "@/lib/sections";
import { useHeaderGlass } from "@/lib/useHeaderGlass";
import "@/styles/header.css";

export function SiteHeader() {
  const { shell, hot, active, open, ride, bind } = useHeaderGlass();
  const shown = SECTIONS.find((section) => section.id === hot) ?? null;

  return (
    <header ref={shell} className="hdr" data-open={open ? "" : undefined}>
      <div
        aria-hidden
        className="hdr-plate"
        data-on={open ? "" : undefined}
        style={{ "--hdr-focus": shown?.focus ?? 0.5 } as CSSProperties}
      >
        {shown ? (
          // Cru de proposito: o next/image nao acrescenta nada numa chapa que
          // some atras do canvas, e o output: "export" ja serve o arquivo.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={asset(shown.still)} alt="" draggable={false} />
        ) : null}
      </div>

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
