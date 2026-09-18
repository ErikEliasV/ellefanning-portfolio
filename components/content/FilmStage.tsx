"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { asset } from "@/lib/asset";
import { FilmDialog, type Origin } from "@/components/content/FilmDialog";
import type { Film } from "@/lib/films";
import { lastLockAt, trackVh } from "@/lib/filmStage";
import { isReduced, scrollTo } from "@/lib/scroll";
import { useFilmStage } from "@/lib/useFilmStage";
import "@/styles/pill.css";

// Espelha --duration-modal de styles/globals.css: a saída do modal precisa
// ficar montada exatamente por essa janela para a transição de CSS rodar
// até o fim antes do desmonte. Sob prefers-reduced-motion o token cai para
// 120ms — mesma fonte, os dois lados enxergam o mesmo número. A transição
// de fechar mais longa (texto/still saem, pôster encolhe, fundo esmaece)
// termina em 95% do orçamento (ver as fracoes em styles/filmography.css),
// então usar o próprio --duration-modal aqui, sem desconto, sobra folga.
const EXIT_MS = 900;
const EXIT_MS_REDUCED = 120;

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
  // "closing" mantém o FilmDialog montado durante a animação de saída — sem
  // ele o desmonte é imediato (commit seguinte) e não sobra tempo para o
  // pôster encolher de volta e o texto/still saírem. A abertura é o pôster
  // clicado crescendo até virar o fundo; fechar roda o mesmo movimento ao
  // contrário, e o card volta para a trava de onde saiu.
  const [closing, setClosing] = useState(false);
  // A caixa do card no instante do clique, em coordenadas de viewport — é
  // dali que o pôster cresce. Precisa ser `getBoundingClientRect()` do
  // PRÓPRIO clique (não recalculado depois), porque o scroll trava um
  // instante depois e o valor tem que ser o de antes da trava.
  const [origin, setOrigin] = useState<Origin | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const exitTimer = useRef(0);
  // Guarda se havia um modal aberto no render anterior, para o efeito de
  // refoco abaixo não disparar na montagem inicial (quando `open` já nasce
  // null e não há nada — nem card — para focar de volta).
  const wasOpen = useRef(false);

  function openFilm(index: number, event: MouseEvent<HTMLButtonElement>) {
    window.clearTimeout(exitTimer.current);
    trigger.current = event.currentTarget;
    const rect = event.currentTarget.getBoundingClientRect();
    setOrigin({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    setClosing(false);
    setOpen(index);
  }

  // Pedido de fechar (botão, Escape ou clique no fundo, todos chamam este
  // mesmo callback): só liga o estado de saída. Quem tira o FilmDialog do ar
  // é o efeito abaixo, depois da janela de animação — igual ao padrão de
  // `exit`/`EXIT_MS` que lib/useEditorialReel.ts já usa para o mesmo problema.
  //
  // useCallback (não uma função solta): FilmDialog usa esta referência como
  // dependência do efeito que trava o foco, marca `inert` e liga o scroll. Uma
  // identidade nova a cada render de FilmStage faria aquele efeito desmontar e
  // remontar à toa em qualquer re-render — inclusive um em que o próprio
  // desmonte de verdade já rodou a limpeza antes.
  const closeFilm = useCallback(() => setClosing(true), []);

  // Pular para o último filme é rolar até lá: o reel inteiro é função de `p`,
  // a posição de scroll em múltiplos de vh contados do topo da trilha, então
  // basta inverter essa conta. O vh sai da altura da própria trilha em vez de
  // ser medido de novo — `trackVh` é a mesma constante que a definiu, então os
  // dois lados não têm como discordar. Quem rola é o Lenis, pelo mesmo
  // `scrollTo` do voltar-ao-topo; um salto nativo passaria por baixo dele.
  const skipToLast = useCallback(() => {
    const trackEl = track.current;
    if (!trackEl) return;
    const reduced = isReduced();
    const vh = trackEl.offsetHeight / trackVh(reduced);
    const top = trackEl.getBoundingClientRect().top + window.scrollY;
    scrollTo(top + lastLockAt(reduced) * vh);
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

  // Devolve o foco ao card de origem quando o modal termina de sair. Reage à
  // própria transição de `open` para `null` na fase de commit do React — não
  // corre contra o desmonte (que já aconteceu antes deste efeito rodar) e não
  // deixa nenhum temporizador próprio para cancelar.
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

        {/* O rótulo é o "skip" do Figma; quem diz para onde é o aria-label. */}
        <button
          type="button"
          className="pill film-skip"
          data-cursor="Skip"
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
