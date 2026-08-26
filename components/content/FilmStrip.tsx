"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { HoverClip } from "@/components/content/HoverClip";
import type { Film } from "@/lib/films";

type FilmStripProps = {
  films: readonly Film[];
  pace?: number;
  pull?: number;
  rise?: number;
};

const LANES = [
  { width: "clamp(148px, min(17vw, 25vh), 292px)", drop: 0, depth: 1 },
  { width: "clamp(110px, min(12vw, 18vh), 210px)", drop: 66, depth: 0.52 },
  { width: "clamp(128px, min(14.5vw, 21vh), 248px)", drop: 26, depth: 0.76 },
] as const;

const READ_MARK = 0.34;
const EXIT_ZONE = 0.14;
const EXIT_LIFT = 24;

function two(value: number) {
  return String(value).padStart(2, "0");
}

function clamp01(value: number) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

export function FilmStrip({
  films,
  pace = 1.25,
  pull = 180,
  rise = 88,
}: FilmStripProps) {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const gate = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const meter = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const nodes = useRef<HTMLElement[]>([]);
  const boxes = useRef<{ left: number; width: number }[]>([]);
  const ticket = useRef(0);
  const cursor = useRef(0);

  const [active, setActive] = useState(0);

  useEffect(() => {
    let travel = 0;
    let span = 0;

    function paint() {
      ticket.current = 0;

      const trackEl = track.current;
      const gateEl = gate.current;
      const stripEl = strip.current;
      if (!trackEl || !gateEl || !stripEl || span <= 0) return;

      const meterEl = meter.current;
      const backdropEl = backdrop.current;
      const progress = clamp01(-trackEl.getBoundingClientRect().top / span);
      const shift = progress * travel;
      const width = gateEl.clientWidth;

      stripEl.style.transform = `translate3d(${-shift}px, 0, 0)`;
      if (meterEl) meterEl.style.transform = `scaleX(${progress})`;
      if (backdropEl) {
        backdropEl.style.transform = `translate3d(${-progress * width * 0.42}px, 0, 0)`;
      }

      const read = width * READ_MARK;
      const lead = Math.max(width - read, 1);
      const exit = Math.max(width * EXIT_ZONE, 1);
      let current = films.length - 1;
      let found = false;

      for (let index = 0; index < nodes.current.length; index += 1) {
        const node = nodes.current[index];
        const box = boxes.current[index];
        if (!node || !box) continue;

        const depth = LANES[index % LANES.length].depth;
        const approach = clamp01((box.left - shift - read) / lead);
        const eased = approach * approach;
        const offset = pull * depth * eased;
        const x = box.left - shift + offset;
        const leaving = 1 - clamp01(x / exit);
        const drift = rise * depth * eased - EXIT_LIFT * leaving * leaving;

        node.style.transform = `translate3d(${offset}px, ${drift}px, 0)`;

        if (!found && x + box.width * 0.5 > 0) {
          current = index;
          found = true;
        }
      }

      if (current > films.length - 1) current = films.length - 1;

      if (current !== cursor.current) {
        cursor.current = current;
        setActive(current);
      }
    }

    function measure() {
      const trackEl = track.current;
      const stageEl = stage.current;
      const gateEl = gate.current;
      const stripEl = strip.current;
      if (!trackEl || !stageEl || !gateEl || !stripEl) return;

      nodes.current = Array.from(stripEl.children) as HTMLElement[];
      boxes.current = nodes.current.map((node) => ({
        left: node.offsetLeft,
        width: node.offsetWidth,
      }));

      const last = boxes.current[boxes.current.length - 1];
      travel = last ? Math.max(last.left - gateEl.clientWidth * 0.38, 0) : 0;
      span = travel / pace;
      trackEl.style.height = `${stageEl.offsetHeight + span}px`;
      paint();
    }

    function schedule() {
      if (!ticket.current) ticket.current = requestAnimationFrame(paint);
    }

    const observer = new ResizeObserver(measure);
    if (stage.current) observer.observe(stage.current);
    if (strip.current) observer.observe(strip.current);

    measure();
    const settle = requestAnimationFrame(measure);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(settle);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", measure);
      cancelAnimationFrame(ticket.current);
      ticket.current = 0;
    };
  }, [pace, pull, rise, films.length]);

  const now = films[Math.min(active, films.length - 1)];

  const cardList = films.map((film, index) => {
    const lane = LANES[index % LANES.length];

    return (
      <article
        key={film.id}
        style={{ width: lane.width, marginTop: lane.drop }}
        className="group relative z-0 shrink-0 will-change-transform hover:z-30"
      >
        <HoverClip
          alt={`${film.title} (${film.year})`}
          poster={film.poster}
          youtubeId={film.youtubeId}
          clipStart={film.clipStart}
          ratio="2 / 3"
          sizes="(min-width: 1024px) 18vw, (min-width: 640px) 32vw, 52vw"
          reveal="color"
          summary={film.summary}
          meta={`Dir. ${film.director}`}
          placeholder={`${film.title.toUpperCase()}\n${film.year}`}
        />

        <div className="relative z-40 mt-3 border-t border-line-hairline bg-paper-100 pt-2">
          <div className="flex items-baseline justify-between gap-3 font-mono text-label font-bold uppercase tracking-label">
            <span className="truncate text-ink-900 transition-colors duration-[140ms] ease-[var(--ease-out)] group-hover:text-yellow-600">
              {film.title}
            </span>
            <span className="shrink-0 text-ink-500">{film.year}</span>
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-3 font-mono text-micro uppercase tracking-label text-ink-500">
            <span className="truncate">as {film.character}</span>
            <span className="shrink-0 text-ink-300">{two(index + 1)}</span>
          </div>
        </div>
      </article>
    );
  });

  const endPlate = (
    <div
      key="end-of-reel"
      style={{ width: "clamp(196px, 21vw, 340px)" }}
      className="shrink-0 self-center border-2 border-line-rule px-6 py-6 will-change-transform"
    >
      <div className="font-mono text-label-sm font-bold uppercase tracking-label-wide text-ink-500">
        End of reel
      </div>
      <div className="mt-4 font-display text-display-4 uppercase leading-none tracking-poster text-ink-900">
        {films[0].year} — {films[films.length - 1].year}
      </div>
      <div className="mt-4 border-t border-line-rule pt-3 font-mono text-micro uppercase tracking-label text-ink-500">
        {films.length} titles · still rolling
      </div>
    </div>
  );

  return (
    <div ref={track} className="relative h-[420svh]">
      <div
        ref={stage}
        style={{ "--gate": "clamp(76px, 17%, 208px)" } as CSSProperties}
        className="sticky top-0 h-svh overflow-hidden"
      >
        <div
          ref={gate}
          className="absolute inset-y-0 left-[calc(var(--gate)+2px)] right-0 overflow-hidden"
        >
          <div
            ref={backdrop}
            aria-hidden
            style={{
              backgroundImage:
                "repeating-linear-gradient(to right, var(--color-paper-300) 0 1px, transparent 1px 132px)",
            }}
            className="pointer-events-none absolute inset-y-0 left-0 w-[200%] will-change-transform"
          />

          <div className="absolute inset-0 flex flex-col justify-center">
            <div
              ref={strip}
              className="flex w-max items-start gap-[clamp(16px,2.4vw,40px)] pl-[clamp(48px,26%,520px)] will-change-transform"
            >
              {cardList}
              {endPlate}
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-0 z-20 flex w-[var(--gate)] flex-col justify-center bg-paper-100 pl-[var(--gutter-page)] pr-3">
          <div className="font-display text-display-3 leading-none text-ink-900">
            {two(active + 1)}
          </div>
          <div className="mt-1 font-mono text-label-sm font-bold uppercase tracking-label-wide text-ink-300">
            / {two(films.length)}
          </div>
          <div className="mt-4 border-t border-line-hairline pt-2 font-mono text-label font-bold uppercase tracking-label text-ink-900">
            {now.year}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-baseline gap-4 border-b border-line-hairline bg-paper-100 px-[var(--gutter-page)] py-3 font-mono text-label-sm font-bold uppercase tracking-label">
          <span className="shrink-0 text-ink-300">Reel —</span>
          <span className="min-w-0 truncate text-ink-900">{now.title}</span>
          <span className="ml-auto hidden shrink-0 text-ink-500 sm:block">
            Dir. {now.director}
          </span>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[2px] bg-line-hairline">
          <div
            ref={meter}
            style={{ transform: "scaleX(0)" }}
            className="h-full w-full origin-left bg-yellow-400 will-change-transform"
          />
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-[var(--gate)] z-30 w-[2px] bg-line-rule" />
      </div>
    </div>
  );
}
