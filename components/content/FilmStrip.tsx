"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";
import type { Film } from "@/lib/films";

type FilmStripProps = {
  films: readonly Film[];
  heading: string;
  span: string;
  pace?: number;
};

// Scroll held after the reel lands, so the last frame settles instead of stopping short.
const TAIL = 32;

function two(value: number) {
  return String(value).padStart(2, "0");
}

function clamp01(value: number) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

export function FilmStrip({ films, heading, span, pace = 1.6 }: FilmStripProps) {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const meter = useRef<HTMLSpanElement>(null);
  const boxes = useRef<{ left: number; width: number }[]>([]);
  const ticket = useRef(0);
  const cursor = useRef(0);

  const [active, setActive] = useState(0);

  useEffect(() => {
    let travel = 0;
    let run = 0;

    function paint() {
      ticket.current = 0;

      const trackEl = track.current;
      const stripEl = strip.current;
      const railEl = rail.current;
      if (!trackEl || !stripEl || !railEl || run <= 0) return;

      const progress = clamp01(-trackEl.getBoundingClientRect().top / run);
      const shift = progress * travel;

      stripEl.style.transform = `translate3d(${-shift}px, 0, 0)`;
      if (meter.current) meter.current.style.transform = `scaleX(${progress})`;

      const read = railEl.offsetWidth;
      let current = films.length - 1;

      for (let index = 0; index < boxes.current.length; index += 1) {
        const box = boxes.current[index];
        if (box.left - shift + box.width * 0.5 > read) {
          current = index;
          break;
        }
      }

      if (current !== cursor.current) {
        cursor.current = current;
        setActive(current);
      }
    }

    function measure() {
      const trackEl = track.current;
      const stageEl = stage.current;
      const stripEl = strip.current;
      const railEl = rail.current;
      if (!trackEl || !stageEl || !stripEl || !railEl) return;

      boxes.current = Array.from(stripEl.children, (node) => ({
        left: (node as HTMLElement).offsetLeft,
        width: (node as HTMLElement).offsetWidth,
      }));

      const last = boxes.current[boxes.current.length - 1];
      const lead = boxes.current[0];
      const next = boxes.current[1];

      // Rest the last title one gap off the rail, hiding the one before it, so the counter reaches 16.
      const gap = next ? next.left - lead.left - lead.width : 0;
      const rest = railEl.offsetWidth + gap - 2;
      travel = last && lead ? Math.max(last.left - rest, 0) : 0;
      run = travel / pace;
      trackEl.style.height = `${stageEl.offsetHeight + run + TAIL}px`;
      paint();
    }

    function schedule() {
      if (!ticket.current) ticket.current = requestAnimationFrame(paint);
    }

    const observer = new ResizeObserver(measure);
    if (stage.current) observer.observe(stage.current);
    if (strip.current) observer.observe(strip.current);

    measure();
    const settle = requestAnimationFrame(measure);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(settle);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", measure);
      cancelAnimationFrame(ticket.current);
      ticket.current = 0;
    };
  }, [pace, films.length]);

  const now = films[Math.min(active, films.length - 1)];

  return (
    <div ref={track} className="film-track">
      <div ref={stage} className="film-stage">
        <div className="film-reel">
          <div className="film-gate">
            <div ref={strip} className="film-strip">
              {films.map((film) => (
                <article key={film.id} className="film-card">
                  {film.poster ? (
                    <Image
                      src={asset(film.poster)}
                      alt={`${film.title} (${film.year})`}
                      fill
                      sizes="(min-width: 64rem) 32vw, 62vw"
                      draggable={false}
                      className="film-card-image"
                    />
                  ) : (
                    <span className="film-card-blank">{film.title}</span>
                  )}

                  <div className="film-card-plate">
                    <span className="film-card-title">{film.title}</span>
                    <span className="film-card-role">
                      as {film.character} · dir. {film.director}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside ref={rail} className="film-rail">
            <h2 className="film-heading">{heading}</h2>

            <div className="film-index">
              <div className="film-index-row">
                <span className="film-index-now">{two(active + 1)}</span>
                <span className="film-index-total">/ {two(films.length)}</span>
              </div>
              <span className="film-index-year">{now.year}</span>
            </div>
          </aside>
        </div>

        <div className="film-bar">
          <span ref={meter} aria-hidden className="film-meter" />
          <span className="film-bar-name">Elle Fanning</span>
          <span className="film-bar-span">{span}</span>
        </div>
      </div>
    </div>
  );
}
