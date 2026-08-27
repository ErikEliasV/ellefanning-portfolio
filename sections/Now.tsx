"use client";

import { asset } from "@/lib/asset";
import { CURRENT_WORK } from "@/lib/films";
import { useNowReel } from "@/lib/useNowReel";
import "@/styles/now.css";

export function Now() {
  const { frame, bind, advance, live } = useNowReel(CURRENT_WORK.clips.length);

  return (
    <section id="current" className="now">
      <div ref={frame} className="now-frame">
        {CURRENT_WORK.clips.map((clip, index) => (
          <video
            key={clip}
            ref={bind(index)}
            src={asset(clip)}
            className="now-clip"
            data-live={index === live ? "" : undefined}
            muted
            playsInline
            preload="auto"
            tabIndex={-1}
            aria-hidden
            disablePictureInPicture
            controlsList="nodownload noplaybackrate nofullscreen"
            onEnded={advance}
            onContextMenu={(event) => event.preventDefault()}
          />
        ))}

        <div aria-hidden className="now-scrim" />

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
