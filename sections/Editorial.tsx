"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { asset } from "@/lib/asset";
import { EDITORIAL_NOTE, EDITORIAL_SHOTS } from "@/lib/editorial";
import { useEditorialReel } from "@/lib/useEditorialReel";
import "@/styles/editorial.css";

const TOTAL = String(EDITORIAL_SHOTS.length).padStart(2, "0");

const FRAMES = EDITORIAL_SHOTS.map((shot) => 1 + (shot.gallery?.length ?? 0));

const CARDS_START = 0.22;

const SLOTS = [
  { bottom: "4svh", left: "7vw", w: "34vw", rot: "-4deg", spin: "16deg", dx: "-75vw", dy: "0svh" },
  { bottom: "8svh", left: "29vw", w: "32vw", rot: "3deg", spin: "-14deg", dx: "75vw", dy: "0svh" },
  { bottom: "3svh", left: "49vw", w: "33vw", rot: "-1deg", spin: "12deg", dx: "0vw", dy: "72svh" },
  { bottom: "10svh", left: "17vw", w: "30vw", rot: "6deg", spin: "-18deg", dx: "-75vw", dy: "0svh" },
  { bottom: "6svh", left: "40vw", w: "31vw", rot: "-7deg", spin: "14deg", dx: "0vw", dy: "72svh" },
];

function pad(index: number) {
  return String(index + 1).padStart(2, "0");
}

export function Editorial() {
  const {
    track,
    pin,
    capWrap,
    capBlock,
    capTitle,
    capYear,
    active,
    shown,
    armed,
    leaving,
    open,
  } = useEditorialReel(FRAMES);

  const item = EDITORIAL_SHOTS[shown];
  const isOpen = active !== null;
  const cards = item.gallery ?? [];
  const span = (1 - CARDS_START) / (cards.length + 0.5);

  return (
    <div ref={track} className="ed-track">
      <section
        ref={pin}
        id="editorial"
        className="ed-pin"
        data-open={isOpen ? "" : undefined}
      >
        <h2 className="sr-only">Editorial</h2>

        <div className="ed-reel">
          {EDITORIAL_SHOTS.map((shot, index) => (
            <button
              key={shot.id}
              type="button"
              className="ed-cell"
              data-active={index === active ? "" : undefined}
              aria-expanded={index === active}
              aria-label={`${shot.title} — ${shot.kicker}, ${shot.year}`}
              data-cursor="Open"
              onClick={() => open(index)}
            >
              <Image
                src={asset(shot.src)}
                alt=""
                width={shot.width}
                height={shot.height}
                className="ed-cell-img"
                sizes="(max-width: 760px) 80vw, 70vw"
                loading={armed ? "eager" : "lazy"}
              />
              <span aria-hidden className="ed-cell-tag">
                <span className="ed-cell-num">{pad(index)}</span>
                {shot.title}
                <span className="ed-cell-year">{shot.year}</span>
              </span>
            </button>
          ))}
        </div>

        <div aria-hidden className="ed-scrim" />

        <div
          aria-hidden
          className="ed-cards"
          data-exit={leaving ? "" : undefined}
        >
          {isOpen || leaving
            ? cards.map((card, index) => {
                const slot = SLOTS[index % SLOTS.length];
                return (
                  <Image
                    key={card.src}
                    src={asset(card.src)}
                    alt=""
                    width={card.width}
                    height={card.height}
                    className="ed-card"
                    sizes="36vw"
                    style={
                      {
                        bottom: slot.bottom,
                        left: slot.left,
                        zIndex: index + 1,
                        "--w": slot.w,
                        "--dx": slot.dx,
                        "--dy": slot.dy,
                        "--rot": slot.rot,
                        "--out-delay": `${(cards.length - 1 - index) * 55}ms`,
                        "--spin": slot.spin,
                        "--ar": (card.width / card.height).toFixed(4),
                        "--a": (CARDS_START + index * span).toFixed(4),
                        "--b": (CARDS_START + (index + 1) * span).toFixed(4),
                      } as CSSProperties
                    }
                  />
                );
              })
            : null}
        </div>

        <div ref={capWrap} aria-hidden={!isOpen} className="ed-caption-wrap">
          <div ref={capBlock} className="ed-caption">
            <div className="ed-cap-row">
              <p ref={capTitle} className="ed-title">
                {item.title}
              </p>
              <span ref={capYear} className="ed-year">
                {item.year}
              </span>
            </div>

            <div className="ed-rule" />

            <div className="ed-cap-row ed-cap-row-foot">
              <span className="ed-kicker">{item.kicker}</span>
              <div className="ed-more">
                <p className="ed-note">{item.note ?? EDITORIAL_NOTE}</p>
                <span className="ed-count">
                  {pad(shown)} / {TOTAL}
                </span>
              </div>
            </div>
          </div>
        </div>

        <span aria-hidden className="ed-hint">
          {isOpen
            ? "Scroll to read · Click or Esc to close"
            : "Scroll to run the reel · Click a frame to open it"}
        </span>
      </section>
    </div>
  );
}
