"use client";

import gsap from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";

import { isReduced, onTick, scrollTo } from "@/lib/scroll";
import { SECTIONS } from "@/lib/sections";
import type { SectionId } from "@/lib/sections";

// Sem os 90ms o painel pisca quando o ponteiro so atravessa a barra a caminho
// de outra coisa; sem os 180ms ele fecha no meio do trajeto diagonal do nome
// ate o painel.
const INTENT = 90;
const GRACE = 180;

// O mesmo atraso do cursor em lib/useCursor.ts. O atraso e o efeito: sem ele o
// brilho e uma lanterna, com ele e massa.
const FOLLOW = 0.42;
const FOLLOW_EASE = "power3";

// Uma faixa fina no meio da tela: a secao que a cobre e a secao que se esta
// lendo. Com as secoes sendo todas mais altas que a viewport, isso deixa
// exatamente uma intersecao ativa quase o tempo todo.
const SPY_BAND = "-45% 0px -45% 0px";

export function useHeaderGlass() {
  const shell = useRef<HTMLElement>(null);
  const [hot, setHot] = useState<SectionId | null>(null);
  const [active, setActive] = useState<SectionId | null>(null);
  const [awake, setAwake] = useState(false);

  // O estado espelhado num ref porque aim() precisa saber se ja esta aberto
  // sem agendar o timer de dentro de um updater, que o StrictMode roda duas
  // vezes.
  const at = useRef<SectionId | null>(null);
  const openAt = useRef(0);
  const shutAt = useRef(0);

  const settle = useCallback((id: SectionId | null) => {
    at.current = id;
    setHot(id);
  }, []);

  const shut = useCallback(() => {
    window.clearTimeout(openAt.current);
    window.clearTimeout(shutAt.current);
    settle(null);
    setAwake(false);
  }, [settle]);

  const aim = useCallback(
    (id: SectionId) => {
      window.clearTimeout(shutAt.current);
      window.clearTimeout(openAt.current);

      // Ja aberto: trocar de item e imediato, senao a nav fica pesada.
      if (at.current) {
        settle(id);
        return;
      }

      openAt.current = window.setTimeout(() => settle(id), INTENT);
    },
    [settle],
  );

  const bind = useCallback(
    (id: SectionId) => ({
      onPointerEnter: () => aim(id),
      onFocus: () => {
        window.clearTimeout(shutAt.current);
        window.clearTimeout(openAt.current);
        settle(id);
      },
    }),
    [aim, settle],
  );

  useEffect(() => {
    const node = shell.current;
    if (!node) return;

    const arrive = () => setAwake(true);

    const leave = () => {
      window.clearTimeout(openAt.current);
      shutAt.current = window.setTimeout(() => {
        settle(null);
        setAwake(false);
      }, GRACE);
    };

    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") shut();
    };

    const away = (event: FocusEvent) => {
      const next = event.relatedTarget;
      if (next instanceof Node && node.contains(next)) return;
      shut();
    };

    // Com o painel aberto e a pagina correndo por baixo, o preview e o
    // conteudo contam duas historias ao mesmo tempo.
    const drift = () => {
      if (at.current) shut();
    };

    node.addEventListener("pointerenter", arrive, { passive: true });
    node.addEventListener("pointerleave", leave, { passive: true });
    node.addEventListener("focusout", away);
    window.addEventListener("keydown", escape);
    window.addEventListener("scroll", drift, { passive: true });

    return () => {
      window.clearTimeout(openAt.current);
      window.clearTimeout(shutAt.current);
      node.removeEventListener("pointerenter", arrive);
      node.removeEventListener("pointerleave", leave);
      node.removeEventListener("focusout", away);
      window.removeEventListener("keydown", escape);
      window.removeEventListener("scroll", drift);
    };
  }, [settle, shut]);

  useEffect(() => {
    const seen = SECTIONS.map((section) =>
      document.getElementById(section.id),
    ).filter((node): node is HTMLElement => node !== null);

    if (!seen.length) return;

    const spy = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((entry) => entry.isIntersecting);
        if (hit) setActive(hit.target.id as SectionId);
      },
      { rootMargin: SPY_BAND },
    );

    seen.forEach((node) => spy.observe(node));

    return () => spy.disconnect();
  }, []);

  // So se inscreve no tick enquanto a barra esta desperta, e sai ao adormecer:
  // fora do header o custo e zero.
  useEffect(() => {
    const node = shell.current;
    if (!node || !awake || isReduced()) return;

    const lens = { x: 0, y: 0 };
    const chase = { duration: FOLLOW, ease: FOLLOW_EASE };
    const toX = gsap.quickTo(lens, "x", chase);
    const toY = gsap.quickTo(lens, "y", chase);

    let first = true;

    const aimLens = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;

      const box = node.getBoundingClientRect();
      const x = event.clientX - box.left;
      const y = event.clientY - box.top;

      if (first) {
        first = false;
        toX(x, x);
        toY(y, y);
        return;
      }

      toX(x);
      toY(y);
    };

    const paint = () => {
      node.style.setProperty("--mx", `${Math.round(lens.x)}px`);
      node.style.setProperty("--my", `${Math.round(lens.y)}px`);
    };

    node.addEventListener("pointermove", aimLens, { passive: true });
    const untick = onTick(paint);

    return () => {
      node.removeEventListener("pointermove", aimLens);
      untick();
      gsap.killTweensOf(lens);
      node.style.removeProperty("--mx");
      node.style.removeProperty("--my");
    };
  }, [awake]);

  const ride = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, id: SectionId) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      shut();
      scrollTo(`#${id}`);
    },
    [shut],
  );

  return { shell, hot, active, awake, open: hot !== null, ride, bind };
}
