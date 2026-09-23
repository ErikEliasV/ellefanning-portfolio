"use client";

import { useEffect, useRef, useState } from "react";
import {
  NARROW_QUERY,
  cursor,
  depth,
  geometry,
  trackVh,
} from "@/lib/characterDeck";
import { isReduced, onTick } from "@/lib/scroll";
import { onViewport, smallViewportHeight } from "@/lib/viewport";

export function useCharacterDeck(count: number) {
  const track = useRef<HTMLDivElement>(null);
  const deck = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);

  const [active, setActive] = useState(0);
  // Guarda o ultimo valor escrito para o setState so disparar na troca. Um
  // render da secao por quadro a 60/s e o que este ref evita -- mesma decisao
  // que lib/useFilmStage.ts toma para o contador dele.
  const lastActive = useRef(0);

  useEffect(() => {
    // Declarada antes de paint() porque manda na geometria E no tempo: o perfil
    // estreito tem o leque mais apertado e o ciclo mais curto.
    const narrow = window.matchMedia(NARROW_QUERY);

    let vh = 0;
    let cardW = 0;

    function measure() {
      const trackEl = track.current;
      const deckEl = deck.current;
      if (!trackEl || !deckEl) return;
      vh = smallViewportHeight();
      trackEl.style.height = `${vh * trackVh(isReduced(), narrow.matches)}px`;
      // A caixa do deck E a caixa do card central, e os slots sao medidos em
      // larguras dela. Uma leitura de layout por medicao, nunca por quadro.
      cardW = deckEl.offsetWidth;
    }

    function paint() {
      const trackEl = track.current;
      const railEl = rail.current;
      if (!trackEl || !railEl || vh === 0) return;

      const reduced = isReduced();
      const g = geometry(narrow.matches);
      const p = -trackEl.getBoundingClientRect().top / vh;
      const c = cursor(p, reduced, narrow.matches);

      const set = (name: string, value: string) =>
        trackEl.style.setProperty(name, value);

      set("--enter", c.enter.toFixed(4));
      set("--leave", c.leave.toFixed(4));
      set("--floor", c.floor.toFixed(4));
      set("--settle", c.settle.toFixed(4));
      set("--drift", c.drift.toFixed(3));

      for (let i = 0; i < count; i += 1) {
        const card = railEl.children[i] as HTMLElement | undefined;
        if (!card) continue;

        const d = depth(i, c.u, g);

        // Fora da janela de render o card nao e desenhado. `live` e funcao pura
        // de `u`, entao isto desfaz sozinho subindo a pagina.
        if (!d.live) {
          card.style.visibility = "hidden";
          continue;
        }

        card.style.visibility = "visible";
        // A largura em px e a altura em porcentagem do trilho: e a largura que
        // faz o card abrir, e e por ela que a foto recorta de novo. Ver o
        // comentario em depth() sobre por que nao e um scaleX.
        card.style.width = `${(d.width * cardW).toFixed(2)}px`;
        card.style.height = `${(d.height * 100).toFixed(2)}%`;
        card.style.transform =
          `translate(calc(-50% + ${(d.x * cardW).toFixed(2)}px), -50%)`;
        card.style.zIndex = String(d.z);
        card.style.setProperty("--dim", d.dim.toFixed(4));
        card.style.setProperty("--mirror", d.mirror.toFixed(4));
      }

      if (c.active !== lastActive.current) {
        lastActive.current = c.active;
        setActive(c.active);
      }
    }

    measure();
    paint();

    const untick = onTick(paint);
    // Remedir sozinho nao basta: o card muda de tamanho junto com a tela, e o
    // quadro seguinte so chegaria com as medidas velhas ja pintadas.
    const unwatch = onViewport(() => {
      measure();
      paint();
    });

    return () => {
      untick();
      unwatch();
    };
  }, [count]);

  return { track, deck, rail, active };
}
