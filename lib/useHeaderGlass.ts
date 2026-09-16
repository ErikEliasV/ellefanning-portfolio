"use client";

import gsap from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";

import { asset } from "@/lib/asset";
import { isReduced, onTick, scrollTo } from "@/lib/scroll";
import { SECTIONS } from "@/lib/sections";
import type { Liquid, Media } from "@/lib/headerLiquid";
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

// A mesma banda do CSS: --duration-slow, na curva assinatura do site.
const OPEN_S = 0.42;
const OPEN_EASE = "power4.out";

type Feed = { media: Media; focus: number; push: number };

export function useHeaderGlass() {
  const shell = useRef<HTMLElement>(null);
  const view = useRef<HTMLCanvasElement>(null);
  const [hot, setHot] = useState<SectionId | null>(null);
  const [active, setActive] = useState<SectionId | null>(null);
  const [awake, setAwake] = useState(false);
  const [painted, setPainted] = useState(false);

  const liquid = useRef<Liquid | null>(null);
  // O import do three e assincrono, entao a midia pode ficar pronta antes da
  // cena existir. Fica guardada aqui e e aplicada de qualquer um dos dois lados
  // que chegue por ultimo.
  const feed = useRef<Feed | null>(null);
  const seat = useRef(0);
  const tapeA = useRef<HTMLVideoElement>(null);
  const tapeB = useRef<HTMLVideoElement>(null);
  const slot = useRef(0);

  const open = hot !== null;

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

      const scene = liquid.current;
      if (!scene) return;

      const box = node.getBoundingClientRect();
      scene.setPointer(
        (lens.x / box.width) * 2 - 1,
        1 - (lens.y / box.height) * 2,
        1,
      );
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

  // A cena nasce na abertura e morre no fechamento: fechada, o header nao tem
  // contexto WebGL nenhum.
  useEffect(() => {
    const node = view.current;
    if (!node || !open || isReduced()) return;

    let scene: Liquid | null = null;
    let untick: (() => void) | null = null;
    let live = true;
    let last = 0;

    const entry = { p: 0 };

    const tick = (now: number) => {
      if (!scene) return;
      const step = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      scene.setOpen(entry.p);
      scene.frame(step);
    };

    const lost = (event: Event) => {
      event.preventDefault();
      setPainted(false);
    };

    node.addEventListener("webglcontextlost", lost);

    void import("@/lib/headerLiquid")
      .then(({ createLiquid }) => {
        if (!live) return;

        scene = createLiquid({ canvas: node });
        if (!scene) return;

        liquid.current = scene;
        scene.resize();

        const waiting = feed.current;
        if (waiting) scene.setMedia(waiting.media, waiting.focus, waiting.push);

        gsap.to(entry, { p: 1, duration: OPEN_S, ease: OPEN_EASE });
        setPainted(true);
        untick = onTick(tick);
      })
      .catch(() => {});

    const sizer = new ResizeObserver(() => scene?.resize());
    sizer.observe(node);

    return () => {
      live = false;
      untick?.();
      sizer.disconnect();
      gsap.killTweensOf(entry);
      node.removeEventListener("webglcontextlost", lost);
      liquid.current = null;
      scene?.dispose();
      setPainted(false);
    };
  }, [open]);

  useEffect(() => {
    if (!hot) return;

    const section = SECTIONS.find((item) => item.id === hot);
    if (!section) return;

    const next = SECTIONS.findIndex((item) => item.id === hot);
    // O sinal da diferenca de indice e o que da direcao a troca: ir de
    // FILMOGRAPHY para NOW empurra a onda num sentido, voltar empurra no outro.
    const push = Math.sign(next - seat.current);
    seat.current = next;

    const image = new Image();
    // O still do NOW e a miniatura do YouTube, que e cross-origin: sem isso o
    // WebGL recusa a textura. Falhando o CORS, o onload nao vem, a chapa DOM
    // continua no lugar e o painel segue funcionando sem refracao.
    image.crossOrigin = "anonymous";
    image.decoding = "async";

    const ready = () => {
      feed.current = { media: image, focus: section.focus, push };
      liquid.current?.setMedia(image, section.focus, push);
    };

    image.addEventListener("load", ready, { once: true });
    image.src = asset(section.still);

    // Duas fitas bastam para o cross-fade, e o src so e atribuido no primeiro
    // hover daquela secao. Sem os arquivos em public/videos o <video> falha em
    // silencio e o still fica: e o estado padrao ate os clipes existirem.
    const tape = [tapeA.current, tapeB.current][slot.current ^ 1];

    if (!tape || isReduced()) {
      return () => image.removeEventListener("load", ready);
    }

    slot.current ^= 1;

    const rolling = () => {
      if (tape.dataset.for !== section.id) return;
      // push 0: o empurrao ja aconteceu quando o still entrou, e repetir na
      // troca de textura daria dois solavancos para um mesmo gesto.
      feed.current = { media: tape, focus: section.focus, push: 0 };
      liquid.current?.setMedia(tape, section.focus, 0);
      tape.dataset.on = "";
      void tape.play().catch(() => {});
    };

    if (tape.dataset.for !== section.id) {
      tape.dataset.for = section.id;
      tape.src = asset(section.clip);
      tape.load();
    }

    tape.addEventListener("canplay", rolling, { once: true });
    if (tape.readyState >= 3) rolling();

    return () => {
      image.removeEventListener("load", ready);
      tape.removeEventListener("canplay", rolling);
      delete tape.dataset.on;
      tape.pause();
    };
  }, [hot]);

  const ride = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, id: SectionId) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      shut();
      scrollTo(`#${id}`);
    },
    [shut],
  );

  return {
    shell,
    view,
    tapeA,
    tapeB,
    hot,
    active,
    awake,
    open,
    painted,
    ride,
    bind,
  };
}
