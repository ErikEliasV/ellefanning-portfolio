"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";

import { dropPath, LENS, lensMap } from "@/lib/cursorLens";
import { isReduced, onTick } from "@/lib/scroll";

const CHASE = 0.42;
const CHASE_EASE = "power3";
const SETTLED = 0.4;
const IDLE = 84;
const HOT = 116;
const PRESS = 18;
const AREA = 0.34;
const TALL = 0.82;
// Fracao do caminho entre o ponteiro e o centro do elemento que a gota anda
// sozinha: puxada, nao grudada, para o ponteiro continuar mandando.
const MAGNET = 0.32;
// Velocidade da gota, em px/s, que ja le como estiramento total. O desenho da
// cauda para cada estiramento mora em dropPath(), em lib/cursorLens.ts.
const SPEED_FULL = 2000;
const SPEED_REST = 12;
// Quanto a cauda demora a virar para a nova direcao, em 1/s.
const TURN = 14;
// Molas em unidades de segundo. Subamortecidas de proposito: o balanco depois
// da parada e o que faz a gota ler como agua e nao como disco de vidro.
const SHAPE_K = 240;
const SHAPE_C = 11;
const SIZE_K = 300;
const SIZE_C = 17;
// Um quadro longo (aba em segundo plano, engasgo) nao pode virar um passo de
// mola gigante: ela explode em vez de balancar.
const MAX_DT = 1 / 30;
const PICK =
  'a[href], button, summary, label, [role="button"], [role="link"], [data-cursor]';

type Spring = { x: number; v: number };

function spring(s: Spring, goal: number, k: number, c: number, dt: number) {
  s.v += (k * (goal - s.x) - c * s.v) * dt;
  s.x += s.v * dt;
}

// O filtro url() no backdrop-filter so existe no Chromium. No Firefox e no
// Safari a declaracao inteira deixa de valer, entao a refracao entra por opt-in
// e o desfoque puro continua sendo a base.
function canRefract() {
  const agent = (navigator as Navigator & {
    userAgentData?: { brands: { brand: string }[] };
  }).userAgentData;
  return !!agent?.brands.some((entry) => entry.brand === "Chromium");
}

export function useCursor() {
  const shell = useRef<HTMLDivElement>(null);
  const lens = useRef<HTMLSpanElement>(null);
  const body = useRef<HTMLSpanElement>(null);
  const outline = useRef<SVGPathElement>(null);
  const map = useRef<SVGFEImageElement>(null);
  const dot = useRef<HTMLSpanElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const [fine, setFine] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(pointer: fine)");
    const read = () => setFine(query.matches);

    read();
    query.addEventListener("change", read);

    return () => query.removeEventListener("change", read);
  }, []);

  useEffect(() => {
    const node = shell.current;
    const drop = lens.current;
    const skin = body.current;
    const edge = outline.current;
    if (!fine || !node || !drop || !skin || !edge) return;

    if (canRefract()) {
      map.current?.setAttribute("href", lensMap());
      node.dataset.refract = "";
    }

    const root = document.documentElement;
    const point = { x: 0, y: 0 };
    const box = { x: 0, y: 0 };
    const goal = { x: 0, y: 0 };
    const last = { x: 0, y: 0 };
    const size: Spring = { x: 0, v: 0 };
    const shape: Spring = { x: 0, v: 0 };
    // Direcao do movimento, suavizada. A cauda aponta para o lado oposto.
    const heading = { x: 1, y: 0 };

    let untick: (() => void) | null = null;
    let then = 0;
    let drawn = "";
    let pendingRetag = false;
    // O rótulo sai por cima em vez de por baixo. Opt-in por elemento
    // (data-cursor-at="top"), não automático perto da borda da tela: automático
    // faria o rótulo virar sozinho enquanto o ponteiro passeia pelo limiar.
    let above = false;
    let hot: HTMLElement | null = null;
    let pull = false;
    let down = false;
    let live = false;

    // The chase used to be a per-frame lerp, which ran twice as fast on a 120Hz
    // screen as on a 60Hz one. A tween is measured in seconds, so it does not.
    const chase = { duration: CHASE, ease: CHASE_EASE };
    const toX = gsap.quickTo(box, "x", chase);
    const toY = gsap.quickTo(box, "y", chase);

    function aim() {
      if (pull && hot) {
        const rect = hot.getBoundingClientRect();
        goal.x = point.x + (rect.left + rect.width / 2 - point.x) * MAGNET;
        goal.y = point.y + (rect.top + rect.height / 2 - point.y) * MAGNET;
        return;
      }

      goal.x = point.x;
      goal.y = point.y;
    }

    function girth() {
      if (!live) return 0;
      return (hot ? HOT : IDLE) - (down ? PRESS : 0);
    }

    function flow(dt: number) {
      const vx = (box.x - last.x) / dt;
      const vy = (box.y - last.y) / dt;
      const speed = Math.hypot(vx, vy);
      last.x = box.x;
      last.y = box.y;

      if (isReduced()) {
        size.x = girth();
        size.v = 0;
        shape.x = 0;
        shape.v = 0;
        return speed;
      }

      if (speed > SPEED_REST) {
        const turn = 1 - Math.exp(-dt * TURN);
        heading.x += (vx / speed - heading.x) * turn;
        heading.y += (vy / speed - heading.y) * turn;
      }

      spring(shape, Math.min(speed / SPEED_FULL, 1), SHAPE_K, SHAPE_C, dt);
      spring(size, girth(), SIZE_K, SIZE_C, dt);
      return speed;
    }

    function paint() {
      if (!node || !drop || !skin || !edge) return;

      const x = Math.round(box.x);
      const y = Math.round(box.y);
      const span = Math.max(size.x, 0);
      const half = Math.round(span / 2);

      node.style.transform = `translate3d(${x}px, ${y}px, 0)`;

      // O tamanho vai por escala uniforme e a forma pelo contorno, que nunca
      // gira a caixa: a luz do SVG fica no alto a esquerda com a gota andando
      // para qualquer lado. O mesmo contorno recorta o vidro e desenha a borda.
      drop.style.transform = `scale(${span / LENS})`;

      const stretch = Math.min(Math.max(shape.x, -0.3), 1);
      const d = dropPath(Math.atan2(heading.y, heading.x), stretch);
      if (d !== drawn) {
        drawn = d;
        skin.style.clipPath = `path("${d}")`;
        edge.setAttribute("d", d);
      }

      const mark = dot.current;
      if (mark) {
        mark.style.transform = `translate3d(${Math.round(point.x) - x}px, ${Math.round(point.y) - y}px, 0)`;
      }

      const tag = label.current;
      if (tag) {
        // O -100% resolve contra a altura do próprio rótulo, então a folga de
        // 8px fica igual dos dois lados sem precisar medi-lo.
        const off = half + 8;
        tag.style.transform = above
          ? `translate3d(${-half}px, calc(${-off}px - 100%), 0)`
          : `translate3d(${-half}px, ${off}px, 0)`;
      }
    }

    function tick(now: number) {
      const dt = then ? Math.min((now - then) / 1000, MAX_DT) : 1 / 60;
      then = now;

      aim();
      toX(goal.x);
      toY(goal.y);

      const speed = flow(dt);
      paint();

      if (pendingRetag) {
        pendingRetag = false;
        retag(hot);
      }

      const rest =
        !pull &&
        Math.abs(goal.x - box.x) < SETTLED &&
        Math.abs(goal.y - box.y) < SETTLED &&
        speed < SPEED_REST &&
        Math.abs(girth() - size.x) < SETTLED &&
        Math.abs(size.v) < 1 &&
        Math.abs(shape.x) < 0.002 &&
        Math.abs(shape.v) < 0.02;

      if (rest) {
        untick?.();
        untick = null;
      }
    }

    function wake() {
      if (untick) return;
      then = 0;
      untick = onTick(tick);
    }

    function fits(hit: HTMLElement) {
      const rect = hit.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (!rect.width || !rect.height) return false;
      if (rect.height > vh * TALL) return false;
      return rect.width * rect.height <= vw * vh * AREA;
    }

    function move(event: PointerEvent) {
      if (!node) return;

      point.x = event.clientX;
      point.y = event.clientY;

      if (!live) {
        live = true;
        box.x = point.x;
        box.y = point.y;
        last.x = point.x;
        last.y = point.y;
        toX(point.x, point.x);
        toY(point.y, point.y);
        node.dataset.live = "";
        root.dataset.cursorOn = "";
      }

      wake();
    }

    function over(event: PointerEvent) {
      if (!node) return;
      const from = event.target instanceof Element ? event.target : null;

      const field = from?.closest("[data-cursor-skin]");
      const tone = field instanceof HTMLElement ? field.dataset.cursorSkin : "";
      if (tone) node.dataset.skin = tone;
      else delete node.dataset.skin;

      const next = from?.closest(PICK);
      const hit = next instanceof HTMLElement ? next : null;
      retag(hit);
      if (hit === hot) return;

      hot = hit;
      pull = hit ? fits(hit) : false;

      if (hit) node.dataset.hot = "";
      else delete node.dataset.hot;

      wake();
    }

    function retag(hit: HTMLElement | null) {
      if (!node) return;

      const tag = hit?.dataset.cursor ?? "";
      const slot = label.current;
      if (slot && slot.textContent !== tag) slot.textContent = tag;

      above = hit?.dataset.cursorAt === "top";

      if (tag) node.dataset.tag = "";
      else delete node.dataset.tag;
    }

    function press() {
      if (!node) return;
      down = true;
      node.dataset.down = "";
      wake();
    }

    function release() {
      if (!node) return;
      down = false;
      delete node.dataset.down;
      pendingRetag = true;
      wake();
    }

    function drift() {
      if (pull) wake();
    }

    function hide() {
      if (!node) return;
      live = false;
      down = false;
      delete node.dataset.live;
      delete node.dataset.down;
      wake();
    }

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    window.addEventListener("pointerdown", press, { passive: true });
    window.addEventListener("pointerup", release, { passive: true });
    window.addEventListener("scroll", drift, { passive: true });
    window.addEventListener("blur", hide);
    document.addEventListener("pointerleave", hide);

    return () => {
      untick?.();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("scroll", drift);
      window.removeEventListener("blur", hide);
      document.removeEventListener("pointerleave", hide);
      delete root.dataset.cursorOn;
    };
  }, [fine]);

  return { shell, lens, body, outline, map, dot, label, fine };
}
