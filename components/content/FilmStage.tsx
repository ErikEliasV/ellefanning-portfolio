"use client";

import Image from "next/image";
import { useState } from "react";
import { asset } from "@/lib/asset";
import { FilmDialog } from "@/components/content/FilmDialog";
import type { Film } from "@/lib/films";
import { useFilmStage } from "@/lib/useFilmStage";

function two(value: number) {
  return String(value).padStart(2, "0");
}

// ZT Nature não tem figuras tabulares e seus dígitos variam até 28% de largura,
// então tudo que conta ganha uma célula fixa por dígito. Padrão já estabelecido
// em globals.css.
function digits(value: string) {
  return value.split("").map((glyph, at) => (
    <span key={at} className="num-cell">{glyph}</span>
  ));
}

export function FilmStage({ films }: { films: readonly Film[] }) {
  const { track, stage, rail, cut, curtain, active, lock } = useFilmStage(films.length);
  const now = films[active];
  const [open, setOpen] = useState<number | null>(null);

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
              aria-label={`${film.title} (${film.year}) — open details`}
              onClick={() => setOpen(index)}
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
            </button>
          ))}
        </div>

        <div ref={cut} aria-hidden className="film-word-cut">
          <span className="film-word">Filmo</span>
        </div>
      </div>

      {open !== null ? (
        <FilmDialog film={films[open]} onClose={() => setOpen(null)} />
      ) : null}
    </div>
  );
}
