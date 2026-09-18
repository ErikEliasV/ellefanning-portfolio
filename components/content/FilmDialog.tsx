"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { asset } from "@/lib/asset";
import { lockScroll } from "@/lib/scroll";
import type { Film } from "@/lib/films";

// A caixa do card travado no instante do clique, em coordenadas de viewport
// (`getBoundingClientRect()`). É dali que o pôster cresce até virar o fundo do
// modal — ver o comentário maior junto a `.film-dialog-grow` em
// styles/filmography.css.
export type Origin = { top: number; left: number; width: number; height: number };

// O modal não é portalado para <body>: ele mora dentro de .film-track, vários
// níveis abaixo do header e do botão de som. "Marcar os irmãos" não basta,
// porque em cada nível intermediário (.film-track, a <section>, <main>,
// <body>) há um conjunto diferente de irmãos para inertizar. Esta função sobe
// da caixa do modal até <body>, e em cada parada marca todo mundo que não é
// o próprio caminho até o modal — inclusive .film-stage (os cards atrás do
// fundo escurecido), o header e o botão de som, que vivem em `<body>`.
//
// Devolve a lista do que foi marcado, e é essa lista — não um novo passeio
// pela árvore — que o cleanup usa para desmarcar. Motivo: no desmonte, o
// React já removeu `node` do documento antes de rodar a limpeza do efeito, e
// `node.parentElement` de um nó destacado é `null` — um novo passeio a partir
// dele não encontra mais nada para desmarcar, e o `inert` fica esquecido para
// sempre no header, no som e no palco.
function markOutsideInert(node: HTMLElement): HTMLElement[] {
  const marked: HTMLElement[] = [];
  let child: Element = node;
  while (child !== document.body && child.parentElement) {
    const parent = child.parentElement;
    for (const sibling of Array.from(parent.children)) {
      if (sibling === child) continue;
      const el = sibling as HTMLElement;
      el.setAttribute("inert", "");
      marked.push(el);
    }
    child = parent;
  }
  return marked;
}

function clearInert(elements: readonly HTMLElement[]) {
  for (const el of elements) el.removeAttribute("inert");
}

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
  // Monta escondido (offset/opacidade zero) e liga no frame seguinte, para o
  // CSS ver a mudança de estado e animar a entrada em vez de nascer pronto.
  const [shown, setShown] = useState(false);

  // Sem still, o pôster serve os dois lados: nítido embaixo, e o crossfade
  // por cima usa o mesmo arquivo — a estrutura existe, o efeito é que fica
  // invisível até os stills chegarem.
  const face = film.still ?? film.poster;

  useEffect(() => {
    const node = shell.current;
    lockScroll(true);
    close.current?.focus();
    const inerted = node ? markOutsideInert(node) : [];

    // setTimeout, não requestAnimationFrame: só precisa de um tick fora do
    // commit atual para o CSS ver a mudança de estado, e um rAF ficaria à
    // mercê de o navegador achar que a aba não precisa desenhar (uma aba em
    // segundo plano suspende rAF; o timer de tarefa, não).
    const kick = window.setTimeout(() => setShown(true), 0);

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
      window.clearTimeout(kick);
      window.removeEventListener("keydown", onKey);
      lockScroll(false);
      clearInert(inerted);
    };
  }, [onClose]);

  // O pedido de fechar (botão, Escape ou fundo) vira "closing" em FilmStage,
  // que mantém este componente montado pela duração da saída. Não é um
  // segundo estado espelhando a prop (isso é setState-em-effect, e o lint
  // reclama com razão): `open` só é verdadeiro quando já assentou E não está
  // saindo, então a mesma classe de CSS que fez a entrada roda ao contrário
  // no instante em que `closing` vira true — sem efeito nenhum no meio.
  const open = shown && !closing;

  // Custom properties, não inline style direto: a caixa de repouso (fechada)
  // é dinâmica (a do card clicado), mas a caixa aberta é sempre a tela
  // inteira — igual ao resto do módulo (--split, --cut-l...), o CSS decide
  // entre os dois estados via `[data-open]`, o JS só entrega o número.
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
      // O modal cobre a tela inteira com --color-ink-900, e o cursor
      // desenha em ink por padrao: preto sobre preto. "invert" e o mesmo
      // sinal que Characters, Now e o rodape ja usam para as secoes
      // escuras -- ver o `closest("[data-cursor-skin]")` de lib/useCursor.ts.
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
        className="film-dialog-close"
        data-cursor="Close"
        onClick={onClose}
      >
        <span aria-hidden className="film-dialog-x" />
        <span className="film-dialog-back">back</span>
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
