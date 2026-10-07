"use client";

import { asset } from "@/lib/asset";
import { cn } from "@/lib/cn";
import "@/styles/pill.css";

const NOTE_ON = "/icons/note-on.svg";
const NOTE_OFF = "/icons/note-off.svg";

type SoundPillProps = {
  on: boolean;
  live?: boolean;
  label: string;
  ariaLabel: string;
  cursor: string;
  cursorAt?: "top";
  className?: string;
  ready?: boolean;
  onClick: () => void;
};

export function SoundPill({
  on,
  live,
  label,
  ariaLabel,
  cursor,
  cursorAt,
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
      data-cursor-at={cursorAt}
      data-live={live ? "" : undefined}
      data-ready={ready ? "" : undefined}
      onClick={onClick}
    >
      <span aria-hidden className="pill-note">
        <img src={asset(on ? NOTE_ON : NOTE_OFF)} alt="" />
      </span>
      <span className="pill-label">{label}</span>
    </button>
  );
}
