"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import {
  NARROW_QUERY,
  SPIN_REST,
  carousel,
  deckGeometry,
  entryLockAt,
  pose,
  release,
  rubber,
  spin,
  stage,
  trackVh,
  wrap,
  type Spin,
} from "@/lib/characterDeck";
import { isReduced, onTick } from "@/lib/scroll";
import { swipe as bindSwipe } from "@/lib/swipe";
import { onViewport, smallViewportHeight } from "@/lib/viewport";

// Degraus de meio pixel no desfoque do pe. `backdrop-filter: blur()` cujo raio
// muda a cada quadro forca rerasterizacao; quantizado, o valor muda raramente
// em vez de sempre. Mesmo degrau que `depth()` aplica no arco do telefone, e
// pela mesma razao.
const HAZE_STEP = 0.5;

// O maior passo que o relogio do carrossel aceita num quadro, em ms. Uma aba
// que volta do fundo entrega um intervalo de minutos no primeiro quadro, e sem
// o teto a travessia em curso terminaria num salto, de um quadro para o outro.
const SPIN_STEP_MAX = 100;

// O assentamento do deck do telefone depois da soltura. power3.out sai rapido e
// pousa devagar, que e o que continua um peteleco sem tranco.
const SNAP_S = 0.55;
const SNAP_EASE = "power3.out";

// `paused` e a pausa que vem de fora -- o modal aberto, que o palco conhece e o
// hook nao. As outras duas (mouse na foto do centro, foco de teclado num card)
// o hook escuta sozinho.
export function useCharacterDeck(count: number, paused: boolean) {
  const track = useRef<HTMLDivElement>(null);
  const deck = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);

  const [active, setActive] = useState(0);
  // Guarda o ultimo valor escrito para o setState so disparar na troca. Um
  // render da secao por quadro a 60/s e o que este ref evita -- mesma decisao
  // que lib/useFilmStage.ts toma para o contador dele.
  const lastActive = useRef(0);

  // O relogio do carrossel do PC e as tres razoes para ele esperar. Em refs,
  // porque o loop de pintura le tudo a cada quadro e nada disso renderiza.
  const clock = useRef<Spin>(SPIN_REST);
  const hold = useRef({ hover: false, focus: false, paused: false });
  // A posicao do deck do telefone, que o dedo arrasta e o gsap assenta. Num
  // ref fora do efeito para sobreviver a uma remontagem dele.
  const swipe = useRef({ u: 0 });

  // Espelhado num efeito, e nao no corpo do componente, porque escrever em ref
  // durante o render e leitura suja de estado concorrente.
  useEffect(() => {
    hold.current.paused = paused;
  }, [paused]);

  useEffect(() => {
    // Declarada antes de paint() porque manda na composicao E em quem move as
    // fotos: o relogio no perfil largo, o dedo no estreito.
    const narrow = window.matchMedia(NARROW_QUERY);
    const deckPos = swipe.current;

    let vh = 0;
    let cardH = 0;
    // Quantos px de dedo andam um slot no telefone: `reach` alturas de card, o
    // quanto a foto do centro anda ate o primeiro slot -- no fim de cada slot
    // ela esta exatamente embaixo do dedo.
    let slotPx = 1;

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

      slotPx = deckGeometry(true).reach * cardH || 1;

      trackEl.style.height = `${vh * trackVh()}px`;
      // O alvo do link CHARACTERS do header, em px a partir do topo da trilha.
      // Ver `characterEntryTarget` em lib/useHeaderGlass.ts: ler a resposta
      // pronta e o que impede os dois lados de discordarem sobre qual vh vale.
      trackEl.dataset.entry = String(vh * entryLockAt());
    }

    // O instante do ultimo quadro do onTick, para o relogio do carrossel saber
    // quanto tempo passou. As pinturas avulsas da medicao nao o tocam.
    let last = 0;

    function paint(now?: number) {
      const trackEl = track.current;
      const railEl = rail.current;
      if (!trackEl || !railEl || vh === 0) return;

      const reduced = isReduced();
      const phone = narrow.matches;
      const p = -trackEl.getBoundingClientRect().top / vh;
      // O scroll so faz a moldura; quem passa as fotos e o dedo no telefone e o
      // relogio no PC (ver "O tempo" em lib/characterDeck.ts).
      const c = phone ? stage(p, deckPos.u) : carousel(p, clock.current);

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
        // No carrossel o `u` cresce sem limite, e o embrulho e o loop: a foto
        // que afunda no monte da esquerda renasce no fundo do da direita. O
        // deck do telefone tem pontas, e nao embrulha.
        const q = pose(phone ? i - c.u : wrap(i - c.u), k);

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

      // O relogio anda depois da pintura, e so com o deck em cena: fora dela o
      // carrossel espera onde parou, e quem volta a secao o encontra ali.
      if (now === undefined) return;
      const ms = last ? Math.min(now - last, SPIN_STEP_MAX) : 0;
      last = now;
      if (phone || c.rise <= 0 || c.lift >= 1) return;

      const { hover, focus, paused: shut } = hold.current;
      clock.current = spin(clock.current, ms, hover || focus || shut, reduced);
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

    // A pausa do mouse, lida pela GEOMETRIA e nao pelo alvo do evento: o
    // carrossel move as fotos por baixo de um ponteiro parado, e nenhum
    // pointerenter dispara quando e a foto que chega. Na trava, a foto do
    // centro e exatamente a caixa do deck -- escala 1, giro 0, x 0 --, entao a
    // pergunta e se o ponteiro esta dentro dela. Os laterais sao filhos do deck
    // e borbulham ate aqui, e la fora a conta da falso por conta propria.
    const deckEl = deck.current;
    const railEl = rail.current;

    const aim = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !deckEl) return;
      const box = deckEl.getBoundingClientRect();
      hold.current.hover =
        event.clientX >= box.left &&
        event.clientX <= box.right &&
        event.clientY >= box.top &&
        event.clientY <= box.bottom;
    };

    const away = () => {
      hold.current.hover = false;
    };

    // E a do teclado: so o foco VISIVEL segura. O clique tambem foca o botao, e
    // o modal devolve o foco ao card ao fechar; se isso contasse, o carrossel
    // ficaria parado ate alguem clicar em outro lugar.
    //
    // No telefone o mesmo foco visivel traz a personagem para o centro: sem
    // scroll passando as fotos, o Tab e o unico jeito de o teclado andar pelo
    // deck. O toque tambem foca o botao no Chrome do Android, mas sem
    // :focus-visible, entao tocar num card lateral abre ele sem arrastar o deck.
    const focusIn = (event: FocusEvent) => {
      const target = event.target;
      const visible =
        target instanceof Element && target.matches(":focus-visible");
      hold.current.focus = visible;
      if (!visible || !narrow.matches || !railEl) return;
      const index = Array.prototype.indexOf.call(railEl.children, target);
      if (index >= 0) settleOn(index);
    };

    const focusOut = () => {
      hold.current.focus = false;
    };

    // O ARRASTO do telefone: o dedo de lado passa as fotos, a pedido do dono do
    // projeto, no lugar do scroll que as passava. O dedo na vertical continua
    // rolando a pagina -- e o `touch-action: pan-y` do deck no CSS que entrega
    // ao navegador o gesto vertical e a este codigo so o horizontal.
    //
    // Enquanto o dedo arrasta, a posicao e a do dedo, com o elastico nas pontas
    // (`rubber`); na soltura, `release` escolhe a foto e o gsap assenta nela. O
    // que e toque e o que e arrasto quem decide e lib/swipe.ts.
    function settleOn(target: number) {
      gsap.killTweensOf(deckPos);
      if (isReduced()) {
        deckPos.u = target;
        return;
      }
      gsap.to(deckPos, { u: target, duration: SNAP_S, ease: SNAP_EASE });
    }

    // O dedo em px vira `u` em slots: um slot por `slotPx`, e para a frente
    // (u crescendo) e o dedo indo para a ESQUERDA, dai o sinal trocado.
    let from = 0;
    let raw = 0;
    const unswipe = deckEl
      ? bindSwipe(deckEl, {
          can: () => narrow.matches && !hold.current.paused,
          // Pega o deck onde ele estiver, mesmo no meio de um assentamento.
          start: () => {
            gsap.killTweensOf(deckPos);
            from = deckPos.u;
            raw = from;
          },
          move: (dx) => {
            raw = from - dx / slotPx;
            deckPos.u = rubber(raw);
          },
          end: (velocity) => settleOn(release(raw, -velocity / slotPx)),
        })
      : () => {};

    deckEl?.addEventListener("pointermove", aim, { passive: true });
    deckEl?.addEventListener("pointerleave", away, { passive: true });
    railEl?.addEventListener("focusin", focusIn);
    railEl?.addEventListener("focusout", focusOut);

    return () => {
      untick();
      unwatch();
      watchDeck.disconnect();
      gsap.killTweensOf(deckPos);
      deckEl?.removeEventListener("pointermove", aim);
      deckEl?.removeEventListener("pointerleave", away);
      unswipe();
      railEl?.removeEventListener("focusin", focusIn);
      railEl?.removeEventListener("focusout", focusOut);
    };
  }, [count]);

  return { track, deck, rail, active };
}
