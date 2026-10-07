"use client";

import { useEffect, useRef, useState } from "react";
import type { Geometry } from "@/lib/motion/filmStage";
import { CURTAIN_OUT, NARROW_QUERY, canSkip, cursor, depth, geometry, trackVh } from "@/lib/motion/filmStage";
import { isReduced, onTick } from "@/lib/scroll";
import { onViewport, smallViewportHeight } from "@/lib/viewport";
import { reelTick } from "@/lib/audio";

const STRIDE = 80;
const TRAVEL_EMPHASIS = 0.4;

function wordNudge(trackEl: HTMLElement, g: Geometry) {
  if (g.axis !== "y") return 0;
  const back = trackEl.querySelector<HTMLElement>(".film-word-back .film-word");
  const front = trackEl.querySelector<HTMLElement>(".film-word-front .film-word");
  if (!back || !front) return 0;
  return (back.offsetWidth - front.offsetWidth) / 2;
}

export function useFilmStage(count: number) {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const cut = useRef<HTMLDivElement>(null);
  const curtain = useRef<HTMLSpanElement>(null);

  const [active, setActive] = useState(0);
  const [lock, setLock] = useState(0);

  const lastLock = useRef(0);
  const lastIndex = useRef(-1);
  const lastIntro = useRef<boolean | null>(null);
  const kickTimer = useRef(0);
  const kickCard = useRef<HTMLElement | null>(null);
  const lastNotch = useRef(0);

  useEffect(() => {
    const narrow = window.matchMedia(NARROW_QUERY);

    let vh = 0;
    let pitch = 0;
    let cardW = 0;
    let cardH = 0;
    let splitMax = 0;
    let geo: Geometry = geometry(narrow.matches);

    function paint() {
      const trackEl = track.current;
      const stageEl = stage.current;
      const railEl = rail.current;
      if (!trackEl || !stageEl || !railEl || vh === 0) return;

      const reduced = isReduced();
      const p = -trackEl.getBoundingClientRect().top / vh;
      const c = cursor(p, reduced, narrow.matches);

      const set = (name: string, value: string) =>
        trackEl.style.setProperty(name, value);

      const splitPx = c.split * splitMax;

      set("--curtain", c.curtain.toFixed(4));
      set("--rise", c.rise.toFixed(4));
      set("--split", `${splitPx.toFixed(2)}px`);
      set("--fall", c.fall.toFixed(4));
      set("--reveal", c.reveal.toFixed(4));

      const curtainEl = curtain.current;
      if (curtainEl) {
        if (p < CURTAIN_OUT) curtainEl.dataset.on = "";
        else delete curtainEl.dataset.on;
      }

      if (canSkip(p, reduced, narrow.matches)) trackEl.dataset.skip = "";
      else delete trackEl.dataset.skip;

      const shift = c.u * pitch;
      const notch = Math.floor(shift / STRIDE);
      if (notch !== lastNotch.current) {
        lastNotch.current = notch;
        reelTick(notch, c.u / (count - 1), TRAVEL_EMPHASIS);
      }

      for (let i = 0; i < count; i += 1) {
        const card = railEl.children[i] as HTMLElement | undefined;
        if (!card) continue;

        const d = depth(i, c.u, geo);
        if (!d.live || (i > 0 && c.enter < 1)) {
          card.style.visibility = "hidden";
          continue;
        }

        const lift = i === 0 ? (1 - c.enter) * 1.2 * cardH : 0;
        const along = d.offset * pitch;

        card.style.visibility = "visible";
        card.style.transform =
          (geo.axis === "y"
            ? `translate3d(0, ${(along + lift).toFixed(2)}px, 0)`
            : `translate3d(${along.toFixed(2)}px, ${lift.toFixed(2)}px, 0)`) +
          ` scale(${d.scale.toFixed(4)})`;

        const grade: string[] = [];
        if (!reduced && d.blur >= 0.1) grade.push(`blur(${d.blur.toFixed(2)}px)`);
        if (d.fade >= 0.01) grade.push(`saturate(${(1 - d.fade).toFixed(3)})`);
        card.style.filter = grade.join(" ");
      }

      const cutEl = cut.current;
      if (cutEl && cutEl.offsetWidth) {
        const box = cutEl.getBoundingClientRect();
        const stageBox = stageEl.getBoundingClientRect();
        const mid = box.right + splitPx;

        let near = 0;
        let best = Infinity;
        for (let i = 0; i < count; i += 1) {
          const gap = Math.abs(i - c.u);
          if (gap < best) { best = gap; near = i; }
        }

        const d = depth(near, c.u, geo);
        const half = (cardW * d.scale) / 2;
        const cx = mid + d.offset * pitch;

        const liftNear = near === 0 ? (1 - c.enter) * 1.2 * cardH : 0;
        const halfH = (cardH * d.scale) / 2;
        const cy = stageBox.top + stageBox.height / 2 + liftNear;
        const overlapsVertically = cy + halfH > box.top && cy - halfH < box.bottom;

        const l = overlapsVertically
          ? Math.min(Math.max(cx - half - box.left, 0), box.width)
          : box.width;
        const r = overlapsVertically
          ? Math.min(Math.max(box.right - (cx + half), 0), box.width)
          : 0;

        set("--cut-l", `${l.toFixed(2)}px`);
        set("--cut-r", `${r.toFixed(2)}px`);
      }

      if (c.lock !== lastLock.current) {
        if (c.lock >= 0) {
          reelTick(c.lock, c.lock / (count - 1));
          const card = rail.current?.children[c.lock] as HTMLElement | undefined;
          if (card && !isReduced()) {
            const back = lastIndex.current >= 0 && c.lock < lastIndex.current;
            card.dataset.kick = back ? "-" : "+";
            const prev = kickCard.current;
            if (prev && prev !== card) delete prev.dataset.kick;
            window.clearTimeout(kickTimer.current);
            kickCard.current = card;
            kickTimer.current = window.setTimeout(() => {
              delete card.dataset.kick;
              kickCard.current = null;
            }, 120);
          }
          lastIndex.current = c.lock;
        }

        lastLock.current = c.lock;
        setLock(c.lock);
        if (c.lock >= 0) setActive(c.lock);
      }

      const introNow = c.u === 0 && c.lock === -1;
      if (introNow !== lastIntro.current) {
        lastIntro.current = introNow;
        if (introNow) setActive(0);
      }
    }

    function measure() {
      const trackEl = track.current;
      if (!trackEl) return;

      const vw = window.innerWidth;
      const g = geometry(narrow.matches);
      geo = g;

      vh = smallViewportHeight();
      pitch = g.pitch * (g.axis === "y" ? vh : vw);
      cardW = g.widthVw * vw;
      if (g.heightVh) cardW = Math.min(cardW, (g.heightVh * vh) / g.ratio);
      cardH = cardW * g.ratio;
      splitMax = g.splitVw * vw;

      trackEl.style.setProperty("--card-w", `${cardW.toFixed(2)}px`);
      trackEl.style.setProperty("--card-h", `${cardH.toFixed(2)}px`);
      trackEl.style.setProperty(
        "--card-shift",
        `${((g.centerVh ?? 0) * vh).toFixed(2)}px`,
      );
      trackEl.style.setProperty("--word-nudge", `${wordNudge(trackEl, g).toFixed(2)}px`);
      trackEl.style.height = `${vh * trackVh(isReduced(), narrow.matches)}px`;
      paint();
    }

    let live = true;
    measure();
    document.fonts.ready.then(() => {
      if (live) measure();
    });
    const untick = onTick(paint);
    const unwatch = onViewport(measure);
    narrow.addEventListener("change", measure);

    return () => {
      live = false;
      untick();
      unwatch();
      narrow.removeEventListener("change", measure);
      window.clearTimeout(kickTimer.current);
      if (kickCard.current) delete kickCard.current.dataset.kick;
    };
  }, [count]);

  return { track, stage, rail, cut, curtain, active, lock };
}
