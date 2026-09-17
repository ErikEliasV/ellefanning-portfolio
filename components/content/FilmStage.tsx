"use client";

import Image from "next/image";
import { asset } from "@/lib/asset";
import type { Film } from "@/lib/films";

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
  const active = 0;
  const now = films[active];

  return (
    <div className="film-track">
      <span aria-hidden className="film-curtain" />

      <div className="film-stage">
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

        <div className="film-rail">
          {films.map((film, index) => (
            <article key={film.id} className="film-card" data-at={index}>
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
            </article>
          ))}
        </div>

        <div aria-hidden className="film-word-cut">
          <span className="film-word">Filmo</span>
        </div>
      </div>
    </div>
  );
}
