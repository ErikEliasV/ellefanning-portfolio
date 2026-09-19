"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

import { isLocked, scrollTo } from "@/lib/scroll";

// A pagina passa de 20.000px, entao a altura proporcional do polegar daria uns
// 38px e ele leria como um ponto perdido na borda. Este piso e quem manda na
// pratica aqui: o proporcional so volta a valer se a pagina encolher muito.
const MIN_THUMB = 120;

function clamp01(x: number) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

export function useScrollbar() {
  const rail = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLSpanElement>(null);

  const [live, setLive] = useState(false);
  const [drag, setDrag] = useState(false);

  // Num ref, e nao em estado: o arrasto le os dois a cada pointermove e nada
  // renderiza a partir deles.
  const span = useRef({ max: 0, travel: 0 });
  // A distancia entre o topo do polegar e onde o ponteiro o pegou. Sem isso o
  // polegar salta para centralizar no cursor no primeiro movimento.
  const grab = useRef(0);

  const paint = useCallback(() => {
    const railEl = rail.current;
    const thumbEl = thumb.current;
    if (!railEl || !thumbEl) return;

    const doc = document.documentElement;
    const view = window.innerHeight;
    const max = doc.scrollHeight - view;

    // Com a tela travada por um modal nao ha o que rolar, e a barra ficaria
    // por cima de overlays que vivem em contextos de empilhamento proprios
    // (o lightbox do editorial nao passa de z-index 25 dentro da secao).
    if (max <= 1 || isLocked()) {
      setLive(false);
      return;
    }
    setLive(true);

    const track = railEl.clientHeight;
    const height = Math.max(MIN_THUMB, Math.round(track * (view / doc.scrollHeight)));
    const travel = Math.max(track - height, 0);
    span.current = { max, travel };

    thumbEl.style.height = `${height}px`;
    // clamp porque o overscroll elastico (trackpad, iOS) devolve scrollY fora
    // de [0, max] e o polegar sairia do trilho.
    thumbEl.style.transform = `translate3d(0, ${Math.round(travel * clamp01(window.scrollY / max))}px, 0)`;
  }, []);

  useEffect(() => {
    // Fora do corpo do efeito: paint() chama setState, e faze-lo de forma
    // sincrona aqui encadeia um render extra (o lint reclama com razao).
    // setTimeout e nao rAF pelo mesmo motivo de components/content/FilmDialog:
    // aba em segundo plano suspende rAF, tarefa agendada nao. O ResizeObserver
    // logo abaixo tambem dispara uma vez ao observar, entao a primeira medida
    // esta coberta duas vezes -- e paint() e idempotente.
    const first = window.setTimeout(paint, 0);

    window.addEventListener("scroll", paint, { passive: true });
    window.addEventListener("resize", paint);

    // A altura do documento muda sozinha enquanto imagens e fontes chegam, e
    // as trilhas da filmografia/editorial sao dimensionadas por JS depois do
    // primeiro paint.
    const sizer = new ResizeObserver(paint);
    sizer.observe(document.documentElement);

    // lockScroll() mexe em documentElement.style.overflow, e nao existe evento
    // para isso -- observar o atributo e o que avisa a barra para sumir.
    const watch = new MutationObserver(paint);
    watch.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style"],
    });

    return () => {
      window.clearTimeout(first);
      window.removeEventListener("scroll", paint);
      window.removeEventListener("resize", paint);
      sizer.disconnect();
      watch.disconnect();
    };
  }, [paint]);

  const ride = useCallback((clientY: number) => {
    const railEl = rail.current;
    if (!railEl) return;

    const { max, travel } = span.current;
    if (travel <= 0) return;

    const top = railEl.getBoundingClientRect().top;
    const p = clamp01((clientY - top - grab.current) / travel);
    // immediate: o polegar tem de acompanhar o ponteiro 1:1. Deixar o Lenis
    // suavizar aqui faria a barra correr atras da propria mao.
    scrollTo(p * max, { immediate: true });
  }, []);

  const onThumbDown = useCallback(
    (event: ReactPointerEvent<HTMLSpanElement>) => {
      const thumbEl = thumb.current;
      if (!thumbEl || event.button !== 0) return;

      event.preventDefault();
      thumbEl.setPointerCapture(event.pointerId);
      grab.current = event.clientY - thumbEl.getBoundingClientRect().top;
      setDrag(true);
    },
    [],
  );

  const onThumbMove = useCallback(
    (event: ReactPointerEvent<HTMLSpanElement>) => {
      const thumbEl = thumb.current;
      if (!thumbEl?.hasPointerCapture(event.pointerId)) return;
      ride(event.clientY);
    },
    [ride],
  );

  const onThumbUp = useCallback((event: ReactPointerEvent<HTMLSpanElement>) => {
    const thumbEl = thumb.current;
    if (thumbEl?.hasPointerCapture(event.pointerId)) {
      thumbEl.releasePointerCapture(event.pointerId);
    }
    setDrag(false);
  }, []);

  // Clique no trilho: o polegar vai para onde se clicou, centrado ali, como
  // faz a barra nativa quando se clica fora dela.
  const onRailDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.target === thumb.current || event.button !== 0) return;

      const thumbEl = thumb.current;
      grab.current = thumbEl ? thumbEl.offsetHeight / 2 : 0;
      ride(event.clientY);
    },
    [ride],
  );

  return { rail, thumb, live, drag, onThumbDown, onThumbMove, onThumbUp, onRailDown };
}
