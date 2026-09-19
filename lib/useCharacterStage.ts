"use client";

import { useEffect, useRef } from "react";
import { cursor, isDark, trackVh } from "@/lib/characterStage";
import { isReduced, onTick } from "@/lib/scroll";

// Espelha `smallViewportHeight()` de lib/useFilmStage.ts, lib/useHeroMorph.ts e
// lib/useEditorialReel.ts (não está exportada de nenhuma das três). Sonda
// `100svh` com um elemento fora de tela e cai para `innerHeight` se o navegador
// não suportar -- é o padrão que o resto do site usa para não pular quando a
// barra de URL do celular recolhe ou expande. Esta é a quarta cópia; o lugar
// certo dela é lib/scroll.ts, mas migrar as outras três é mexer no hero, na
// filmografia e no editorial de uma vez, e não era isto que estava em jogo aqui.
function smallViewportHeight() {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:absolute;top:0;left:0;width:0;height:100svh;visibility:hidden;pointer-events:none";
  document.body.appendChild(probe);
  const height = probe.getBoundingClientRect().height;
  probe.remove();
  return height || window.innerHeight;
}

export function useCharacterStage() {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trackEl = track.current;
    if (!trackEl) return;

    let vh = 0;

    function measure() {
      if (!trackEl) return;
      vh = smallViewportHeight();
      trackEl.style.height = `${vh * trackVh(isReduced())}px`;
    }

    function paint() {
      if (!trackEl || vh === 0) return;

      const p = -trackEl.getBoundingClientRect().top / vh;
      const c = cursor(p, isReduced());

      trackEl.style.setProperty("--slide", c.slide.toFixed(4));
      trackEl.style.setProperty("--wipe", c.wipe.toFixed(4));

      // A pele do cursor é estado de scroll, e um setState por quadro para isto
      // custaria um render da seção inteira a 60/s -- mesma decisão que
      // useFilmStage toma para a cortina e para o skip. O atributo vai no palco
      // porque useCursor resolve a pele com closest(): posto aqui, ele cobre
      // tudo que estiver dentro. Enquanto o palco é branco não há atributo
      // nenhum, e o cursor fica na pele escura, que é a que se vê no branco.
      const stageEl = stage.current;
      if (stageEl) {
        if (isDark(c.wipe)) stageEl.dataset.cursorSkin = "invert";
        else delete stageEl.dataset.cursorSkin;
      }
    }

    measure();
    paint();

    const untick = onTick(paint);
    const sizer = new ResizeObserver(measure);
    sizer.observe(document.documentElement);

    return () => {
      untick();
      sizer.disconnect();
    };
  }, []);

  return { track, stage };
}
