"use client";

import { useSiteSound } from "@/lib/useSiteSound";
import "@/styles/sound.css";

const BARS = ["a", "b", "c"];

export function SoundToggle() {
  const { on, live, toggle } = useSiteSound();

  return (
    <button
      type="button"
      className="score"
      aria-pressed={on}
      aria-label={on ? "Mute the site music" : "Play the site music"}
      data-cursor={on ? "Mute" : "Play"}
      data-live={live ? "" : undefined}
      onClick={toggle}
    >
      <span aria-hidden className="score-bars">
        {BARS.map((bar) => (
          <span key={bar} className={`score-bar score-bar-${bar}`} />
        ))}
      </span>
      <span className="score-label">{on ? "Music on" : "Music off"}</span>
    </button>
  );
}
