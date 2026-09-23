"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { asset } from "@/lib/asset";
import { clearInert, markOutsideInert } from "@/lib/inert";
import { lockScroll } from "@/lib/scroll";
import type { Character } from "@/lib/characters";
import "@/styles/close.css";

// A caixa do card no instante do clique, em coordenadas de viewport
// (`getBoundingClientRect()`), mais o raio que ele tinha ali. E dali que a foto
// cresce ate virar o fundo da tela.
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
  // Monta escondido e liga no tick seguinte, para o CSS ver a mudanca de estado
  // e animar a entrada em vez de nascer pronto.
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = shell.current;
    lockScroll(true);
    close.current?.focus();
    const inerted = node ? markOutsideInert(node) : [];

    // setTimeout, nao requestAnimationFrame: so precisa de um tick fora do
    // commit atual para o CSS ver a mudanca de estado, e um rAF ficaria a merce
    // de o browser achar que a aba nao precisa desenhar.
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

  // `open` so e verdadeiro quando ja assentou E nao esta saindo, entao a mesma
  // classe que fez a entrada roda ao contrario no instante em que `closing`
  // vira true -- sem efeito nenhum no meio.
  const open = shown && !closing;

  const growStyle = {
    "--grow-top": `${origin.top}px`,
    "--grow-left": `${origin.left}px`,
    "--grow-w": `${origin.width}px`,
    "--grow-h": `${origin.height}px`,
    "--grow-r": `${origin.radius}px`,
    "--focus": character.focus ?? 0.5,
  } as CSSProperties;

  return (
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
    </div>
  );
}
