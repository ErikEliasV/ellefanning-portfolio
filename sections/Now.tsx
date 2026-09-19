"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";
import type { CSSProperties } from "react";
import { SoundPill } from "@/components/core/SoundPill";
import { asset } from "@/lib/asset";
import { CURRENT_WORK } from "@/lib/films";
import { lineCascade } from "@/lib/reveal";
import { isReduced } from "@/lib/scroll";
import { useNowTrailer } from "@/lib/useNowTrailer";
import "@/styles/now.css";

// How small the card starts, and how far the leading corner is rounded before
// it seats. The corner is deliberately larger than anything else on the site.
const SMALL = 0.62;
const CORNER = 220;

// O quadro de espera, por cima do embed ate o trailer tocar. Era a thumb do
// proprio YouTube (maxresdefault, com hqdefault numa segunda camada porque a
// primeira as vezes da 404) -- uma imagem que o site nao escolhia. Agora e um
// still do filme, servido daqui, e com arquivo local nao ha 404 que cobrir.
const POSTER = "/images/ellefanning-now-poster.webp";

export function Now() {
  const { frame, stage, ready, playing, sound, toggleSound } = useNowTrailer();

  useEffect(() => {
    const node = frame.current;
    const media = node?.querySelector<HTMLElement>(".now-media");
    if (!node || !media) return;

    // The card arrives as an object, not as an effect: small, held off the
    // frame, with one corner rounded far past anything else on the site. It
    // grows into the frame and the corner resolves to the hard editorial edge.
    const state = { p: 0 };

    const seat = () => {
      const k = state.p * state.p * (3 - 2 * state.p);
      const radius = Math.round(CORNER * (1 - k));
      media.style.transform = `scale(${(SMALL + (1 - SMALL) * k).toFixed(4)})`;
      media.style.borderRadius = `${radius}px 0 ${radius}px 0`;
    };

    const tl = gsap
      .timeline({ paused: true })
      .to(state, { p: 1, ease: "none", duration: 1, onUpdate: seat });

    // The timeline is driven straight from the trigger rather than scrubbed:
    // Lenis already smooths the scroll position, so a second layer of easing
    // only adds lag, and this way the card is exactly where the scroll says.
    const trigger = ScrollTrigger.create({
      trigger: node,
      start: "top bottom",
      end: "top 32%",
      invalidateOnRefresh: true,
      // Both hooks, because a refresh recomputes the geometry without firing
      // onUpdate: after a resize the card would otherwise keep the shape it had
      // at a scroll position that no longer exists.
      onUpdate: (self) => tl.progress(isReduced() ? 1 : self.progress),
      onRefresh: (self) => tl.progress(isReduced() ? 1 : self.progress),
    });

    tl.progress(isReduced() ? 1 : 0);
    seat();

    // This is the cover of the magazine, so the lines are allowed to take
    // their time: one at a time, on the slowest band the site owns.
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
            <div ref={stage} className="now-embed" />
          </div>

          <div className="now-cover" data-playing={playing ? "" : undefined} />

          <div className="now-scrim" />
        </div>

        {/* live so quando o trailer esta rodando com som: e ai que a nota
            respira, como a do botao de musica da pagina. */}
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
