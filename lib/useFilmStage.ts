"use client";

import { useEffect, useRef, useState } from "react";
import { NARROW_QUERY, cursor, depth, geometry, trackVh } from "@/lib/filmStage";
import { isReduced, onTick } from "@/lib/scroll";
import { reelTick } from "@/lib/audio";

export function useFilmStage(count: number) {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const cut = useRef<HTMLDivElement>(null);
  const curtain = useRef<HTMLSpanElement>(null);

  const [active, setActive] = useState(0);
  const [lock, setLock] = useState(0);

  const lastLock = useRef(0);
  // `lastLock` guarda o último valor de c.lock, inclusive -1, e é o que evita
  // redisparo por frame. A direção do tranco precisa de outra coisa: o último
  // índice de fato travado. Em scroll contínuo o cursor passa por -1 entre uma
  // trava e a seguinte, então usar `lastLock` para a direção comparava sempre
  // contra -1 e o tranco nunca invertia.
  const lastIndex = useRef(-1);
  // Só existe um kick em voo por vez — o estalo dispara na troca de trava, e a
  // troca é única — então um ref basta para guardar o timer pendente. Sem ele,
  // se o mesmo card travasse de novo antes dos 120ms, o timeout velho apagaria
  // o atributo que pertence à trava nova, cortando a animação no meio.
  const kickTimer = useRef(0);

  useEffect(() => {
    let vh = 0;
    let pitch = 0;
    let cardW = 0;
    let splitMax = 0;

    function paint() {
      const trackEl = track.current;
      const stageEl = stage.current;
      const railEl = rail.current;
      if (!trackEl || !stageEl || !railEl || vh === 0) return;

      const reduced = isReduced();
      const p = -trackEl.getBoundingClientRect().top / vh;
      const c = cursor(p, reduced);

      const set = (name: string, value: string) =>
        trackEl.style.setProperty(name, value);

      const splitPx = c.split * splitMax;

      set("--curtain", c.curtain.toFixed(4));
      set("--rise", c.rise.toFixed(4));
      set("--split", `${splitPx.toFixed(2)}px`);
      set("--fall", c.fall.toFixed(4));

      // A cortina serve só à entrada, cobrindo a hero enquanto o palco não chegou. Um
      // instante depois disso ela precisa sair do caminho, senão o z-index 60 dela
      // fica acima do contexto isolado do palco e apaga a seção inteira.
      //
      // O limiar de 0.05 não tem 0.4vh de colchão, mesmo `--curtain` saturando em
      // p = -0.35: entre -0.35 e 0 quem cobre a tela ainda é só a cortina, porque o
      // palco sticky só trava no topo — e passa a cobrir o viewport inteiro — em
      // p = 0. A folga real, entre "o palco já cobre" e "a cortina sai", é de 0.05vh
      // contados a partir de p = 0, não de -0.35. Mexer no limiar, na posição do
      // palco dentro de .film-track ou nas fases precisa contar a partir daí, senão
      // volta o bug que esta tarefa corrigiu. E isso vale em qualquer modo: p = 0 é
      // geométrico (`-trackTop / vh`), phases() não muda onde o palco gruda.
      const curtainEl = curtain.current;
      if (curtainEl) {
        if (p < 0.05) curtainEl.dataset.on = "";
        else delete curtainEl.dataset.on;
      }

      for (let i = 0; i < count; i += 1) {
        const card = railEl.children[i] as HTMLElement | undefined;
        if (!card) continue;

        const d = depth(i, c.u);
        if (!d.live) {
          card.style.visibility = "hidden";
          continue;
        }

        // O primeiro pôster sobe pelo vão que a palavra acabou de abrir. São
        // 120% da própria altura, não 100%: o card é centrado na tela, então
        // empurrá-lo só uma altura deixaria o topo dele aparecendo na borda de
        // baixo antes da hora.
        const lift = i === 0 ? (1 - c.enter) * 120 : 0;

        card.style.visibility = "visible";
        card.style.transform =
          `translate3d(${(d.offset * pitch).toFixed(2)}px, ${lift.toFixed(2)}%, 0)` +
          ` scale(${d.scale.toFixed(4)})`;
        card.style.filter = reduced || d.blur < 0.1 ? "" : `blur(${d.blur.toFixed(2)}px)`;
      }

      // FILMO branca só aparece onde há pôster atrás dela. O recorte segue a caixa do
      // card mais próximo — ao passo de 48vw nunca há dois sobre a palavra ao mesmo
      // tempo, então "o mais próximo" é exato, não aproximação. As bordas saem da
      // matemática, nunca de getBoundingClientRect: custo zero por frame.
      const cutEl = cut.current;
      if (cutEl) {
        const box = cutEl.getBoundingClientRect();
        // window.innerWidth inclui a calha da barra de rolagem
        // (scrollbar-gutter: stable), então não é o centro real do palco. A
        // borda direita da própria caixa já é `centroDoPalco - split` (é como
        // .film-word-cut é posicionada em CSS: `right: calc(50% + var(--split))`),
        // então o centro sai dela mesma, sem nova leitura de layout.
        const mid = box.right + splitPx;

        let near = 0;
        let best = Infinity;
        for (let i = 0; i < count; i += 1) {
          const gap = Math.abs(i - c.u);
          if (gap < best) { best = gap; near = i; }
        }

        const d = depth(near, c.u);
        const half = (cardW * d.scale) / 2;
        const cx = mid + d.offset * pitch;

        const l = Math.min(Math.max(cx - half - box.left, 0), box.width);
        const r = Math.min(Math.max(box.right - (cx + half), 0), box.width);

        set("--cut-l", `${l.toFixed(2)}px`);
        set("--cut-r", `${r.toFixed(2)}px`);
      }

      if (c.lock !== lastLock.current) {
        // O único beat que não é posição. Fora da matemática de scroll de propósito: se
        // o overshoot fosse scrubbado, rolar devagar o esticaria por segundos e ele
        // deixaria de ser seco — e o som, de duração fixa, dessincronizaria.
        if (c.lock >= 0) {
          reelTick(c.lock, c.lock / (count - 1));
          const card = rail.current?.children[c.lock] as HTMLElement | undefined;
          if (card && !isReduced()) {
            // Na primeira trava da seção não há índice anterior: lastIndex
            // ainda é -1, e não existe "direção" para trás disso.
            const back = lastIndex.current >= 0 && c.lock < lastIndex.current;
            card.dataset.kick = back ? "-" : "+";
            window.clearTimeout(kickTimer.current);
            kickTimer.current = window.setTimeout(() => { delete card.dataset.kick; }, 120);
          }
          lastIndex.current = c.lock;
        }

        lastLock.current = c.lock;
        setLock(c.lock);
        // O contador e o ano trocam em corte duro, no instante da trava, e
        // seguram o último valor enquanto o próximo está em trânsito.
        if (c.lock >= 0) setActive(c.lock);
      }
    }

    const narrow = window.matchMedia(NARROW_QUERY);

    function measure() {
      const trackEl = track.current;
      if (!trackEl) return;

      const vw = window.innerWidth;
      const g = geometry(narrow.matches);

      vh = window.innerHeight;
      pitch = g.pitchVw * vw;
      cardW = g.widthVw * vw;
      splitMax = g.splitVw * vw;

      trackEl.style.setProperty("--card-w", `${cardW.toFixed(2)}px`);
      trackEl.style.setProperty("--card-h", `${(cardW * g.ratio).toFixed(2)}px`);
      trackEl.style.height = `${vh * trackVh(isReduced())}px`;
      paint();
    }

    measure();
    const untick = onTick(paint);
    window.addEventListener("resize", measure);
    narrow.addEventListener("change", measure);

    return () => {
      untick();
      window.removeEventListener("resize", measure);
      narrow.removeEventListener("change", measure);
      window.clearTimeout(kickTimer.current);
    };
  }, [count]);

  return { track, stage, rail, cut, curtain, active, lock };
}
