"use client";

import { asset } from "@/lib/asset";
import { cn } from "@/lib/cn";
import "@/styles/pill.css";

// Nota cheia ligado, nota vazada desligado -- os dois SVGs saem exportados do
// Figma (node 2446-162) e ficam em public/icons. Passam pelo asset() porque o
// site tambem roda sob um basePath no GitHub Pages.
const NOTE_ON = "/icons/note-on.svg";
const NOTE_OFF = "/icons/note-off.svg";

type SoundPillProps = {
  /** Liga o fundo rosa e troca a nota. Vira aria-pressed. */
  on: boolean;
  /** O audio esta de fato tocando agora: e o que faz a nota respirar. */
  live?: boolean;
  label: string;
  ariaLabel: string;
  cursor: string;
  /** Classe de posicao -- .score no canto da pagina, .now-sound sobre o video. */
  className?: string;
  ready?: boolean;
  onClick: () => void;
};

// O corpo dos dois botoes de som. So a posicao e o estado vem de fora, entao a
// aparencia nao tem como divergir entre o canto da pagina e o quadro do NOW.
export function SoundPill({
  on,
  live,
  label,
  ariaLabel,
  cursor,
  className,
  ready,
  onClick,
}: SoundPillProps) {
  return (
    <button
      type="button"
      className={cn("pill", className)}
      aria-pressed={on}
      aria-label={ariaLabel}
      data-cursor={cursor}
      data-live={live ? "" : undefined}
      data-ready={ready ? "" : undefined}
      onClick={onClick}
    >
      <span aria-hidden className="pill-note">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset(on ? NOTE_ON : NOTE_OFF)} alt="" />
      </span>
      <span className="pill-label">{label}</span>
    </button>
  );
}
