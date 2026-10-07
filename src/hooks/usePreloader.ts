"use client";

import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";
import { release as openSound } from "@/lib/audio";
import { lockScroll, onTick, scrollTo } from "@/lib/scroll";

const SIGNALS = 3;
// Era 900ms. O número agora cresce de 26vh a 129vh enquanto conta, e a
// travessia precisa de tempo de tela para ser lida como um movimento em vez
// de um salto.
const MIN_MS = 1500;
const CEIL_MS = 6000;
const HOLD_MS = 360;
const EXIT_MS = 420;
const CHASE = 0.11;

export const PLATE = "/images/ellefanning-preloader.webp";

export type PreloaderPhase = "loading" | "ready" | "exit" | "done";

export function usePreloader() {
  const plate = useRef<HTMLDivElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const [phase, setPhase] = useState<PreloaderPhase>("loading");

  useEffect(() => {
    const node = plate.current;
    if (!node) return;

    lockScroll(true);
    history.scrollRestoration = "manual";
    // force, because the lock has already stopped Lenis by this point.
    scrollTo(0, { immediate: true, force: true });

    // Sem o botão Enter não há mais um clique garantido para abrir a trilha, e
    // o portão cai aqui, na montagem. O navegador ainda pode recusar o play
    // sem gesto -- quem cobre esse caso são os ouvintes de gesto que listen()
    // mantém no site inteiro (lib/audio.ts).
    openSound();

    const start = performance.now();
    const timers: number[] = [];

    let live = true;
    let untick: (() => void) | null = null;
    let landed = 0;
    let shown = 0;
    let armed = false;
    let left = false;

    function land() {
      if (live) landed = Math.min(landed + 1, SIGNALS);
    }

    function typeset() {
      if (live && node) node.dataset.typeset = "";
      land();
    }

    function paint() {
      if (!node) return;
      node.style.setProperty("--pre-p", shown.toFixed(4));
      const text = String(Math.round(shown * 100)).padStart(3, "0");
      const slot = readout.current;
      if (!slot) return;

      const cells = slot.children;
      if (cells.length !== text.length) {
        slot.textContent = text;
        return;
      }

      for (let at = 0; at < text.length; at += 1) {
        const cell = cells[at];
        if (cell.textContent !== text[at]) cell.textContent = text[at];
      }
    }

    function leave() {
      if (!live || left) return;
      left = true;
      // Sair e o fim da contagem: parar o tique aqui (e nao so em `tick`)
      // fecha o caminho em que a rede de seguranca abaixo tira a placa, a aba
      // volta a ter foco, o rAF destravado alcanca 100% e `arm()` remontaria
      // o preloader por cima de uma pagina ja liberada.
      untick?.();
      untick = null;
      // The curtain and the hero entry overlap on purpose: the name is already
      // resolving behind the plate as it lifts, so the two read as one move.
      document.documentElement.dataset.entered = "";
      setPhase("exit");
      timers.push(
        window.setTimeout(() => {
          if (!live) return;
          scrollTo(0, { immediate: true, force: true });
          lockScroll(false);
          setPhase("done");
        }, EXIT_MS),
      );
    }

    // O 100% precisa de uma batida parado antes de a cortina subir, senão o
    // número chega ao fim e sai de cena no mesmo quadro.
    function arm() {
      if (left || armed) return;
      armed = true;
      untick?.();
      untick = null;
      setPhase("ready");
      timers.push(window.setTimeout(leave, HOLD_MS));
    }

    function tick(now: number) {
      const goal = Math.min(landed / SIGNALS, (now - start) / MIN_MS, 1);
      shown += (goal - shown) * CHASE;
      if (goal - shown < 0.002) shown = goal;
      paint();
      if (shown >= 1) arm();
    }

    document.fonts.ready.then(typeset, typeset);

    // A chapa de fundo é o que precisa estar pronto para a cena existir, então
    // é ela que vale como sinal -- o mesmo URL que a <img> do plate pede, logo
    // é uma requisição só.
    const backdrop = document.createElement("img");
    backdrop.src = asset(PLATE);
    backdrop.decode().then(land, land);

    if (document.readyState === "complete") {
      land();
    } else {
      window.addEventListener("load", land, { once: true });
    }

    timers.push(
      window.setTimeout(() => {
        landed = SIGNALS;
      }, CEIL_MS),
    );

    // A rede de seguranca. `tick` corre no rAF compartilhado, e aba em segundo
    // plano suspende rAF: a contagem congela onde estava, `arm()` nunca
    // dispara e o scroll -- travado na montagem -- fica travado para sempre
    // para quem abriu o site numa aba de fundo e so voltou depois. Um
    // temporizador de tarefa nao e suspenso, entao passado o teto dos sinais
    // mais a duracao minima da contagem e a batida do 100%, a placa sai de
    // qualquer jeito. No caminho normal (~1,9s) isto nunca chega a disparar, e
    // `leave()` ja e idempotente pelo proprio `left`.
    timers.push(window.setTimeout(leave, CEIL_MS + MIN_MS + HOLD_MS));

    untick = onTick(tick);

    return () => {
      live = false;
      untick?.();
      timers.forEach((id) => clearTimeout(id));
      window.removeEventListener("load", land);
      lockScroll(false);
    };
  }, []);

  return { plate, readout, phase };
}
