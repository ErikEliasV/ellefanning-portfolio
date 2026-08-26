"use client";

import { useEffect, useRef, useState } from "react";
import { HoverClip } from "@/components/content/HoverClip";
import type { Film } from "@/lib/films";

type FilmStripProps = {
  films: readonly Film[];
  driftX?: number;
  riseY?: number;
};

export function FilmStrip({ films, driftX = 0.9, riseY = 160 }: FilmStripProps) {
  const track = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const ticket = useRef(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduced) return;

    const trackEl = track.current;
    const stripEl = strip.current;
    if (!trackEl || !stripEl) return;

    function paint() {
      ticket.current = 0;
      if (!trackEl || !stripEl) return;

      const box = trackEl.getBoundingClientRect();
      const span = box.height - window.innerHeight;
      if (span <= 0) return;

      const progress = Math.min(Math.max(-box.top / span, 0), 1);
      const travel = Math.max(stripEl.scrollWidth - window.innerWidth, 0) * driftX;

      stripEl.style.transform = `translate3d(${-progress * travel}px, ${-progress * riseY}px, 0)`;
    }

    function schedule() {
      if (!ticket.current) ticket.current = requestAnimationFrame(paint);
    }

    paint();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(ticket.current);
    };
  }, [reduced, driftX, riseY]);

  const cards = films.map((film, index) => (
    <article
      key={film.id}
      style={{ marginBottom: `${index * 18}px` }}
      className="group w-[46vw] shrink-0 sm:w-[30vw] lg:w-[16vw]"
    >
      <HoverClip
        alt={`${film.title} (${film.year})`}
        poster={film.poster}
        clip={film.clip}
        youtubeId={film.youtubeId}
        ratio="2 / 3"
        sizes="(min-width: 1024px) 16vw, (min-width: 640px) 30vw, 46vw"
        placeholder={`${film.title.toUpperCase()}\n${film.year}`}
      />

      <div className="mt-3 border-t border-line-hairline pt-2">
        <div className="flex items-baseline justify-between gap-3 font-mono text-label font-bold uppercase tracking-label">
          <span className="text-ink-900 transition-colors duration-[140ms] ease-[var(--ease-out)] group-hover:text-yellow-600">
            {film.title}
          </span>
          <span className="shrink-0 text-ink-500">{film.year}</span>
        </div>
        <div className="mt-1 font-mono text-micro uppercase tracking-label text-ink-500">
          as {film.character}
        </div>
      </div>
    </article>
  ));

  if (reduced) {
    return (
      <div className="overflow-x-auto overscroll-x-contain py-8">
        <div className="flex w-max items-end gap-6 px-[var(--gutter-page)]">
          {cards}
        </div>
      </div>
    );
  }

  return (
    <div ref={track} className="relative h-[420svh]">
      <div className="sticky top-0 flex h-svh flex-col justify-center overflow-hidden">
        <div
          ref={strip}
          className="flex w-max items-end gap-6 pl-[var(--gutter-page)] pr-[40vw] will-change-transform"
        >
          {cards}
        </div>
      </div>
    </div>
  );
}
