"use client";

import gsap from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";

import { isReduced, lockScroll, onTick } from "@/lib/scroll";

const CELL_VW = 0.3;
const CELL_HOVER_VW = 0.7;
const CELL_VW_NARROW = 0.8;
const NARROW_MAX = 760;
const PAN_FACTOR = 0.42;
const PAN_MIN_VH = 1.2;
const PAN_MAX_VH = 2;

// Quanto de gesto cada quadro da galeria pede. E distancia virtual, nao altura
// de documento: a foto aberta trava a pagina e o gesto alimenta so a galeria.
// Por isso pode ser bem mais curta do que quando era scroll de verdade.
const STEP_VH = 0.28;
const STEP_MIN = 200;

const IDLE_MS = 180;
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

function smallViewportHeight() {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:absolute;top:0;left:0;width:0;height:100svh;visibility:hidden;pointer-events:none";
  document.body.appendChild(probe);
  const height = probe.getBoundingClientRect().height;
  probe.remove();
  return height || window.innerHeight;
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
  const geometry = useRef({ cell: 1, panMax: 0, panScroll: 1, step: 1, view: 0 });
  const idle = useRef(0);
  const exit = useRef(0);

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

    let lastTop = Number.NaN;

    function progress() {
      const node = track.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();

      // The pin used to learn it was moving from the scroll event itself; on a
      // shared tick it has to notice the movement on its own.
      const pinNode = pin.current;
      if (pinNode && rect.top !== lastTop) {
        lastTop = rect.top;
        pinNode.setAttribute("data-scrolling", "");
        window.clearTimeout(idle.current);
        idle.current = window.setTimeout(
          () => pinNode.removeAttribute("data-scrolling"),
          IDLE_MS,
        );
      }

      if (!armedRef.current && rect.top < window.innerHeight * 2) {
        armedRef.current = true;
        setArmed(true);
      }

      const { panScroll } = geometry.current;
      const style = node.style;

      style.setProperty("--q", clamp01(-rect.top / panScroll).toFixed(4));
      style.setProperty("--c", read.current.at.toFixed(4));
    }

    function measure() {
      const node = track.current;
      if (!node) return;
      const vw = document.documentElement.clientWidth;
      const vh = smallViewportHeight();
      if (!vw || !vh) return;

      const cell = (vw <= NARROW_MAX ? CELL_VW_NARROW : CELL_VW) * vw;
      const panMax = Math.max(0, count * cell - vw);
      const panScroll = Math.min(
        Math.max(panMax * PAN_FACTOR, PAN_MIN_VH * vh),
        PAN_MAX_VH * vh,
      );
      geometry.current = {
        cell,
        panMax,
        panScroll,
        step: Math.max(STEP_VH * vh, STEP_MIN),
        view: vh,
      };

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
    const observer = new ResizeObserver(measure);
    observer.observe(document.documentElement);
    if (capBlock.current) observer.observe(capBlock.current);
    window.addEventListener("resize", measure);
    const untick = onTick(progress);
    window.addEventListener("keydown", onKey);

    return () => {
      untick();
      window.clearTimeout(idle.current);
      window.clearTimeout(exit.current);
      observer.disconnect();
      window.removeEventListener("resize", measure);
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
