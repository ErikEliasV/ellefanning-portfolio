"use client";

import { CURRENT_WORK } from "@/lib/films";
import { useNowTrailer } from "@/lib/useNowTrailer";
import "@/styles/now.css";

const PARAMS = [
  "mute=1",
  "loop=1",
  `playlist=${CURRENT_WORK.youtubeId}`,
  "controls=0",
  "disablekb=1",
  "modestbranding=1",
  "rel=0",
  "iv_load_policy=3",
  "playsinline=1",
  "enablejsapi=1",
].join("&");

const TRAILER = `https://www.youtube-nocookie.com/embed/${CURRENT_WORK.youtubeId}?${PARAMS}`;

export function Now() {
  const { frame, stage, ready, sound, toggleSound } = useNowTrailer();

  return (
    <section id="current" className="now">
      <div ref={frame} className="now-frame" data-cursor-skin="invert">
        <div aria-hidden className="now-stage">
          <iframe
            ref={stage}
            src={TRAILER}
            title={`${CURRENT_WORK.title} trailer`}
            className="now-embed"
            tabIndex={-1}
            allow="autoplay; encrypted-media"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>

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
