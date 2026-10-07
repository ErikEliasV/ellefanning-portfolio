"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { asset } from "@/lib/asset";
import { FilmDialog, type Origin } from "@/components/filmography/FilmDialog";
import type { Film } from "@/data/films";
import { isNarrow, lastLockAt, trackVh } from "@/lib/motion/filmStage";
import { isReduced, scrollTo } from "@/lib/scroll";
import { useFilmStage } from "@/hooks/useFilmStage";
import "@/styles/pill.css";

const EXIT_MS = 900;
const EXIT_MS_REDUCED = 120;

function two(value: number) {
  return String(value).padStart(2, "0");
}

function digits(value: string) {
  return value.split("").map((glyph, at) => (
    <span key={at} className="num-cell">{glyph}</span>
  ));
}

export function FilmStage({ films }: { films: readonly Film[] }) {
  const { track, stage, rail, cut, curtain, active, lock } = useFilmStage(films.length);
  const now = films[active];
  const [open, setOpen] = useState<number | null>(null);
  const [closing, setClosing] = useState(false);
  const [origin, setOrigin] = useState<Origin | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const exitTimer = useRef(0);
  const wasOpen = useRef(false);

  function openFilm(index: number, event: MouseEvent<HTMLButtonElement>) {
    window.clearTimeout(exitTimer.current);
    trigger.current = event.currentTarget;
    const rect = event.currentTarget.getBoundingClientRect();
    setOrigin({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    setClosing(false);
    setOpen(index);
  }

  const closeFilm = useCallback(() => setClosing(true), []);

  const skipToLast = useCallback(() => {
    const trackEl = track.current;
    if (!trackEl) return;
    const reduced = isReduced();
    const narrow = isNarrow();
    const vh = trackEl.offsetHeight / trackVh(reduced, narrow);
    const top = trackEl.getBoundingClientRect().top + window.scrollY;
    scrollTo(top + lastLockAt(reduced, narrow) * vh);
  }, [track]);

  useEffect(() => {
    if (!closing) return;
    const ms = isReduced() ? EXIT_MS_REDUCED : EXIT_MS;
    exitTimer.current = window.setTimeout(() => {
      setOpen(null);
      setClosing(false);
    }, ms);
    return () => window.clearTimeout(exitTimer.current);
  }, [closing]);

  useEffect(() => {
    if (open !== null) {
      wasOpen.current = true;
      return;
    }
    if (!wasOpen.current) return;
    wasOpen.current = false;
    trigger.current?.focus();
  }, [open]);

  return (
    <div ref={track} className="film-track">
      <span ref={curtain} aria-hidden className="film-curtain" />

      <div ref={stage} className="film-stage">
        <span aria-hidden className="film-paper" />

        <div className="film-word-back">
          <span className="film-word">Filmo</span>
          <span className="film-count">
            <span className="film-count-now">{digits(two(active + 1))}</span>
            <span className="film-count-all">/ {digits(two(films.length))}</span>
          </span>
        </div>

        <div className="film-word-front">
          <span className="film-word">graphy</span>
          <span className="film-year">{now.year}</span>
        </div>

        <div ref={rail} className="film-rail">
          {films.map((film, index) => (
            <button
              key={film.id}
              type="button"
              className="film-card"
              data-at={index}
              data-live={index === lock ? "" : undefined}
              data-cursor={index === lock ? "Open" : undefined}
              aria-label={`${film.title} (${film.year}) — open details`}
              onClick={(event) => openFilm(index, event)}
            >
              {film.poster ? (
                <Image
                  src={asset(film.poster)}
                  alt={`${film.title} (${film.year})`}
                  fill
                  sizes="(min-width: 64rem) 30vw, 70vw"
                  priority={index === 0}
                  draggable={false}
                  className="film-card-image"
                />
              ) : (
                <span className="film-card-blank">{film.title}</span>
              )}
              {index === lock ? (
                <span aria-hidden className="film-card-cue">Open</span>
              ) : null}
            </button>
          ))}
        </div>

        <div ref={cut} aria-hidden className="film-word-cut">
          <span className="film-word">Filmo</span>
        </div>

        <button
          type="button"
          className="pill film-skip"
          data-cursor="Skip"
          data-cursor-at="top"
          aria-label="Skip to the last film"
          onClick={skipToLast}
        >
          <span className="pill-label">Skip</span>
        </button>
      </div>

      {open !== null && origin ? (
        <FilmDialog film={films[open]} closing={closing} origin={origin} onClose={closeFilm} />
      ) : null}
    </div>
  );
}
