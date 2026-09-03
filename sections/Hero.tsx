"use client";

import Image from "next/image";
import { asset } from "@/lib/asset";
import { HERO_FIELD, useHeroField } from "@/lib/useHeroField";
import { useHeroMorph } from "@/lib/useHeroMorph";
import "@/styles/hero.css";

export function Hero() {
  const { canvas, progress, failed } = useHeroField();
  const track = useHeroMorph(progress);

  return (
    <div ref={track} className="hero-track">
      <section id="hero" className="hero-frame">
        <div aria-hidden className="hero-field">
          {failed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={asset(HERO_FIELD)} alt="" className="hero-field-flat" />
          ) : (
            <canvas ref={canvas} className="hero-field-gl" />
          )}
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
