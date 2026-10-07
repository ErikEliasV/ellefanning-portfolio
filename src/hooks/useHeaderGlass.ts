"use client";

import gsap from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";

import { asset } from "@/lib/asset";
import { isNarrow, phases, trackVh } from "@/lib/motion/filmStage";
import { DROP_SPAN, gooPath } from "@/lib/motion/headerGoo";
import { isLocked, isReduced, onTick, scrollTo } from "@/lib/scroll";
import { SECTIONS } from "@/data/sections";
import type { Liquid, Media } from "@/lib/webgl/headerLiquid";
import type { SectionId } from "@/data/sections";

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
// A gota da barra recolhida corre atras do mouse de longe -- ele esta la no
// meio da pagina, nao em cima dela --, entao arrasta um pouco mais que a
// bolha: le como liquido escorrendo pela borda, nao como um cursor.
const DROP_FOLLOW = 0.55;

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
// --duration-anchor, o token que o projeto ja reserva para salto de ancora.
const RIDE_S = 1.6;

type Feed = { media: Media; focus: number; push: number };

function metric(styles: CSSStyleDeclaration, name: string) {
  return Number.parseFloat(styles.getPropertyValue(name)) || 0;
}

// O link FILMOGRAPHY do header pula a abertura inteira (cortina, palavra
// subindo, vao se abrindo) e pousa direto no ponto em que o 1o filme ja esta
// travado no centro da tela — em vez do topo da secao, que e a cortina/tela
// branca do meio da transicao. Esse ponto e `phases().reel.from`: o `p` em
// que `cursor().lock` passa a valer 0 pela primeira vez (ver lib/filmStage.ts).
//
// `p` e medido em multiplos de vh a partir do topo de `.film-track`
// (`p = -trackTop/vh`), e o vh real e o mesmo que lib/useFilmStage.ts mediu
// para dimensionar a trilha (`smallViewportHeight()`, nao `innerHeight` —
// a barra de URL do celular muda um do outro). Em vez de duplicar aquela
// medicao aqui, este helper le a altura JA APLICADA em `.film-track` (em
// px, escrita por aquele hook) e divide por `trackVh()` para recuperar o
// mesmo vh, garantindo que os dois lados concordem sem medir duas vezes.
function filmEntryTarget(): string | number {
  const track = document.querySelector<HTMLElement>(".film-track");
  if (!track) return "#filmography";

  const reduced = isReduced();
  const narrow = isNarrow();
  const rect = track.getBoundingClientRect();
  const vh = rect.height / trackVh(reduced, narrow);
  if (!vh) return "#filmography";

  const trackTop = rect.top + window.scrollY;
  return trackTop + phases(reduced, narrow).reel.from * vh;
}

// O mesmo problema do filmEntryTarget acima, para a entrada de CHARACTERS: o
// topo de `.character-section` nao e a secao, e a tela branca em que a emenda
// com a filmografia ainda nem comecou -- e pior, ela sobe 100svh para dentro do
// rabo daquela secao, entao `#characters` pousa dentro do palco alheio. O alvo
// e a primeira personagem travada no centro, com a legenda ja assentada.
//
// A resposta vem PRONTA, em px a partir do topo da trilha, escrita por
// lib/useCharacterDeck.ts na mesma medicao que dimensionou a trilha. Aqui saia
// uma reconstrucao -- lia-se a altura aplicada, dividia-se por `trackVh()` para
// recuperar o vh e multiplicava-se por `entryLockAt()`. Isso parou de funcionar
// quando a altura da secao passou a depender de quantas fotos cabem por lado no
// trilho, que e medido contra a caixa do titulo: este lado nao tem como chegar
// aquele numero. Ler a resposta em vez de refaze-la tambem acaba com a chance
// de os dois lados discordarem, que era o risco que o comentario antigo
// confessava.
function characterEntryTarget(): string | number {
  const track = document.querySelector<HTMLElement>(".character-track");
  if (!track) return "#characters";

  const entry = Number(track.dataset.entry);
  if (!Number.isFinite(entry) || entry <= 0) return "#characters";

  return track.getBoundingClientRect().top + window.scrollY + entry;
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
  // Ultimo x do mouse na viewport, para a gota nascer ja acima dele quando a
  // barra recolhe, e onde a gota pende, em x da caixa. `null` e o meio: e o
  // --hdr-drop-x de partida do CSS, e o loop da gosma le o mesmo ref.
  const hand = useRef<number | null>(null);
  const hang = useRef<number | null>(null);

  const open = hot !== null;

  // Descer nao leva mais a barra embora, em nenhuma secao -- a hero inclusive:
  // ela sobe ate sobrar so a borda de baixo e uma gota no meio
  // (styles/header.css), para o header continuar dizendo que esta ali e pode
  // ser usado. No celular o mesmo estado tira a musica e deixa o menu so com o
  // icone.
  const tucked = hidden;

  // Espelhos, para o loop da gosma ler o estado sem remontar a cada mudanca.
  const live = useRef({ open: false, awake: false, tucked: false });
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
    dropW: 0,
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
        // Recolhida, a barra so mostra a borda: o Tab que chega num link
        // precisa traze-la inteira, senao o foco cai num texto fora da tela.
        setHidden(false);
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
    live.current.tucked = tucked;
  }, [open, awake, tucked]);

  // O mesmo recolher precisa alcancar dois elementos que NAO moram dentro de
  // <header>: o botao do menu e o pill de musica, que no celular sentam no
  // alto da tela mas sao fixos por conta propria (o .hdr tem `transform`, e
  // isso o torna bloco de contencao de qualquer `fixed` que caia dentro dele
  // -- por isso eles ficam de fora). Com o atributo, a musica sai e o menu
  // encolhe para so o icone.
  useEffect(() => {
    const root = document.documentElement;
    if (tucked) root.dataset.chromeHidden = "";
    else delete root.dataset.chromeHidden;

    return () => {
      delete root.dataset.chromeHidden;
    };
  }, [tucked]);

  useEffect(() => {
    const track = (event: PointerEvent) => {
      if (event.pointerType === "mouse") hand.current = event.clientX;
    };

    window.addEventListener("pointermove", track, { passive: true });
    return () => window.removeEventListener("pointermove", track);
  }, []);

  // A gota segue o mouse de lado a lado, so enquanto a barra esta recolhida:
  // aberta, ela vale 0 e mexer no --hdr-drop-x so repintaria o vidro a toa.
  // Ao soltar, ela fica onde estava e encolhe ali mesmo. No toque nao ha
  // ponteiro para seguir, e com movimento reduzido ela fica no meio.
  useEffect(() => {
    const node = shell.current;
    if (!node || !tucked || isReduced()) return;

    const styles = getComputedStyle(node);

    // Presa entre as quinas: com meia gota para cada lado, a cauda dela acaba
    // exatamente na ponta da barra e nunca passa dela.
    const place = (clientX: number | null) => {
      const rect = node.getBoundingClientRect();
      if (clientX === null) return rect.width / 2;
      const edge =
        metric(styles, "--hdr-wing") +
        DROP_SPAN * metric(styles, "--hdr-bump-w");
      return Math.min(
        Math.max(clientX - rect.left, edge),
        rect.width - edge,
      );
    };

    const glide = { x: hang.current ?? place(null) };
    const write = () => {
      hang.current = glide.x;
      node.style.setProperty("--hdr-drop-x", `${glide.x.toFixed(1)}px`);
    };

    // A gota que ainda nao apareceu nasce acima do mouse; uma que ainda
    // encolhia de um recolher anterior sai de onde esta, sem salto.
    if (metric(styles, "--hdr-bump") < 1) {
      glide.x = place(hand.current);
      write();
    }

    const toX = gsap.quickTo(glide, "x", {
      duration: DROP_FOLLOW,
      ease: FOLLOW_EASE,
      onUpdate: write,
    });
    toX(place(hand.current));

    const follow = (event: PointerEvent) => {
      if (event.pointerType === "mouse") toX(place(event.clientX));
    };

    window.addEventListener("pointermove", follow, { passive: true });

    return () => {
      window.removeEventListener("pointermove", follow);
      gsap.killTweensOf(glide);
    };
  }, [tucked]);

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
    // A barra que o ponteiro chamou pela faixa do topo fica, e a rolagem nao a
    // leva enquanto ninguem pedir outra coisa. O Lenis (LERP 0.06,
    // lib/scroll.ts) continua descendo a pagina por quase dois segundos depois
    // da ultima roda, e cada quadro desse rastro chegava aqui como "desceu":
    // recolhia o que o ponteiro acabara de trazer, o proximo pointermove
    // trazia de novo, e a barra entrava e saia ate o Lenis parar.
    let held = false;
    let pointerY = Number.POSITIVE_INFINITY;

    // Desce, recolhe; sobe ou volta ao topo, reaparece. E com o painel aberto e a
    // pagina correndo por baixo, o preview e o conteudo contam duas historias
    // ao mesmo tempo, entao rolar tambem fecha.
    const drift = () => {
      const y = window.scrollY;
      const down = y > mark;
      mark = y;

      if (at.current) shut();
      if (held) return;
      setHidden(down && y > HIDE_AFTER);
    };

    // So um gesto novo fora da faixa solta a barra: a roda, o clique ou a
    // tecla que vem depois e intencao nova de rolar, o rastro nao. A roda e o
    // clique trazem a posicao do ponteiro; a tecla usa a ultima conhecida.
    const release = (event: Event) => {
      if (event instanceof MouseEvent) pointerY = event.clientY;
      if (pointerY > PEEK) held = false;
    };

    // A faixa do topo devolve o header sem precisar rolar para tras. Mas com a
    // tela travada por um modal o header esta atras dele, inerte e invisivel:
    // o ponteiro que passa por essa faixa esta a caminho de outra coisa (o
    // botao de fechar do modal do filme mora a 9.1vh, dentro dos PEEK px), e
    // nao pedindo o header de volta. Sem esta guarda, abrir um filme com a
    // barra escondida e fechar pelo botao deixava o header plantado no topo,
    // porque o gesto de fechar tinha desligado o hidden por baixo do modal.
    const peek = (event: PointerEvent) => {
      pointerY = event.clientY;
      if (isLocked()) return;
      if (event.clientY > PEEK) return;
      held = true;
      setHidden(false);
    };

    node.addEventListener("pointerenter", arrive, { passive: true });
    node.addEventListener("pointerleave", leave, { passive: true });
    node.addEventListener("focusout", away);
    window.addEventListener("keydown", escape);
    window.addEventListener("scroll", drift, { passive: true });
    window.addEventListener("pointermove", peek, { passive: true });
    window.addEventListener("wheel", release, { passive: true });
    window.addEventListener("pointerdown", release, { passive: true });
    window.addEventListener("keydown", release);

    return () => {
      window.clearTimeout(openAt.current);
      window.clearTimeout(shutAt.current);
      node.removeEventListener("pointerenter", arrive);
      node.removeEventListener("pointerleave", leave);
      node.removeEventListener("focusout", away);
      window.removeEventListener("keydown", escape);
      window.removeEventListener("scroll", drift);
      window.removeEventListener("pointermove", peek);
      window.removeEventListener("wheel", release);
      window.removeEventListener("pointerdown", release);
      window.removeEventListener("keydown", release);
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
    // A bolha nasce em zero e cresce ate a amplitude do estado: comecar ja na
    // altura cheia fazia ela estalar na borda no primeiro quadro, porque o
    // recorte do CSS que o loop substitui e reto. `presence` e o mesmo
    // cuidado para a barra que recolhe ou sai: a bolha (e o solavanco junto)
    // derrete ate zero em vez de ficar pendurada na faixa que sobra no topo.
    const shape = {
      reveal: 0,
      amp: 0,
      presence: live.current.tucked ? 0 : 1,
    };
    // Vivo: le o --hdr-bump da transicao do CSS a cada quadro sem pedir um
    // objeto novo.
    const styles = getComputedStyle(node);
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
    const toPresence = gsap.quickTo(shape, "presence", {
      duration: AMP_S,
      ease: SHAPE_EASE,
    });

    const gauge = () => {
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
        dropW: metric(styles, "--hdr-bump-w"),
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

      const { bar, tall, lip, wing, roof, floor, side, width, dropW } =
        box.current;

      // Sem medida confiavel o recorte fica com o CSS: escrever um polygon com
      // altura zero apagaria o header inteiro.
      if (!bar || !tall || !width) return;

      const { open, awake, tucked } = live.current;
      toReveal(open ? tall : bar);
      // Sem o ponteiro a bolha volta a zero, que e o desenho do CSS em
      // repouso: antes ela ficava parada na altura cheia ate o loop acabar e
      // sumia de uma vez no quadro em que o recorte voltava ao CSS.
      toAmp(open ? OPEN_AMP : awake ? IDLE_AMP : 0);
      toPresence(tucked ? 0 : 1);

      // Decaimento por tempo, nao por frame: a 120Hz um fator por frame
      // morreria duas vezes mais rapido que a 60Hz.
      jolt.current *= Math.exp(-step * JOLT_DECAY);

      const bubble = (shape.amp + jolt.current * JOLT_AMP) * shape.presence;

      node.style.clipPath = gooPath({
        width,
        wing,
        lip,
        reveal: shape.reveal,
        amp: bubble,
        reach: REACH,
        time: clock,
        x: lens.x,
        y: lens.y,
        roof,
        floor,
        side,
        // A gota e do CSS (--hdr-bump, com a transicao dele): o loop so a
        // copia, no valor deste quadro. Com um dono so para a altura, o
        // contorno do JS e o do CSS nao tem como discordar na passagem.
        drop: metric(styles, "--hdr-bump"),
        dropW,
        dropX: hang.current ?? width / 2,
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

      // So devolve o recorte ao CSS quando o desenho do JS ja e o dele: barra
      // assentada e bolha abaixo de um pixel. A gota nao entra na conta
      // porque os dois lados a leem do mesmo lugar.
      const done =
        !awake && !open && Math.abs(shape.reveal - bar) < REST && bubble < REST;

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

    void import("@/lib/webgl/headerLiquid")
      .then(({ createLiquid }) => {
        if (!alive) return;

        scene = createLiquid({ canvas: node });
        if (!scene) return;

        liquid.current = scene;
        scene.resize();

        const waiting = feed.current;
        if (waiting) {
          scene.setMedia(waiting.media, waiting.focus, waiting.push);
          setPainted(true);
        }

        gsap.to(entry, { p: 1, duration: SHAPE_S, ease: "power4.out" });
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

    // Duas fitas bastam para o cross-fade, e o src so e atribuido no primeiro
    // hover daquela secao. Ate o clipe chegar o painel e so vidro: nao ha
    // imagem de espera, por pedido.
    const tape = [tapeA.current, tapeB.current][slot.current ^ 1];
    if (!tape) return;

    const next = SECTIONS.findIndex((item) => item.id === hot);
    // O sinal da diferenca de indice e o que da direcao a troca: ir de
    // FILMOGRAPHY para NOW empurra a onda num sentido, voltar empurra no outro.
    const push = Math.sign(next - seat.current);
    seat.current = next;
    slot.current ^= 1;

    const rolling = () => {
      if (tape.dataset.for !== section.id) return;
      feed.current = { media: tape, focus: section.focus, push };
      liquid.current?.setMedia(tape, section.focus, push);
      if (liquid.current) setPainted(true);
      tape.dataset.on = "";
      // Com movimento reduzido o clipe entra parado no primeiro quadro: o
      // painel continua dizendo o que e a secao, sem nada se mexendo.
      if (!isReduced()) void tape.play().catch(() => {});
    };

    if (tape.dataset.for !== section.id) {
      tape.dataset.for = section.id;
      tape.src = asset(section.clip);
      // Sem imagem cobrindo a espera, o unico jeito de encurta-la e deixar o
      // browser bufferizar com vontade assim que o src existe.
      tape.preload = "auto";
      tape.load();
    }

    tape.addEventListener("canplay", rolling, { once: true });
    if (tape.readyState >= 3) rolling();

    return () => {
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
      const alvo =
        id === "filmography"
          ? filmEntryTarget()
          : id === "characters"
            ? characterEntryTarget()
            : `#${id}`;

      scrollTo(alvo, {
        // immediate e a opcao que o Lenis expoe para pular a animacao; duration
        // 0 nao e documentado como salto.
        immediate: isReduced(),
        duration: RIDE_S,
        // A mesma quartica do resto do site: sai rapido, chega decidido, sem
        // repique. E o par em JS do cubic-bezier(.22, 1, .36, 1) do CSS.
        easing: (t: number) => 1 - Math.pow(1 - t, 4),
      });
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
    tucked,
    painted,
    ride,
    bind,
  };
}
