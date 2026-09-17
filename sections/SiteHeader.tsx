"use client";

import type { CSSProperties } from "react";

import { SECTIONS } from "@/lib/sections";
import { useHeaderGlass } from "@/lib/useHeaderGlass";
import "@/styles/header.css";

export function SiteHeader() {
  const {
    shell,
    view,
    tapeA,
    tapeB,
    hot,
    active,
    awake,
    open,
    hidden,
    painted,
    ride,
    bind,
  } = useHeaderGlass();
  const shown = SECTIONS.find((section) => section.id === hot) ?? null;

  return (
    <header
      ref={shell}
      className="hdr"
      data-open={open ? "" : undefined}
      data-awake={awake ? "" : undefined}
      data-hidden={hidden ? "" : undefined}
    >
      <canvas
        ref={view}
        aria-hidden
        className="hdr-view"
        data-on={painted ? "" : undefined}
      />

      {/* Caminho sem WebGL: as fitas aparecem no DOM quando o shader nao pode
          desenha-las. Ate o clipe chegar, o painel e so vidro. */}
      <div
        aria-hidden
        className="hdr-plate"
        data-on={open && !painted ? "" : undefined}
        data-raw={!painted ? "" : undefined}
        style={{ "--hdr-focus": shown?.focus ?? 0.5 } as CSSProperties}
      >
        <video ref={tapeA} muted loop playsInline preload="none" />
        <video ref={tapeB} muted loop playsInline preload="none" />
      </div>

      <div aria-hidden className="hdr-tint" />
      <div aria-hidden className="hdr-spec" />

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
            baseFrequency="0.009 0.021"
            numOctaves="3"
            seed="7"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="58"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>
    </header>
  );
}
