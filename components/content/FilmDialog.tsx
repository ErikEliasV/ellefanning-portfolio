"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { asset } from "@/lib/asset";
import { lockScroll } from "@/lib/scroll";
import type { Film } from "@/lib/films";

export function FilmDialog({ film, onClose }: { film: Film; onClose: () => void }) {
  const close = useRef<HTMLButtonElement>(null);
  const shell = useRef<HTMLDivElement>(null);

  // Sem o still, o pôster serve os dois lados: nítido na frente, borrado atrás.
  const face = film.still ?? film.poster;

  useEffect(() => {
    lockScroll(true);
    close.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      // O foco fica preso no modal enquanto ele está aberto.
      const targets = shell.current?.querySelectorAll<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
      );
      if (!targets || targets.length === 0) return;
      const first = targets[0];
      const last = targets[targets.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      lockScroll(false);
    };
  }, [onClose]);

  return (
    <div
      ref={shell}
      role="dialog"
      aria-modal="true"
      aria-label={film.title}
      className="film-dialog"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {film.poster ? (
        <Image
          src={asset(film.poster)}
          alt=""
          aria-hidden
          fill
          sizes="100vw"
          className="film-dialog-wash"
        />
      ) : null}

      <button ref={close} type="button" className="film-dialog-close" onClick={onClose}>
        <span aria-hidden className="film-dialog-x" />
        <span className="film-dialog-back">back</span>
      </button>

      <div className="film-dialog-text">
        <h3 className="film-dialog-title">{film.title}</h3>
        <p className="film-dialog-label">Synopsis</p>
        <p className="film-dialog-body">{film.summary}</p>
        <p className="film-dialog-role">
          Role: <span>{film.character}</span> · Dir.{" "}
          <span className="film-dialog-dir">{film.director}</span>
        </p>
      </div>

      {face ? (
        <div className="film-dialog-plate">
          <Image
            src={asset(face)}
            alt={`${film.title} (${film.year})`}
            fill
            sizes="30vw"
            className="film-dialog-still"
          />
        </div>
      ) : null}
    </div>
  );
}
