"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { CURRENT_WORK } from "@/lib/films";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { isReduced, onTick } from "@/lib/scroll";
import { INK_MELT } from "@/lib/seams";
import { createSeam } from "@/lib/sectionShader";
import { useNowTrailer } from "@/lib/useNowTrailer";
import "@/styles/now.css";

export function Now() {
  const { frame, stage, ready, playing, sound, toggleSound } = useNowTrailer();
  const melt = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const node = frame.current;
    const canvas = melt.current;
    if (!node || !canvas) return;

    const sheet = createSeam(canvas, INK_MELT);
    if (!sheet) return;

    const ink = getComputedStyle(document.documentElement)
      .getPropertyValue("--color-ink-900")
      .trim()
      .replace("#", "");
    sheet.set(
      "uInk",
      [0, 2, 4].map((at) => parseInt(ink.slice(at, at + 2), 16) / 255),
    );

    // A GSAP timeline holds the progress and ScrollTrigger scrubs it; the
    // shader only ever reads the number.
    const state = { open: 0 };
    const tl = gsap
      .timeline({ paused: true })
      .to(state, { open: 1, ease: "none", duration: 1 });

    const trigger = ScrollTrigger.create({
      trigger: node,
      start: "top bottom",
      end: "top 25%",
      scrub: isReduced() ? false : 0.5,
      invalidateOnRefresh: true,
      animation: tl,
    });

    if (isReduced()) tl.progress(1);

    // Off screen there is nothing to melt, and a sheet that has finished
    // melting is a full-frame shader drawing nothing anyone can see.
    let near = false;

    const untick = onTick((now) => {
      const idle = !near || state.open >= 0.999;
      canvas.style.opacity = idle ? "0" : "1";
      if (idle) return;
      sheet.set("uOpen", state.open);
      sheet.frame(now);
    });

    const watcher = new IntersectionObserver(
      ([entry]) => {
        near = entry.isIntersecting;
      },
      { rootMargin: "40% 0px" },
    );
    watcher.observe(node);

    // A resize should repaint even when nothing is scrolling.
    const sizer = new ResizeObserver(() => {
      sheet.resize();
      if (state.open < 0.999) sheet.frame(performance.now());
    });
    sizer.observe(canvas);

    return () => {
      untick();
      watcher.disconnect();
      sizer.disconnect();
      trigger.kill();
      tl.kill();
      sheet.dispose();
    };
  }, [frame]);

  return (
    <section id="current" className="now">
      <div
        ref={frame}
        className="now-frame"
        data-cursor-skin="invert"
        style={
          {
            "--now-poster": `url(https://i.ytimg.com/vi/${CURRENT_WORK.youtubeId}/maxresdefault.jpg)`,
            "--now-poster-alt": `url(https://i.ytimg.com/vi/${CURRENT_WORK.youtubeId}/hqdefault.jpg)`,
          } as CSSProperties
        }
      >
<div aria-hidden className="now-stage">
          <div ref={stage} className="now-embed" />
        </div>

        <div
          aria-hidden
          className="now-cover"
          data-playing={playing ? "" : undefined}
        />

        <canvas ref={melt} aria-hidden className="now-melt" />

        <div aria-hidden className="now-scrim" />

        <button
          type="button"
          className="now-sound"
          onClick={toggleSound}
          aria-pressed={sound}
          aria-label={sound ? "Mute the trailer" : "Unmute the trailer"}
          data-cursor={sound ? "Mute" : "Unmute"}
          data-ready={ready ? "" : undefined}
        >
          <span aria-hidden className="now-sound-icon">
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M2 6.2h3.4L9 3v10L5.4 9.8H2z" fill="currentColor" />
              {sound ? (
                <g
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                >
                  <path d="M10.9 6.1a2.6 2.6 0 0 1 0 3.8" />
                  <path d="M12.9 4.4a5.2 5.2 0 0 1 0 7.2" />
                </g>
              ) : (
                <g
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                >
                  <path d="M10.9 6.4 14.1 9.6" />
                  <path d="M14.1 6.4 10.9 9.6" />
                </g>
              )}
            </svg>
          </span>
          <span className="now-sound-label">
            {sound ? "Sound on" : "Sound off"}
          </span>
        </button>

        <div className="now-row">
          <h2 className="now-word">Now</h2>

          <div className="now-meta">
            <div className="now-tags">
              <span className="now-tag now-tag-accent">{CURRENT_WORK.year}</span>
              <span className="now-tag">{CURRENT_WORK.format}</span>
              <span className="now-tag now-tag-quiet">{CURRENT_WORK.status}</span>
            </div>

            <h3 className="now-title">{CURRENT_WORK.title}</h3>

            <dl className="now-list">
              <div className="now-list-row">
                <dt>Role</dt>
                <dd>{CURRENT_WORK.character}</dd>
              </div>
              <div className="now-list-row">
                <dt>Director</dt>
                <dd>{CURRENT_WORK.director}</dd>
              </div>
              <div className="now-list-row">
                <dt>Premiere</dt>
                <dd>{CURRENT_WORK.premiere}</dd>
              </div>
              <div className="now-list-row">
                <dt>Original</dt>
                <dd>{CURRENT_WORK.originalTitle}</dd>
              </div>
            </dl>

            <p className="now-note">{CURRENT_WORK.note}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
