"use client";

import type { CSSProperties, MouseEvent } from "react";

import { lockScroll } from "@/lib/scroll";
import { SECTIONS } from "@/data/sections";
import { useHeaderGlass } from "@/hooks/useHeaderGlass";
import { useHeaderMenu } from "@/hooks/useHeaderMenu";
import type { SectionId } from "@/data/sections";
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
    tucked,
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
        data-tucked={tucked ? "" : undefined}
      >
        <canvas
          ref={view}
          aria-hidden
          className="hdr-view"
          data-on={painted ? "" : undefined}
        />

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
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="hdr-sheet"
        data-open={menuOpen ? "" : undefined}
        onClick={(event) => {
          if (event.target === event.currentTarget) menuClose();
        }}
      >
        <div className="hdr-sheet-panel">
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
      </div>
    </>
  );
}
