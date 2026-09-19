"use client";

import type { CSSProperties, MouseEvent } from "react";

import { lockScroll } from "@/lib/scroll";
import { SECTIONS } from "@/lib/sections";
import { useHeaderGlass } from "@/lib/useHeaderGlass";
import { useHeaderMenu } from "@/lib/useHeaderMenu";
import type { SectionId } from "@/lib/sections";
import "@/styles/header.css";

function two(value: number) {
  return String(value).padStart(2, "0");
}

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

  const {
    open: menuOpen,
    button: menuButton,
    sheet: menuSheet,
    toggle: menuToggle,
    close: menuClose,
  } = useHeaderMenu();

  const shown = SECTIONS.find((section) => section.id === hot) ?? null;

  // O painel travou o scroll ao abrir, e quem destrava e a limpeza do efeito
  // de useHeaderMenu -- que so roda depois deste commit. `ride` rola pelo
  // Lenis, que continua parado ate la, entao o salto morreria no caminho. O
  // destravamento vem para ca, antes do salto; chamar `lockScroll(false)`
  // duas vezes (aqui e na limpeza) nao tem efeito colateral nenhum.
  function jump(event: MouseEvent<HTMLAnchorElement>, id: SectionId) {
    menuClose();
    lockScroll(false);
    ride(event, id);
  }

  return (
    <>
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

      {/* O botao e o painel sao irmaos de <header>, nao filhos: o .hdr tem
          `transform`, e isso faz dele o bloco de contencao de qualquer `fixed`
          que caia dentro -- os dois ficariam presos ao retangulo da barra. O
          `clip-path` da casca tambem os recortaria na altura da barra. Eles
          sao chrome proprio, com a mesma roupa dos outros pills flutuantes do
          site (styles/pill.css), e acompanham o recolher da barra pelo
          `data-chrome-hidden` que useHeaderGlass escreve no <html>. */}
      <button
        ref={menuButton}
        type="button"
        className="pill hdr-menu"
        aria-expanded={menuOpen}
        aria-controls="site-menu"
        aria-label={menuOpen ? "Close the section menu" : "Open the section menu"}
        onClick={menuToggle}
      >
        <span aria-hidden className="pill-note hdr-menu-mark" />
        <span className="pill-label">{menuOpen ? "Close" : "Menu"}</span>
      </button>

      <div
        ref={menuSheet}
        id="site-menu"
        className="hdr-sheet"
        data-open={menuOpen ? "" : undefined}
      >
        <nav className="hdr-sheet-nav" aria-label="Sections">
          {SECTIONS.map((section, index) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="hdr-sheet-link"
              style={{ "--at": index } as CSSProperties}
              aria-current={active === section.id ? "true" : undefined}
              onClick={(event) => jump(event, section.id)}
            >
              <span aria-hidden className="hdr-sheet-num">
                {two(index + 1)}
              </span>
              <span className="hdr-sheet-word">{section.label}</span>
            </a>
          ))}
        </nav>
      </div>
    </>
  );
}
