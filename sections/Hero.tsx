"use client";

import Image from "next/image";
import { asset } from "@/lib/asset";
import { useHeroMorph } from "@/lib/useHeroMorph";
import "@/styles/hero.css";

function TitleLines() {
  return (
    <>
      <span>Elle</span>
      <span>
        Fanning<span className="hero-dot">.</span>
      </span>
    </>
  );
}

export function Hero() {
  const track = useHeroMorph();

  return (
    <div ref={track} className="hero-track">
      <section id="hero" className="hero-frame">
        <h1 className="hero-title hero-title-ink">
          <TitleLines />
        </h1>

        <div aria-hidden className="hero-lime">
          <p className="hero-title hero-title-paper">
            <TitleLines />
          </p>
        </div>

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
