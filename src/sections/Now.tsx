"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";
import type { CSSProperties } from "react";
import { SoundPill } from "@/components/ui/SoundPill";
import { asset } from "@/lib/asset";
import { CURRENT_WORK } from "@/data/films";
import { lineCascade } from "@/lib/reveal";
import { isReduced } from "@/lib/scroll";
import { designScale } from "@/lib/viewport";
import { useNowTrailer } from "@/hooks/useNowTrailer";
import "@/styles/now.css";

const SMALL = 0.62;
const CORNER = 220;

const POSTER = "/images/ellefanning-now-poster.webp";

export function Now() {
  const { frame, video, ready, playing, sound, toggleSound } = useNowTrailer();

  useEffect(() => {
    const node = frame.current;
    const media = node?.querySelector<HTMLElement>(".now-media");
    if (!node || !media) return;

    const state = { p: 0, corner: CORNER };

    const fit = () => {
      state.corner = CORNER * designScale();
    };

    const seat = () => {
      const k = state.p * state.p * (3 - 2 * state.p);
      const radius = Math.round(state.corner * (1 - k));
      media.style.transform = `scale(${(SMALL + (1 - SMALL) * k).toFixed(4)})`;
      media.style.borderRadius = `${radius}px 0 ${radius}px 0`;
    };

    const tl = gsap
      .timeline({ paused: true })
      .to(state, { p: 1, ease: "none", duration: 1, onUpdate: seat });

    const trigger = ScrollTrigger.create({
      trigger: node,
      start: "top bottom",
      end: "top 32%",
      invalidateOnRefresh: true,
      onUpdate: (self) => tl.progress(isReduced() ? 1 : self.progress),
      onRefresh: (self) => {
        fit();
        tl.progress(isReduced() ? 1 : self.progress);
        seat();
      },
    });

    fit();
    tl.progress(isReduced() ? 1 : 0);
    seat();

    const lines = Array.from(
      node.querySelectorAll(".now-tags, .now-title, .now-list-row, .now-note"),
    );
    const killLines = lineCascade(node, lines);

    return () => {
      killLines();
      trigger.kill();
      tl.kill();
      media.style.transform = "";
      media.style.borderRadius = "";
    };
  }, [frame]);

  return (
    <section id="current" className="now">
      <div
        ref={frame}
        className="now-frame"
        data-cursor-skin="invert"
        style={{ "--now-poster": `url(${asset(POSTER)})` } as CSSProperties}
      >
        <div aria-hidden className="now-media">
          <div className="now-stage">
            <video
              ref={video}
              className="now-embed"
              src={asset(CURRENT_WORK.trailer)}
              muted
              loop
              playsInline
              preload="none"
              disablePictureInPicture
              disableRemotePlayback
            />
          </div>

          <div className="now-cover" data-playing={playing ? "" : undefined} />

          <div className="now-scrim" />
        </div>

        <SoundPill
          className="now-sound"
          on={sound}
          live={playing && sound}
          ready={ready}
          label={sound ? "Sound on" : "Sound off"}
          ariaLabel={sound ? "Mute the trailer" : "Unmute the trailer"}
          cursor={sound ? "Mute" : "Unmute"}
          onClick={toggleSound}
        />

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
