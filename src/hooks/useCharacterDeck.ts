"use client";

import { useEffect, useRef, useState } from "react";
import {
  NARROW_QUERY,
  SPIN_REST,
  carousel,
  deckGeometry,
  entryLockAt,
  lockAt,
  pose,
  reel,
  reelPhases,
  reelTarget,
  spin,
  trackVh,
  wrap,
  type Spin,
} from "@/lib/motion/characterDeck";
import { glideTo, isReduced, onTick, scrollTo, stopGlide } from "@/lib/scroll";
import { swipe as bindSwipe } from "@/lib/swipe";
import { onViewport, smallViewportHeight } from "@/lib/viewport";

const HAZE_STEP = 0.5;

const SPIN_STEP_MAX = 100;

const SNAP_S = 0.55;
const EDGE_PX = 2;

export function useCharacterDeck(count: number, paused: boolean) {
  const track = useRef<HTMLDivElement>(null);
  const deck = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);

  const [active, setActive] = useState(0);
  const lastActive = useRef(0);

  const clock = useRef<Spin>(SPIN_REST);
  const hold = useRef({ hover: false, focus: false, paused: false });

  useEffect(() => {
    hold.current.paused = paused;
  }, [paused]);

  useEffect(() => {
    const narrow = window.matchMedia(NARROW_QUERY);

    let vh = 0;
    let cardH = 0;
    let slotPx = 1;

    function measure() {
      const trackEl = track.current;
      const deckEl = deck.current;
      if (!trackEl || !deckEl) return;

      vh = smallViewportHeight();
      cardH = deckEl.offsetHeight;

      slotPx = deckGeometry(true).reach * cardH || 1;

      const phone = narrow.matches;
      const reduced = isReduced();
      trackEl.style.height = `${vh * trackVh(phone, reduced)}px`;
      trackEl.dataset.entry = String(vh * entryLockAt(phone, reduced));
    }

    let last = 0;

    function paint(now?: number) {
      const trackEl = track.current;
      const railEl = rail.current;
      if (!trackEl || !railEl || vh === 0) return;

      const reduced = isReduced();
      const phone = narrow.matches;
      const p = -trackEl.getBoundingClientRect().top / vh;
      const c = phone ? reel(p, reduced) : carousel(p, clock.current);

      const set = (name: string, value: string) =>
        trackEl.style.setProperty(name, value);

      set("--wipe", c.wipe.toFixed(4));
      set("--enter", c.enter.toFixed(4));
      set("--rise", c.rise.toFixed(4));
      set("--lift", c.lift.toFixed(4));
      set("--leave", c.leave.toFixed(4));
      set("--settle", c.settle.toFixed(4));
      set("--drift", c.drift.toFixed(3));

      const card = (i: number) => railEl.children[i] as HTMLElement | undefined;

      const k = deckGeometry(phone);
      const persp = (k.persp * cardH).toFixed(0);

      for (let i = 0; i < count; i += 1) {
        const el = card(i);
        if (!el) continue;
        const q = pose(phone ? i - c.u : wrap(i - c.u), k);

        el.style.transform =
          `translate(calc(-50% + ${(q.x * cardH).toFixed(2)}px), -50%)` +
          ` scale(${q.scale.toFixed(4)})` +
          ` perspective(${persp}px)` +
          ` rotateY(${q.turn.toFixed(3)}deg)`;

        el.style.zIndex = String(q.z);

        const haze = Math.round((q.haze * cardH) / HAZE_STEP) * HAZE_STEP;
        el.style.setProperty("--haze", `${haze}px`);
        el.style.setProperty("--side", String(q.side));
        el.style.setProperty("--shade", q.shade.toFixed(4));
      }

      if (c.active !== lastActive.current) {
        lastActive.current = c.active;
        setActive(c.active);
      }

      if (now === undefined) return;
      const ms = last ? Math.min(now - last, SPIN_STEP_MAX) : 0;
      last = now;
      if (phone || c.rise <= 0 || c.lift >= 1) return;

      const { hover, focus, paused: shut } = hold.current;
      clock.current = spin(clock.current, ms, hover || focus || shut, reduced);
    }

    measure();
    paint();

    const untick = onTick(paint);
    const unwatch = onViewport(() => {
      measure();
      paint();
    });

    const watchDeck = new ResizeObserver(() => {
      measure();
      paint();
    });
    if (deck.current) watchDeck.observe(deck.current);

    const deckEl = deck.current;
    const railEl = rail.current;

    const aim = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !deckEl) return;
      const box = deckEl.getBoundingClientRect();
      hold.current.hover =
        event.clientX >= box.left &&
        event.clientX <= box.right &&
        event.clientY >= box.top &&
        event.clientY <= box.bottom;
    };

    const away = () => {
      hold.current.hover = false;
    };

    const focusIn = (event: FocusEvent) => {
      const target = event.target;
      const visible =
        target instanceof Element && target.matches(":focus-visible");
      hold.current.focus = visible;
      if (!visible || !narrow.matches || !railEl) return;
      const index = Array.prototype.indexOf.call(railEl.children, target);
      if (index >= 0) goTo(lockAt(index, isReduced()), SNAP_S);
    };

    const focusOut = () => {
      hold.current.focus = false;
    };

    function progressAt() {
      const trackEl = track.current;
      return trackEl && vh ? -trackEl.getBoundingClientRect().top / vh : 0;
    }

    function goTo(p: number, seconds: number) {
      const trackEl = track.current;
      if (!trackEl || !vh) return;
      const end = reelPhases(isReduced()).lift.to;
      const top = trackEl.getBoundingClientRect().top + window.scrollY;
      const y = top + Math.min(Math.max(p, 0), end) * vh;
      if (seconds > 0) glideTo(y, seconds);
      else scrollTo(y, { immediate: true });
    }

    const trackNode = track.current;
    let from = 0;
    let raw = 0;
    const unswipe = trackNode
      ? bindSwipe(trackNode, {
          can: () => {
            if (!narrow.matches || hold.current.paused) return false;
            const p = progressAt();
            const slack = EDGE_PX / vh;
            return p >= -slack && p <= reelPhases(isReduced()).lift.to + slack;
          },
          start: () => {
            stopGlide();
            from = progressAt();
            raw = from;
          },
          move: (dx) => {
            raw = from - (dx / slotPx) * reelPhases(isReduced()).cycle;
            goTo(raw, 0);
          },
          end: (velocity) => {
            const reduced = isReduced();
            const at = Math.min(Math.max(raw, 0), reelPhases(reduced).lift.to);
            goTo(reelTarget(at, -velocity / slotPx, reduced), SNAP_S);
          },
        })
      : () => {};

    deckEl?.addEventListener("pointermove", aim, { passive: true });
    deckEl?.addEventListener("pointerleave", away, { passive: true });
    railEl?.addEventListener("focusin", focusIn);
    railEl?.addEventListener("focusout", focusOut);

    return () => {
      untick();
      unwatch();
      watchDeck.disconnect();
      stopGlide();
      deckEl?.removeEventListener("pointermove", aim);
      deckEl?.removeEventListener("pointerleave", away);
      unswipe();
      railEl?.removeEventListener("focusin", focusIn);
      railEl?.removeEventListener("focusout", focusOut);
    };
  }, [count]);

  return { track, deck, rail, active };
}
