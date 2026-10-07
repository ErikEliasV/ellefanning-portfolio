"use client";

import { SoundPill } from "@/components/ui/SoundPill";
import { useSiteSound } from "@/hooks/useSiteSound";

export function SoundToggle() {
  const { on, live, toggle } = useSiteSound();

  return (
    <SoundPill
      className="score"
      on={on}
      live={live}
      label={on ? "Music on" : "Music off"}
      ariaLabel={on ? "Mute the site music" : "Play the site music"}
      cursor={on ? "Mute" : "Play"}
      cursorAt="top"
      onClick={toggle}
    />
  );
}
