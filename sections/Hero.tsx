"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { asset } from "@/lib/asset";
import { HERO_FIELD, useHeroField } from "@/lib/useHeroField";
import { useHeroCloud } from "@/lib/useHeroCloud";
import { useHeroMorph } from "@/lib/useHeroMorph";
import "@/styles/hero.css";

const HANDOFF_MS = 460;

export function Hero() {
  const {
    canvas: cloudCanvas,
    progress: cloudProgress,
    ready: cloudReady,
  } = useHeroCloud();

  const [handoff, setHandoff] = useState(false);

  const {
    canvas: flatCanvas,
    progress: flatProgress,
    failed,
  } = useHeroField(handoff);

  // The flat renderer only steps aside once the crossfade is over, so the frame
  // it leaves on its canvas is still there while the two overlap.
  useEffect(() => {
    if (!cloudReady) return;
    const id = window.setTimeout(() => setHandoff(true), HANDOFF_MS);
    return () => window.clearTimeout(id);
  }, [cloudReady]);

  const onProgress = useCallback(
    (p: number) => {
      flatProgress(p);
      cloudProgress(p);
    },
    [flatProgress, cloudProgress],
  );

  const track = useHeroMorph(onProgress);

  return (
    <div ref={track} className="hero-track">
      <section id="hero" className="hero-frame">
        <div
          aria-hidden
          className="hero-field"
          data-cloud={cloudReady ? "" : undefined}
        >
          {failed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={asset(HERO_FIELD)} alt="" className="hero-field-flat" />
          ) : (
            <canvas ref={flatCanvas} className="hero-field-gl" />
          )}
          <canvas ref={cloudCanvas} className="hero-field-cloud" />
        </div>

        <h1 className="hero-title hero-title-entry">
          <span className="hero-wipe hero-wipe-g">
            <span className="hero-face hero-face-g">Elle Fanning</span>
          </span>
          <span aria-hidden className="hero-wipe hero-wipe-e">
            <span className="hero-face hero-face-e">Elle Fanning</span>
          </span>
        </h1>

        <p aria-hidden className="hero-title hero-title-lockup">
          <span className="hero-face hero-face-e">
            <span>Elle</span>
            <span>
              Fanning<span className="hero-dot">.</span>
            </span>
          </span>
        </p>

        <div className="hero-portrait">
          <Image
            src={asset("/images/ellefanning-hero-portrait.webp")}
            alt="Elle Fanning"
            width={1900}
            height={1140}
            priority
            draggable={false}
            className="hero-portrait-img"
          />
        </div>
      </section>
    </div>
  );
}
