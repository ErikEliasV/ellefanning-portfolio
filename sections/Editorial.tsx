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
    close,
  } = useEditorialReel(EDITORIAL_SHOTS.length);

  const item = EDITORIAL_SHOTS[shown];

  return (
    <div ref={track} className="ed-track">
      <section
        id="editorial"
        className="ed-pin"
        data-open={active === null ? undefined : ""}
        onPointerLeave={close}
      >
        <h2 className="sr-only">Editorial</h2>

        <div className="ed-reel">
          {EDITORIAL_SHOTS.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className="ed-cell"
              data-active={index === active ? "" : undefined}
              aria-label={`${item.title} — ${item.kicker}${item.year ? `, ${item.year}` : ""}`}
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse") open(index);
              }}
              onFocus={() => open(index)}
              onClick={() => (index === active ? close() : open(index))}
            >
              <Image
                src={asset(item.src)}
                alt=""
                width={item.width}
                height={item.height}
                className="ed-cell-img"
                sizes="(max-width: 760px) 80vw, 30vw"
                loading={armed ? "eager" : "lazy"}
              />
              <span aria-hidden className="ed-cell-index">
                {pad(index)}
              </span>
            </button>
          ))}
        </div>

        <div aria-hidden className="ed-scrim" />

        <div ref={capWrap} aria-hidden={active === null} className="ed-caption-wrap">
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
          Scroll to read · Esc to close
        </span>
      </section>
    </div>
  );
}
