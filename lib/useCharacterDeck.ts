"use client";

import { useEffect, useRef, useState } from "react";
import {
  NARROW_QUERY,
  cursor,
  deckGeometry,
  entryLockAt,
  pose,
  trackVh,
} from "@/lib/characterDeck";
import { isReduced, onTick } from "@/lib/scroll";
import { onViewport, smallViewportHeight } from "@/lib/viewport";

// Degraus de meio pixel no desfoque do pe. `backdrop-filter: blur()` cujo raio
// muda a cada quadro forca rerasterizacao; quantizado, o valor muda raramente
// em vez de sempre. Mesmo degrau que `depth()` aplica no arco do telefone, e
// pela mesma razao.
const HAZE_STEP = 0.5;

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
    // Declarada antes de paint() porque manda na composicao E no tempo: o
    // perfil estreito tem o arco, o ciclo mais curto e nenhuma rampa.
    const narrow = window.matchMedia(NARROW_QUERY);

    let vh = 0;
    let cardH = 0;

    // Tres leituras de layout, e so na medicao -- nunca por quadro.
    //
    // Aqui moravam mais quatro. O trilho antigo precisava saber onde a fileira
    // encostava na borda visivel, e tirava isso da caixa do <h2>: lia
    // `offsetLeft`/`offsetWidth` da palavra, `offsetLeft`/`offsetTop` do deck e
    // a altura do palco, e dali saiam `edge`, `fall` e o tamanho da rampa. Isso
    // acabou junto com o trilho. O monte para sozinho no terceiro slot, que e
    // uma constante de lib/characterDeck.ts, entao a altura da secao deixou de
    // depender da largura da janela e da metrica da fonte. Foi com essas quatro
    // leituras que saiu tambem o ResizeObserver que vigiava a palavra: ele
    // existia porque a primeira medicao pegava o <h2> com a fonte de reserva e
    // a fileira inteira ficava presa naquele numero. Sem ninguem medindo texto,
    // nao ha o que re-medir quando a webfont chega.
    function measure() {
      const trackEl = track.current;
      const deckEl = deck.current;
      if (!trackEl || !deckEl) return;

      vh = smallViewportHeight();
      // A ALTURA do card e a unidade de tudo no monte, porque e a unica medida
      // que nao muda em fase nenhuma: a largura projetada sai do giro, e a
      // caixa em si fica sempre do tamanho do hero.
      cardH = deckEl.offsetHeight;

      const phone = narrow.matches;
      const reduced = isReduced();

      trackEl.style.height = `${vh * trackVh(reduced, phone)}px`;
      // O alvo do link CHARACTERS do header, em px a partir do topo da trilha.
      // Ver `characterEntryTarget` em lib/useHeaderGlass.ts: ler a resposta
      // pronta e o que impede os dois lados de discordarem sobre qual vh vale.
      trackEl.dataset.entry = String(vh * entryLockAt(reduced, phone));
    }

    function paint() {
      const trackEl = track.current;
      const railEl = rail.current;
      if (!trackEl || !railEl || vh === 0) return;

      const reduced = isReduced();
      const phone = narrow.matches;
      const p = -trackEl.getBoundingClientRect().top / vh;
      const c = cursor(p, reduced, phone);

      const set = (name: string, value: string) =>
        trackEl.style.setProperty(name, value);

      // A ordem e a da coreografia, do primeiro tempo ao ultimo: a tinta, a
      // palavra entrando, o monte subindo, o monte saindo, a palavra saindo.
      set("--wipe", c.wipe.toFixed(4));
      set("--enter", c.enter.toFixed(4));
      set("--rise", c.rise.toFixed(4));
      set("--lift", c.lift.toFixed(4));
      set("--leave", c.leave.toFixed(4));
      set("--settle", c.settle.toFixed(4));
      set("--drift", c.drift.toFixed(3));

      const card = (i: number) => railEl.children[i] as HTMLElement | undefined;

      const k = deckGeometry(phone);
      // A perspectiva nao muda de card para card nem de quadro para quadro:
      // uma conta so, fora do laco.
      const persp = (k.persp * cardH).toFixed(0);

      for (let i = 0; i < count; i += 1) {
        const el = card(i);
        if (!el) continue;
        const q = pose(i - c.u, k);

        // A ORDEM e o assunto desta linha, e ela se le da direita para a
        // esquerda -- a ultima funcao e a primeira a ser aplicada.
        //
        //   rotateY     gira a carta em torno do proprio eixo vertical;
        //   perspective projeta esse giro, com o ponto de fuga no centro do
        //               PROPRIO card, que e o que faz o trapezio ser igual em
        //               qualquer x (ver o comentario de Z_TOP no modulo);
        //   scale       devolve a aresta de perto a altura do hero, porque no
        //               no os sete cards tem a mesma caixa;
        //   translate   leva o resultado ja projetado para o lugar dele.
        //
        // Trocar `translate` de lado poria cada foto descrevendo um arco em
        // volta do centro do palco em vez de girar onde esta; trocar `scale` de
        // lado o faria escalar a carta ANTES da projecao, e a compensacao
        // deixaria de compensar.
        el.style.transform =
          `translate(calc(-50% + ${(q.x * cardH).toFixed(2)}px), -50%)` +
          ` scale(${q.scale.toFixed(4)})` +
          ` perspective(${persp}px)` +
          ` rotateY(${q.turn.toFixed(3)}deg)`;

        el.style.zIndex = String(q.z);

        // O raio do desfoque do pe. Quantizado porque `filter: blur()` cujo
        // raio muda a cada quadro forca rerasterizacao -- e note que ele so
        // muda enquanto |offset| < 1: passado o primeiro slot `pose()` devolve
        // o maximo e nao mexe mais. Na pratica sao os dois cards em transito
        // que recalculam, e os outros seis ficam parados.
        const haze = Math.round((q.haze * cardH) / HAZE_STEP) * HAZE_STEP;
        el.style.setProperty("--haze", `${haze}px`);
        // Muda tres vezes no percurso inteiro (-1, 0, 1). Quem le e a sombra,
        // que aponta para o centro dos dois lados, como no no.
        el.style.setProperty("--side", String(q.side));
        el.style.setProperty("--shade", q.shade.toFixed(4));
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

    // E `onViewport` tambem nao basta, porque ele so escuta a JANELA. `cardH` e
    // a unidade de TODA a geometria do monte -- posicao, perspectiva e desfoque
    // saem multiplicados por ela -- e a caixa do deck pode mudar de tamanho sem
    // a janela mudar: uma barra de rolagem que aparece, o `svh` se acomodando
    // quando a barra do navegador recolhe, um `--card-h` trocado a quente. Foi
    // exatamente assim que isto apareceu: o CSS passou o card de 532 para 649
    // por HMR, `measure()` nao rodou, e a fileira inteira ficou 18% curta com o
    // palco pintando normalmente -- nenhum erro, so a composicao errada.
    //
    // Nao ha laco: o que `measure()` escreve e a altura da TRILHA, e a caixa do
    // deck sai de vw e svh, que a altura da trilha nao move.
    const watchDeck = new ResizeObserver(() => {
      measure();
      paint();
    });
    if (deck.current) watchDeck.observe(deck.current);

    return () => {
      untick();
      unwatch();
      watchDeck.disconnect();
    };
  }, [count]);

  return { track, deck, rail, active };
}
