"use client";

import Image from "next/image";
import { asset } from "@/lib/asset";
import { EDITORIAL_NOTE, EDITORIAL_SHOTS } from "@/lib/editorial";
import { useEditorialReel } from "@/lib/useEditorialReel";
import "@/styles/editorial.css";

const TOTAL = String(EDITORIAL_SHOTS.length).padStart(2, "0");

function pad(index: number) {
  return String(index + 1).padStart(2, "0");
}

export function Editorial() {
  const {
    track,
    capWrap,
    capBlock,
    capTitle,
    capYear,
    active,
    shown,
    armed,
    open,
  } = useEditorialReel(EDITORIAL_SHOTS.length);

  const item = EDITORIAL_SHOTS[shown];
  const isOpen = active !== null;

  return (
    <div ref={track} className="ed-track">
      <section
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
                sizes="(max-width: 760px) 80vw, 36vw"
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
