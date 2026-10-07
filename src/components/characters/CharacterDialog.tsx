"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { asset } from "@/lib/asset";
import { clearInert, markOutsideInert } from "@/lib/inert";
import { lockScroll } from "@/lib/scroll";
import type { Character } from "@/data/characters";
import "@/styles/close.css";

const WHEEL_EXIT = 40;
const LINE_PX = 16;

export type Origin = {
  top: number;
  left: number;
  width: number;
  height: number;
  radius: number;
};

export function CharacterDialog({
  character,
  closing,
  origin,
  onClose,
}: {
  character: Character;
  closing: boolean;
  origin: Origin;
  onClose: () => void;
}) {
  const close = useRef<HTMLButtonElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

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

    let pull = 0;

    function onWheel(event: WheelEvent) {
      if (event.deltaY <= 0) {
        pull = 0;
        return;
      }
      const unit =
        event.deltaMode === 1
          ? LINE_PX
          : event.deltaMode === 2
            ? window.innerHeight
            : 1;
      pull += event.deltaY * unit;
      if (pull >= WHEEL_EXIT) onClose();
    }

    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      window.clearTimeout(kick);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
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
    "--grow-r": `${origin.radius}px`,
    "--focus": character.focus ?? 0.5,
  } as CSSProperties;

  return createPortal(
    <div
      ref={shell}
      role="dialog"
      aria-modal="true"
      aria-label={`${character.name} — ${character.film}`}
      className="character-dialog"
      data-open={open ? "" : undefined}
      data-closing={closing ? "" : undefined}
      data-cursor-skin="invert"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="character-dialog-grow" data-open={open ? "" : undefined} style={growStyle}>
        <Image
          src={asset(character.still)}
          alt=""
          aria-hidden
          fill
          sizes="100vw"
          className="character-dialog-img"
        />
      </div>

      <span aria-hidden className="character-dialog-haze character-dialog-haze-1" data-open={open ? "" : undefined} />
      <span aria-hidden className="character-dialog-haze character-dialog-haze-2" data-open={open ? "" : undefined} />

      <div aria-hidden className="character-dialog-veil" data-open={open ? "" : undefined} />

      <div className="character-dialog-text" data-open={open ? "" : undefined}>
        <h3 className="character-dialog-name">{character.name}</h3>
        <p className="character-dialog-film">{character.film}</p>
        <p className="character-dialog-story">{character.story}</p>
        <p className="character-dialog-credit">
          {character.year} · {character.genre} · {character.credit}
        </p>
        <a
          className="character-dialog-imdb"
          href={character.imdb}
          target="_blank"
          rel="noreferrer"
          data-cursor="IMDb"
        >
          <Image
            src={asset("/images/imdb.png")}
            alt={`${character.film} on IMDb`}
            width={138}
            height={70}
            className="character-dialog-imdb-logo"
          />
          <Image
            src={asset("/icons/arrow-out.svg")}
            alt=""
            aria-hidden
            width={39}
            height={39}
            className="character-dialog-imdb-arrow"
          />
        </a>
      </div>

      <button ref={close} type="button" className="close-pill" data-cursor="Close" onClick={onClose}>
        <span aria-hidden className="close-pill-x" />
        <span className="close-pill-label">back</span>
      </button>
    </div>,
    document.body,
  );
}
