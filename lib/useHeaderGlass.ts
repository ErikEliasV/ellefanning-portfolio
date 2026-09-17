"use client";

import gsap from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";

import { asset } from "@/lib/asset";
import { gooPath } from "@/lib/headerGoo";
import { isReduced, onTick, scrollTo } from "@/lib/scroll";
import { SECTIONS } from "@/lib/sections";
import type { Liquid, Media } from "@/lib/headerLiquid";
import type { SectionId } from "@/lib/sections";

// Sem os 90ms o painel pisca quando o ponteiro so atravessa a barra a caminho
// de outra coisa; sem os 180ms ele fecha no meio do trajeto diagonal do nome
// ate o painel.
const INTENT = 90;
const GRACE = 180;

// Curto o bastante para a bolha ler como presa ao ponteiro, longo o bastante
// para o tecido parecer ter peso. Quem tem de ser lento e a expansao, nao a
// perseguicao.
const FOLLOW = 0.34;
const FOLLOW_EASE = "power2";

// Uma faixa fina no meio da tela: a secao que a cobre e a secao que se esta
// lendo. Com as secoes sendo todas mais altas que a viewport, isso deixa
// exatamente uma intersecao ativa quase o tempo todo.
const SPY_BAND = "-45% 0px -45% 0px";

// Quanto rolar antes de o header ter licenca para sumir, e a faixa do topo da
// viewport que o traz de volta so por o ponteiro estar ali.
const HIDE_AFTER = 160;
const PEEK = 120;

// Altura da bolha em pixels, agora que ela e uma so e nao um multiplicador de
// ondas: fechado, aberto, e o quanto a transicao acrescenta.
const IDLE_AMP = 26;
const OPEN_AMP = 34;
const JOLT_AMP = 40;
// Raio em que a bolha morre. Largo o bastante para virar tecido, estreito o
// bastante para o outro lado da barra nao sentir nada.
const REACH = 250;
const JOLT_DECAY = 1.15;
const SHAPE_S = 0.95;
// power2, e nao power4: a quintica sai rapido demais do lugar, e o pedido e
// que o movimento seja suave do inicio ao fim.
const SHAPE_EASE = "power2";
const AMP_S = 1.15;
const REST = 0.6;
const ROOF_SHARE = 0.85;
const FLOOR_SHARE = 0.9;
const SIDE_SHARE = 0.85;

type Feed = { media: Media; focus: number; push: number };

function metric(styles: CSSStyleDeclaration, name: string) {
  return Number.parseFloat(styles.getPropertyValue(name)) || 0;
}

export function useHeaderGlass() {
  const shell = useRef<HTMLElement>(null);
  const view = useRef<HTMLCanvasElement>(null);
  const tapeA = useRef<HTMLVideoElement>(null);
  const tapeB = useRef<HTMLVideoElement>(null);

  const [hot, setHot] = useState<SectionId | null>(null);
  const [active, setActive] = useState<SectionId | null>(null);
  const [awake, setAwake] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [painted, setPainted] = useState(false);

  const liquid = useRef<Liquid | null>(null);
  // O import do three e assincrono, entao a midia pode ficar pronta antes da
  // cena existir. Fica guardada aqui e e aplicada de qualquer um dos dois lados
  // que chegue por ultimo.
  const feed = useRef<Feed | null>(null);
  const seat = useRef(0);
  const slot = useRef(0);

  // Num ref, e nao em estado, porque nada renderiza a partir disso e os
  // callbacks nao devem se recriar quando o apontador troca.
  const fine = useRef(false);
  // Onde o ponteiro entrou. Sem isso o especular comeca em 0,0 e a primeira
  // coisa que se ve ao entrar no header e um facho vindo do canto.
  const spot = useRef({ x: 0, y: 0 });

  const open = hot !== null;

  // Espelhos, para o loop da gosma ler o estado sem remontar a cada mudanca.
  const live = useRef({ open: false, awake: false });
  const jolt = useRef(0);
  const box = useRef({
    bar: 0,
    tall: 0,
    lip: 0,
    wing: 0,
    roof: 0,
    floor: 0,
    side: 0,
    width: 0,
  });

  // O estado espelhado num ref porque aim() precisa saber se ja esta aberto
  // sem agendar o timer de dentro de um updater, que o StrictMode roda duas
  // vezes.
  const at = useRef<SectionId | null>(null);
  const openAt = useRef(0);
  const shutAt = useRef(0);

  const settle = useCallback((id: SectionId | null) => {
    if (at.current === id) return;
    at.current = id;
    // Toda troca de estado injeta um solavanco na gosma: e o que faz a expansao
    // parecer massa sendo puxada, e nao uma caixa crescendo.
    jolt.current = 1;
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
      // No toque nao ha hover: o link navega e nada mais acontece.
      if (!fine.current) return;

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

  // Espelhados num efeito, e nao no corpo do componente, porque escrever em
  // ref durante o render e leitura suja de estado concorrente.
  useEffect(() => {
    live.current.open = open;
    live.current.awake = awake;
  }, [open, awake]);

  useEffect(() => {
    const query = window.matchMedia("(pointer: fine)");
    const read = () => {
      fine.current = query.matches;
    };

    read();
    query.addEventListener("change", read);

    return () => query.removeEventListener("change", read);
  }, []);

  useEffect(() => {
    const node = shell.current;
    if (!node) return;

    const arrive = (event: PointerEvent) => {
      if (!fine.current) return;

      const rect = node.getBoundingClientRect();
      spot.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };

      setAwake(true);
      setBusy(true);
    };

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

    let mark = window.scrollY;

    // Desce, some; sobe ou volta ao topo, reaparece. E com o painel aberto e a
    // pagina correndo por baixo, o preview e o conteudo contam duas historias
    // ao mesmo tempo, entao rolar tambem fecha.
    const drift = () => {
      const y = window.scrollY;
      const down = y > mark;
      mark = y;

      if (at.current) shut();
      setHidden(down && y > HIDE_AFTER);
    };

    // A faixa do topo devolve o header sem precisar rolar para tras.
    const peek = (event: PointerEvent) => {
      if (event.clientY <= PEEK) setHidden(false);
    };

    node.addEventListener("pointerenter", arrive, { passive: true });
    node.addEventListener("pointerleave", leave, { passive: true });
    node.addEventListener("focusout", away);
    window.addEventListener("keydown", escape);
    window.addEventListener("scroll", drift, { passive: true });
    window.addEventListener("pointermove", peek, { passive: true });

    return () => {
      window.clearTimeout(openAt.current);
      window.clearTimeout(shutAt.current);
      node.removeEventListener("pointerenter", arrive);
      node.removeEventListener("pointerleave", leave);
      node.removeEventListener("focusout", away);
      window.removeEventListener("keydown", escape);
      window.removeEventListener("scroll", drift);
      window.removeEventListener("pointermove", peek);
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

  // O loop da gosma. Fica inscrito enquanto houver movimento e se desliga
  // sozinho quando a forma assenta na barra: fora disso, custo zero.
  useEffect(() => {
    const node = shell.current;
    if (!node || !busy || isReduced()) return;

    const lens = { ...spot.current };
    const shape = { reveal: 0, amp: IDLE_AMP };
    let clock = 0;
    let last = 0;

    const chase = { duration: FOLLOW, ease: FOLLOW_EASE };
    const toX = gsap.quickTo(lens, "x", chase);
    const toY = gsap.quickTo(lens, "y", chase);
    const toReveal = gsap.quickTo(shape, "reveal", {
      duration: SHAPE_S,
      ease: SHAPE_EASE,
    });
    const toAmp = gsap.quickTo(shape, "amp", {
      duration: AMP_S,
      ease: SHAPE_EASE,
    });

    const gauge = () => {
      const styles = getComputedStyle(node);
      const nav = node.querySelector<HTMLElement>(".hdr-nav");
      box.current = {
        // A nav tem exatamente --hdr-h de altura, entao ela e a medida de
        // reserva caso o registro de @property nao esteja disponivel.
        bar: metric(styles, "--hdr-h") || nav?.offsetHeight || 0,
        tall: metric(styles, "--hdr-open-h"),
        lip: metric(styles, "--hdr-lip"),
        // O topo so pode inchar ate o menor entre a folga da caixa e o espaco
        // que sobra ate o alto da viewport; a base tem a folga inteira.
        roof:
          Math.min(metric(styles, "--hdr-lip"), metric(styles, "--hdr-top")) *
          ROOF_SHARE,
        floor: metric(styles, "--hdr-slack") * FLOOR_SHARE,
        wing: metric(styles, "--hdr-wing"),
        side: metric(styles, "--hdr-wing") * SIDE_SHARE,
        width: node.getBoundingClientRect().width,
      };
    };

    gauge();
    shape.reveal = live.current.open ? box.current.tall : box.current.bar;
    toX(lens.x, lens.x);
    toY(lens.y, lens.y);

    const aimLens = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const rect = node.getBoundingClientRect();
      toX(event.clientX - rect.left);
      toY(event.clientY - rect.top);
    };

    const paint = (now: number) => {
      const step = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      clock += step;

      node.style.setProperty("--mx", `${Math.round(lens.x)}px`);
      node.style.setProperty("--my", `${Math.round(lens.y)}px`);

      const { bar, tall, lip, wing, roof, floor, side, width } = box.current;

      // Sem medida confiavel o recorte fica com o CSS: escrever um polygon com
      // altura zero apagaria o header inteiro.
      if (!bar || !tall || !width) return;

      toReveal(live.current.open ? tall : bar);
      toAmp(live.current.open ? OPEN_AMP : IDLE_AMP);

      // Decaimento por tempo, nao por frame: a 120Hz um fator por frame
      // morreria duas vezes mais rapido que a 60Hz.
      jolt.current *= Math.exp(-step * JOLT_DECAY);

      node.style.clipPath = gooPath({
        width,
        wing,
        lip,
        reveal: shape.reveal,
        amp: shape.amp + jolt.current * JOLT_AMP,
        reach: REACH,
        time: clock,
        x: lens.x,
        y: lens.y,
        roof,
        floor,
        side,
      });

      const scene = liquid.current;
      if (scene) {
        const rect = node.getBoundingClientRect();
        scene.setPointer(
          (lens.x / rect.width) * 2 - 1,
          1 - (lens.y / rect.height) * 2,
          1,
        );
      }

      const done =
        !live.current.awake &&
        !live.current.open &&
        Math.abs(shape.reveal - bar) < REST &&
        jolt.current < 0.02;

      if (done) setBusy(false);
    };

    node.addEventListener("pointermove", aimLens, { passive: true });
    const sizer = new ResizeObserver(gauge);
    sizer.observe(node);
    const untick = onTick(paint);

    return () => {
      node.removeEventListener("pointermove", aimLens);
      sizer.disconnect();
      untick();
      gsap.killTweensOf(lens);
      gsap.killTweensOf(shape);
      node.style.removeProperty("--mx");
      node.style.removeProperty("--my");
      // Devolve o recorte ao CSS, que e tambem o caminho de movimento reduzido.
      node.style.removeProperty("clip-path");
    };
  }, [busy]);

  // A cena nasce na abertura e morre no fechamento: fechada, o header nao tem
  // contexto WebGL nenhum.
  useEffect(() => {
    const node = view.current;
    if (!node || !open || isReduced()) return;

    let scene: Liquid | null = null;
    let untick: (() => void) | null = null;
    let alive = true;
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
        if (!alive) return;

        scene = createLiquid({ canvas: node });
        if (!scene) return;

        liquid.current = scene;
        scene.resize();

        const waiting = feed.current;
        if (waiting) scene.setMedia(waiting.media, waiting.focus, waiting.push);

        gsap.to(entry, { p: 1, duration: SHAPE_S, ease: "power4.out" });
        setPainted(true);
        untick = onTick(tick);
      })
      .catch(() => {});

    const sizer = new ResizeObserver(() => scene?.resize());
    sizer.observe(node);

    return () => {
      alive = false;
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
    hidden,
    painted,
    ride,
    bind,
  };
}
