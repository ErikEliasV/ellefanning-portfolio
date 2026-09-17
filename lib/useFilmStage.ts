"use client";

import { useEffect, useRef, useState } from "react";
import { NARROW_QUERY, cursor, depth, geometry, trackVh } from "@/lib/filmStage";
import { isReduced, onTick } from "@/lib/scroll";

export function useFilmStage(count: number) {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const cut = useRef<HTMLDivElement>(null);
  const curtain = useRef<HTMLSpanElement>(null);

  const [active, setActive] = useState(0);
  const [lock, setLock] = useState(0);

  const lastLock = useRef(0);

  useEffect(() => {
    let vh = 0;
    let pitch = 0;
    let cardW = 0;
    let splitMax = 0;

    function paint() {
      const trackEl = track.current;
      const stageEl = stage.current;
      const railEl = rail.current;
      if (!trackEl || !stageEl || !railEl || vh === 0) return;

      const reduced = isReduced();
      const p = -trackEl.getBoundingClientRect().top / vh;
      const c = cursor(p, reduced);

      const set = (name: string, value: string) =>
        trackEl.style.setProperty(name, value);

      set("--curtain", c.curtain.toFixed(4));
      set("--rise", c.rise.toFixed(4));
      set("--split", `${(c.split * splitMax).toFixed(2)}px`);
      set("--fall", c.fall.toFixed(4));

      for (let i = 0; i < count; i += 1) {
        const card = railEl.children[i] as HTMLElement | undefined;
        if (!card) continue;

        const d = depth(i, c.u);
        if (!d.live) {
          card.style.visibility = "hidden";
          continue;
        }

        // O primeiro pôster sobe pelo vão que a palavra acabou de abrir. São
        // 120% da própria altura, não 100%: o card é centrado na tela, então
        // empurrá-lo só uma altura deixaria o topo dele aparecendo na borda de
        // baixo antes da hora.
        const lift = i === 0 ? (1 - c.enter) * 120 : 0;

        card.style.visibility = "visible";
        card.style.transform =
          `translate3d(${(d.offset * pitch).toFixed(2)}px, ${lift.toFixed(2)}%, 0)` +
          ` scale(${d.scale.toFixed(4)})`;
        card.style.filter = reduced || d.blur < 0.1 ? "" : `blur(${d.blur.toFixed(2)}px)`;
      }

      // FILMO branca só aparece onde há pôster atrás dela. O recorte segue a caixa do
      // card mais próximo — ao passo de 48vw nunca há dois sobre a palavra ao mesmo
      // tempo, então "o mais próximo" é exato, não aproximação. As bordas saem da
      // matemática, nunca de getBoundingClientRect: custo zero por frame.
      const cutEl = cut.current;
      if (cutEl) {
        const box = cutEl.getBoundingClientRect();
        const mid = window.innerWidth / 2;

        let near = 0;
        let best = Infinity;
        for (let i = 0; i < count; i += 1) {
          const gap = Math.abs(i - c.u);
          if (gap < best) { best = gap; near = i; }
        }

        const d = depth(near, c.u);
        const half = (cardW * d.scale) / 2;
        const cx = mid + d.offset * pitch;

        const l = Math.min(Math.max(cx - half - box.left, 0), box.width);
        const r = Math.min(Math.max(box.right - (cx + half), 0), box.width);

        set("--cut-l", `${l.toFixed(2)}px`);
        set("--cut-r", `${r.toFixed(2)}px`);
      }

      if (c.lock !== lastLock.current) {
        lastLock.current = c.lock;
        setLock(c.lock);
        // O contador e o ano trocam em corte duro, no instante da trava, e
        // seguram o último valor enquanto o próximo está em trânsito.
        if (c.lock >= 0) setActive(c.lock);
      }
    }

    const narrow = window.matchMedia(NARROW_QUERY);

    function measure() {
      const trackEl = track.current;
      if (!trackEl) return;

      const vw = window.innerWidth;
      const g = geometry(narrow.matches);

      vh = window.innerHeight;
      pitch = g.pitchVw * vw;
      cardW = g.widthVw * vw;
      splitMax = g.splitVw * vw;

      trackEl.style.setProperty("--card-w", `${cardW.toFixed(2)}px`);
      trackEl.style.setProperty("--card-h", `${(cardW * g.ratio).toFixed(2)}px`);
      trackEl.style.height = `${vh * trackVh(isReduced())}px`;
      paint();
    }

    measure();
    const untick = onTick(paint);
    window.addEventListener("resize", measure);
    narrow.addEventListener("change", measure);

    return () => {
      untick();
      window.removeEventListener("resize", measure);
      narrow.removeEventListener("change", measure);
    };
  }, [count]);

  return { track, stage, rail, cut, curtain, active, lock };
}
