"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { asset } from "@/lib/asset";
import { EDITORIAL_NOTE, EDITORIAL_SHOTS } from "@/lib/editorial";
import { useEditorialReel } from "@/lib/useEditorialReel";
import "@/styles/editorial.css";

const TOTAL = String(EDITORIAL_SHOTS.length).padStart(2, "0");

const FRAMES = EDITORIAL_SHOTS.map((shot) => 1 + (shot.gallery?.length ?? 0));

const SLOTS = [
  { top: "8svh", left: "5vw", w: "25vw", dx: "-55vw", dy: "0svh" },
  { top: "24svh", right: "5vw", w: "28vw", dx: "55vw", dy: "0svh" },
  { bottom: "7svh", left: "37vw", w: "22vw", dx: "0vw", dy: "62svh" },
  { bottom: "16svh", left: "7vw", w: "20vw", dx: "-55vw", dy: "0svh" },
  { top: "6svh", right: "33vw", w: "18vw", dx: "55vw", dy: "0svh" },
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
    open,
  } = useEditorialReel(FRAMES);

  const item = EDITORIAL_SHOTS[shown];
  const isOpen = active !== null;
  const cards = item.gallery ?? [];
  const span = 1 / (cards.length + 0.5);

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

        <div aria-hidden className="ed-cards">
          {isOpen
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
                    sizes="30vw"
                    style={
                      {
                        top: slot.top,
                        left: slot.left,
                        right: slot.right,
                        bottom: slot.bottom,
                        "--w": slot.w,
                        "--dx": slot.dx,
                        "--dy": slot.dy,
                        "--ar": (card.width / card.height).toFixed(4),
                        "--a": (index * span).toFixed(4),
                        "--b": ((index + 1) * span).toFixed(4),
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
