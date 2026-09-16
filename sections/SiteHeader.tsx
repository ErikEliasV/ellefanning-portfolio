"use client";

import type { CSSProperties } from "react";

import { asset } from "@/lib/asset";
import { SECTIONS } from "@/lib/sections";
import { useHeaderGlass } from "@/lib/useHeaderGlass";
import "@/styles/header.css";

export function SiteHeader() {
  const { shell, hot, active, awake, open, ride, bind } = useHeaderGlass();
  const shown = SECTIONS.find((section) => section.id === hot) ?? null;

  return (
    <header
      ref={shell}
      className="hdr"
      data-open={open ? "" : undefined}
      data-awake={awake ? "" : undefined}
    >
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
      <div aria-hidden className="hdr-spec" />
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

      {/* Semente fixa e baseFrequency parada: o ruido e calculado uma vez, e
          quem se move por baixo do mapa e o gradiente. */}
      <svg aria-hidden className="hdr-defs" width="0" height="0">
        <filter id="hdr-liquid" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.014 0.03"
            numOctaves="2"
            seed="7"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="26"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>
    </header>
  );
}
