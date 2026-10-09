"use client";

import gsap from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";

import { asset } from "@/lib/asset";
import { isNarrow, phases, trackVh } from "@/lib/motion/filmStage";
import { DROP_SPAN, gooPath } from "@/lib/motion/headerGoo";
import { isLocked, isReduced, onTick, scrollTo } from "@/lib/scroll";
import { designScale } from "@/lib/viewport";
import { SECTIONS } from "@/data/sections";
import type { Liquid, Media } from "@/lib/webgl/headerLiquid";
import type { SectionId } from "@/data/sections";

const INTENT = 90;
const GRACE = 180;

const FOLLOW = 0.34;
const FOLLOW_EASE = "power2";
const DROP_FOLLOW = 0.55;

const SPY_BAND = "-45% 0px -45% 0px";

const HIDE_AFTER = 160;
const PEEK = 120;

const IDLE_AMP = 26;
const OPEN_AMP = 34;
const JOLT_AMP = 40;
const REACH = 250;
const JOLT_DECAY = 1.15;
const SHAPE_S = 0.95;
const SHAPE_EASE = "power2";
const AMP_S = 1.15;
const REST = 0.6;
const ROOF_SHARE = 0.85;
const FLOOR_SHARE = 0.9;
const SIDE_SHARE = 0.85;
const RIDE_S = 1.6;

type Feed = { media: Media; focus: number; push: number };

function metric(styles: CSSStyleDeclaration, name: string) {
  return Number.parseFloat(styles.getPropertyValue(name)) || 0;
}

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
  const feed = useRef<Feed | null>(null);
  const seat = useRef(0);
  const slot = useRef(0);

  const fine = useRef(false);
  const spot = useRef({ x: 0, y: 0 });
  const hand = useRef<number | null>(null);
  const hang = useRef<number | null>(null);

  const open = hot !== null;

  const tucked = hidden;

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
    unit: 1,
  });

  const at = useRef<SectionId | null>(null);
  const openAt = useRef(0);
  const shutAt = useRef(0);

  const settle = useCallback((id: SectionId | null) => {
    if (at.current === id) return;
    at.current = id;
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
      if (!fine.current) return;

      window.clearTimeout(shutAt.current);
      window.clearTimeout(openAt.current);

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
        setHidden(false);
        settle(id);
      },
    }),
    [aim, settle],
  );

  useEffect(() => {
    live.current.open = open;
    live.current.awake = awake;
    live.current.tucked = tucked;
  }, [open, awake, tucked]);

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

  useEffect(() => {
    const node = shell.current;
    if (!node || !tucked || isReduced()) return;

    const styles = getComputedStyle(node);

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
    let held = false;
    let pointerY = Number.POSITIVE_INFINITY;

    const drift = () => {
      const y = window.scrollY;
      const down = y > mark;
      mark = y;

      if (at.current) shut();
      if (held) return;
      setHidden(down && y > HIDE_AFTER * designScale());
    };

    const release = (event: Event) => {
      if (event instanceof MouseEvent) pointerY = event.clientY;
      if (pointerY > PEEK * designScale()) held = false;
    };

    const peek = (event: PointerEvent) => {
      pointerY = event.clientY;
      if (isLocked()) return;
      if (event.clientY > PEEK * designScale()) return;
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

  useEffect(() => {
    const node = shell.current;
    if (!node || !busy || isReduced()) return;

    const lens = { ...spot.current };
    const shape = {
      reveal: 0,
      amp: 0,
      presence: live.current.tucked ? 0 : 1,
    };
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
        bar: metric(styles, "--hdr-h") || nav?.offsetHeight || 0,
        tall: metric(styles, "--hdr-open-h"),
        lip: metric(styles, "--hdr-lip"),
        roof:
          Math.min(metric(styles, "--hdr-lip"), metric(styles, "--hdr-top")) *
          ROOF_SHARE,
        floor: metric(styles, "--hdr-slack") * FLOOR_SHARE,
        wing: metric(styles, "--hdr-wing"),
        side: metric(styles, "--hdr-wing") * SIDE_SHARE,
        width: node.getBoundingClientRect().width,
        dropW: metric(styles, "--hdr-bump-w"),
        unit: designScale(),
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

      const { bar, tall, lip, wing, roof, floor, side, width, dropW, unit } =
        box.current;

      if (!bar || !tall || !width) return;

      const { open, awake, tucked } = live.current;
      toReveal(open ? tall : bar);
      toAmp((open ? OPEN_AMP : awake ? IDLE_AMP : 0) * unit);
      toPresence(tucked ? 0 : 1);

      jolt.current *= Math.exp(-step * JOLT_DECAY);

      const bubble = (shape.amp + jolt.current * JOLT_AMP * unit) * shape.presence;

      node.style.clipPath = gooPath({
        width,
        wing,
        lip,
        reveal: shape.reveal,
        amp: bubble,
        reach: REACH * unit,
        time: clock,
        x: lens.x,
        y: lens.y,
        roof,
        floor,
        side,
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
      node.style.removeProperty("clip-path");
    };
  }, [busy]);

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

    const tape = [tapeA.current, tapeB.current][slot.current ^ 1];
    if (!tape) return;

    const next = SECTIONS.findIndex((item) => item.id === hot);
    const push = Math.sign(next - seat.current);
    seat.current = next;
    slot.current ^= 1;

    const rolling = () => {
      if (tape.dataset.for !== section.id) return;
      feed.current = { media: tape, focus: section.focus, push };
      liquid.current?.setMedia(tape, section.focus, push);
      if (liquid.current) setPainted(true);
      tape.dataset.on = "";
      if (!isReduced()) void tape.play().catch(() => {});
    };

    if (tape.dataset.for !== section.id) {
      tape.dataset.for = section.id;
      tape.src = asset(section.clip);
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
        immediate: isReduced(),
        duration: RIDE_S,
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
