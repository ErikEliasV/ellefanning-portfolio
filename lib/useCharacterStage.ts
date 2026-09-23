"use client";

import { useEffect, useRef } from "react";
import { cursor, isDark, trackVh } from "@/lib/characterStage";
import { isReduced, onTick } from "@/lib/scroll";
import { onViewport, smallViewportHeight } from "@/lib/viewport";

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
    const unwatch = onViewport(measure);

    return () => {
      untick();
      unwatch();
    };
  }, []);

  return { track, stage };
}
