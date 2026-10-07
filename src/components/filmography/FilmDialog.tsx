"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { asset } from "@/lib/asset";
import { clearInert, markOutsideInert } from "@/lib/inert";
import { lockScroll } from "@/lib/scroll";
import type { Film } from "@/data/films";
import "@/styles/close.css";

export type Origin = { top: number; left: number; width: number; height: number };

export function FilmDialog({
  film,
  closing,
  origin,
  onClose,
}: {
  film: Film;
  closing: boolean;
  origin: Origin;
  onClose: () => void;
}) {
  const close = useRef<HTMLButtonElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  const face = film.still ?? film.poster;

  useEffect(() => {
    const node = shell.current;
    lockScroll(true);
    close.current?.focus();
    const inerted = node ? markOutsideInert(node) : [];

    const kick = window.setTimeout(() => setShown(true), 0);

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

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
      window.clearTimeout(kick);
      window.removeEventListener("keydown", onKey);
      lockScroll(false);
      clearInert(inerted);
    };
  }, [onClose]);

  const open = shown && !closing;

  const growStyle = {
    "--grow-top": `${origin.top}px`,
    "--grow-left": `${origin.left}px`,
    "--grow-w": `${origin.width}px`,
    "--grow-h": `${origin.height}px`,
  } as CSSProperties;

  return (
    <div
      ref={shell}
      role="dialog"
      aria-modal="true"
      aria-label={film.title}
      className="film-dialog"
      data-open={open ? "" : undefined}
      data-closing={closing ? "" : undefined}
      data-cursor-skin="invert"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {film.poster ? (
        <div className="film-dialog-grow" data-open={open ? "" : undefined} style={growStyle}>
          <Image
            src={asset(film.poster)}
            alt=""
            aria-hidden
            fill
            sizes="100vw"
            className="film-dialog-grow-img"
          />
        </div>
      ) : null}

      <button
        ref={close}
        type="button"
        className="close-pill"
        data-cursor="Close"
        onClick={onClose}
      >
        <span aria-hidden className="close-pill-x" />
        <span className="close-pill-label">back</span>
      </button>

      <div className="film-dialog-text" data-open={open ? "" : undefined}>
        <h3 className="film-dialog-title">{film.title}</h3>
        <p className="film-dialog-label">Synopsis</p>
        <p className="film-dialog-body">{film.summary}</p>
        <p className="film-dialog-role">
          Role: <span>{film.character}</span> · Dir.{" "}
          <span className="film-dialog-dir">{film.director}</span>
        </p>
      </div>

      <div className="film-dialog-plate" data-open={open ? "" : undefined}>
        {film.poster ? (
          <Image
            src={asset(film.poster)}
            alt={`${film.title} (${film.year})`}
            fill
            sizes="30vw"
            className="film-dialog-still film-dialog-still--poster"
          />
        ) : null}
        {face ? (
          <Image
            src={asset(face)}
            alt=""
            aria-hidden
            fill
            sizes="30vw"
            className="film-dialog-still film-dialog-still--face"
          />
        ) : null}
      </div>
    </div>
  );
}
