"use client";

import gsap from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  reelRelease,
  reelRubber,
  reelStops,
  sense,
  type Motion,
} from "@/lib/motion/editorialMotion";
import { isReduced, lockScroll, onTick } from "@/lib/scroll";
import { swipe as bindSwipe } from "@/lib/swipe";
import { onViewport, smallViewportHeight } from "@/lib/viewport";

const CELL_VW = 0.3;
const CELL_HOVER_VW = 0.7;
const CELL_VW_NARROW = 0.8;
const NARROW_MAX = 760;
const PAN_FACTOR = 0.42;
const PAN_MIN_VH = 1.2;
const PAN_MAX_VH = 2;

// O reel arrastado do telefone (ate NARROW_MAX, o mesmo corte das fotos de
// 80vw): ate onde o elastico deixa passar das pontas, em fracao da largura da
// tela, e o assentamento depois da soltura -- o mesmo par do deck de
// Characters, para os dois gestos lerem igual.
const RUBBER_VW = 0.15;
const SNAP_S = 0.55;
const SNAP_EASE = "power3.out";

// Quanto de gesto cada quadro da galeria pede. E distancia virtual, nao altura
// de documento: a foto aberta trava a pagina e o gesto alimenta so a galeria.
// Por isso pode ser bem mais curta do que quando era scroll de verdade.
const STEP_VH = 0.28;
const STEP_MIN = 200;

const EXIT_MS = 780;
const READ_S = 0.5;
const READ_EASE = "power2";
// Folga nas duas pontas, para um tranco de trackpad no fim nao fechar sozinho.
const SHUT_SLACK = 0.08;
// deltaMode 1 vem em linhas e 2 em paginas; so o 0 ja e pixel.
const LINE_PX = 16;

function clamp01(value: number) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function fitTitle(title: HTMLElement | null, year: HTMLElement | null) {
  const row = title?.parentElement;
  if (!title || !row || !year) return;
  title.style.width = "auto";
  const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
  const room = Math.max(0, row.clientWidth - year.offsetWidth - gap);
  const natural = title.scrollWidth;
  if (!natural || !room) return;
  const fit = Math.min(1, room / natural);
  title.style.width = `${Math.min(natural, room).toFixed(2)}px`;
  title.style.setProperty("--title-fit", fit.toFixed(4));
}

export function useEditorialReel(frames: readonly number[]) {
  const count = frames.length;

  const track = useRef<HTMLDivElement>(null);
  const pin = useRef<HTMLElement>(null);
  const capWrap = useRef<HTMLDivElement>(null);
  const capBlock = useRef<HTMLDivElement>(null);
  const capTitle = useRef<HTMLParagraphElement>(null);
  const capYear = useRef<HTMLSpanElement>(null);

  const [active, setActive] = useState<number | null>(null);
  const [shown, setShown] = useState(0);
  const [armed, setArmed] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const activeRef = useRef<number | null>(null);
  const armedRef = useRef(false);
  const geometry = useRef({
    cell: 1,
    panMax: 0,
    panScroll: 1,
    step: 1,
    view: 0,
    width: 0,
    swipe: false,
    stops: [0],
  });
  const exit = useRef(0);
  // Quanto o reel do telefone andou, em px: o dedo arrasta, o gsap assenta, e
  // `progress()` escreve como `--q`. Num ref fora do efeito para sobreviver a
  // uma remontagem dele.
  const pan = useRef({ x: 0 });

  // A leitura da galeria: alvo cru vindo do gesto, e o valor suavizado que vai
  // para o CSS. Nada disso toca a altura do documento.
  const aim = useRef(0);
  const read = useRef({ at: 0 });

  const readFor = useCallback(
    (index: number | null) =>
      geometry.current.step * (index === null ? 1 : frames[index] || 1),
    [frames],
  );

  const close = useCallback(() => {
    if (activeRef.current === null) return;
    activeRef.current = null;
    setActive(null);
    setLeaving(true);
    window.clearTimeout(exit.current);
    exit.current = window.setTimeout(() => setLeaving(false), EXIT_MS);
  }, []);

  const open = useCallback(
    (index: number) => {
      if (activeRef.current !== null) {
        close();
        return;
      }
      activeRef.current = index;
      gsap.killTweensOf(read.current);
      aim.current = 0;
      read.current.at = 0;
      track.current?.style.setProperty("--c", "0");
      window.clearTimeout(exit.current);
      setLeaving(false);
      setActive(index);
      setShown(index);
    },
    [close],
  );

  // Enquanto uma foto esta aberta a pagina fica travada de verdade e o gesto
  // alimenta a galeria. Nenhum pixel de scroll e consumido, entao nao ha o que
  // devolver no fechamento.
  useEffect(() => {
    if (active === null) return;

    lockScroll(true);

    // Copiado para uma variavel local: o objeto do ref e sempre o mesmo, mas
    // a limpeza nao deve reler o ref para saber o que matar.
    const dial = read.current;
    const toRead = gsap.quickTo(dial, "at", {
      duration: READ_S,
      ease: READ_EASE,
    });

    function feed(delta: number) {
      const span = readFor(activeRef.current);
      if (!span) return;

      aim.current += delta / span;

      if (aim.current > 1 + SHUT_SLACK || aim.current < -SHUT_SLACK) {
        close();
        return;
      }

      toRead(clamp01(aim.current));
    }

    function onWheel(event: WheelEvent) {
      event.preventDefault();
      const unit =
        event.deltaMode === 1
          ? LINE_PX
          : event.deltaMode === 2
            ? geometry.current.view
            : 1;
      feed(event.deltaY * unit);
    }

    let touch = 0;

    function onTouchStart(event: TouchEvent) {
      touch = event.touches[0]?.clientY ?? 0;
    }

    function onTouchMove(event: TouchEvent) {
      event.preventDefault();
      const y = event.touches[0]?.clientY ?? touch;
      feed(touch - y);
      touch = y;
    }

    // Nao passivos de proposito: sao eles que impedem a pagina de andar.
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      lockScroll(false);
      gsap.killTweensOf(dial);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [active, close, readFor]);

  useEffect(() => {
    const trackNode = track.current;
    if (!trackNode) return;

    let motion: Motion | null = null;
    const reel = pan.current;

    function progress() {
      const node = track.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();

      // The pin used to learn it was moving from the scroll event itself; on a
      // shared tick it has to notice the movement on its own.
      //
      // `data-scrolling` bloqueia o crescimento no hover (ver
      // styles/editorial.css), e o que decide se a pagina esta rolando e a
      // velocidade com histerese de lib/editorialMotion.ts. As duas versoes que
      // moravam aqui -- comparacao exata, depois meio pixel acumulado com timer
      // -- erravam no rastro do Lenis, e a segunda fazia a foto sob o ponteiro
      // expandir, encolher e expandir de novo; o porque esta la.
      const pinNode = pin.current;
      if (pinNode) {
        const was = motion?.moving ?? false;
        motion = sense(motion, rect.top, performance.now());
        if (motion.moving !== was) {
          pinNode.toggleAttribute("data-scrolling", motion.moving);
        }
      }

      if (!armedRef.current && rect.top < window.innerHeight * 2) {
        armedRef.current = true;
        setArmed(true);
      }

      const { panScroll, panMax, swipe } = geometry.current;
      const style = node.style;

      // `--q` e a fracao do percurso do reel. No PC vem da rolagem; no telefone
      // vem do dedo, e pode passar um pouco de 0 e de 1 -- e o elastico das
      // pontas, que o CSS desenha sem saber.
      const q = swipe
        ? panMax > 0
          ? reel.x / panMax
          : 0
        : clamp01(-rect.top / panScroll);
      style.setProperty("--q", q.toFixed(4));
      style.setProperty("--c", read.current.at.toFixed(4));
    }

    function measure() {
      const node = track.current;
      if (!node) return;
      const vw = document.documentElement.clientWidth;
      const vh = smallViewportHeight();
      if (!vw || !vh) return;

      // No telefone a rolagem nao passa mais as fotos, a pedido do dono do
      // projeto: o reel anda com o dedo, e a secao vira uma tela so, que a
      // pagina atravessa como qualquer outra. Sem percurso de scroll, nao ha o
      // que prender.
      const swipe = vw <= NARROW_MAX;
      const cell = (swipe ? CELL_VW_NARROW : CELL_VW) * vw;
      const panMax = Math.max(0, count * cell - vw);
      const panScroll = swipe
        ? 0
        : Math.min(
            Math.max(panMax * PAN_FACTOR, PAN_MIN_VH * vh),
            PAN_MAX_VH * vh,
          );
      geometry.current = {
        cell,
        panMax,
        panScroll,
        step: Math.max(STEP_VH * vh, STEP_MIN),
        view: vh,
        width: vw,
        swipe,
        stops: reelStops(count, cell, vw, panMax),
      };
      // A tela girou ou encolheu: o reel nao pode ficar parado alem do fim
      // novo.
      reel.x = Math.min(Math.max(reel.x, 0), panMax);
      pin.current?.toggleAttribute("data-swipe", swipe);

      const hover = Math.max(CELL_HOVER_VW * vw, cell);
      const rest =
        count > 1
          ? Math.max((count * cell - hover) / (count - 1), cell * 0.4)
          : cell;

      const style = node.style;
      style.setProperty("--cell-w", `${cell.toFixed(2)}px`);
      style.setProperty("--cell-hover", `${hover.toFixed(2)}px`);
      style.setProperty("--cell-rest", `${rest.toFixed(2)}px`);
      style.setProperty("--pan-max", `${panMax.toFixed(2)}px`);
      // Constante: a altura da secao nao depende mais do que o usuario abriu.
      style.setProperty("--track-h", `${(vh + panScroll).toFixed(2)}px`);

      fitTitle(capTitle.current, capYear.current);

      const wrap = capWrap.current;
      const block = capBlock.current;
      if (wrap && block) {
        const travel = Math.max(0, wrap.clientHeight - block.offsetHeight);
        style.setProperty("--cap-travel", `${travel.toFixed(2)}px`);

        const rule = block.querySelector<HTMLElement>(".ed-rule");
        if (rule) {
          const top = wrap.offsetTop + rule.offsetTop + rule.offsetHeight;
          style.setProperty("--cards-top", `${top.toFixed(2)}px`);
        }
      }

      progress();
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    measure();
    // O observador do documentElement e o ouvinte de `resize` viraram uma
    // inscricao so, com debounce e sem o ruido da barra de endereco (ver
    // lib/viewport.ts). O do bloco da legenda fica: aquele reage ao CONTEUDO
    // (o titulo troca de comprimento a cada foto) e nao a viewport.
    const unwatch = onViewport(measure);
    const observer = new ResizeObserver(measure);
    if (capBlock.current) observer.observe(capBlock.current);
    const untick = onTick(progress);
    window.addEventListener("keydown", onKey);

    // O ARRASTO do telefone. O dedo em px vira `pan` em px, e para a frente e
    // o dedo indo para a ESQUERDA, dai o sinal trocado. Enquanto arrasta, o
    // reel segue o dedo com o elastico nas pontas; na soltura, `reelRelease`
    // escolhe a foto que centraliza e o gsap assenta nela. Com uma foto aberta
    // o gesto e da galeria, e o arrasto nao comeca. O que e toque e o que e
    // arrasto quem decide e lib/swipe.ts.
    function settleOn(target: number) {
      gsap.killTweensOf(reel);
      if (isReduced()) {
        reel.x = target;
        return;
      }
      gsap.to(reel, { x: target, duration: SNAP_S, ease: SNAP_EASE });
    }

    let from = 0;
    let raw = 0;
    const pinNode = pin.current;
    const unswipe = pinNode
      ? bindSwipe(pinNode, {
          can: () => geometry.current.swipe && activeRef.current === null,
          start: () => {
            gsap.killTweensOf(reel);
            from = reel.x;
            raw = from;
          },
          move: (dx) => {
            raw = from - dx;
            const { panMax, width } = geometry.current;
            reel.x = reelRubber(raw, panMax, width * RUBBER_VW);
          },
          end: (velocity) =>
            settleOn(reelRelease(raw, -velocity, geometry.current.stops)),
        })
      : () => {};

    return () => {
      untick();
      unswipe();
      gsap.killTweensOf(reel);
      window.clearTimeout(exit.current);
      unwatch();
      observer.disconnect();
      window.removeEventListener("keydown", onKey);
    };
  }, [count, close]);

  // Com movimento reduzido nao ha gesto que percorra a galeria, entao ela abre
  // ja inteira em vez de ficar num estado que o usuario nao consegue avancar.
  useEffect(() => {
    if (active === null || !isReduced()) return;
    aim.current = 1;
    read.current.at = 1;
  }, [active]);

  useEffect(() => {
    const node = track.current;
    if (!node) return;
    fitTitle(capTitle.current, capYear.current);
    const wrap = capWrap.current;
    const block = capBlock.current;
    if (wrap && block) {
      const travel = Math.max(0, wrap.clientHeight - block.offsetHeight);
      node.style.setProperty("--cap-travel", `${travel.toFixed(2)}px`);
    }
  }, [shown]);

  return {
    track,
    pin,
    capWrap,
    capBlock,
    capTitle,
    capYear,
    active,
    shown,
    armed,
    leaving,
    open,
    close,
  };
}
