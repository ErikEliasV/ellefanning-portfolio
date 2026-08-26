"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";

type HoverClipReveal = "contrast" | "color";

type HoverClipProps = {
  alt: string;
  poster?: string;
  clip?: string;
  youtubeId?: string;
  ratio?: string;
  placeholder?: string;
  sizes?: string;
  reveal?: HoverClipReveal;
  summary?: string;
  meta?: string;
  className?: string;
};

const revealClass: Record<HoverClipReveal, string> = {
  contrast: "group-hover:[filter:var(--filter-image-hover)]",
  color: "group-hover:[filter:var(--filter-image-color)]",
};

export function HoverClip({
  alt,
  poster,
  clip,
  youtubeId,
  ratio = "3 / 4",
  placeholder = "STILL",
  sizes = "(min-width: 768px) 30vw, 70vw",
  reveal = "contrast",
  summary,
  meta,
  className,
}: HoverClipProps) {
  const [live, setLive] = useState(false);
  const [broken, setBroken] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  function open() {
    setLive(true);
    video.current?.play().catch(() => undefined);
  }

  function close() {
    setLive(false);
    video.current?.pause();
  }

  return (
    <div
      onPointerEnter={open}
      onPointerLeave={close}
      onFocus={open}
      onBlur={close}
      style={{ aspectRatio: ratio }}
      className={cn(
        "group relative overflow-hidden bg-ink-700 outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-400",
        className,
      )}
    >
      {poster ? (
        <Image
          src={poster}
          alt={alt}
          fill
          sizes={sizes}
          draggable={false}
          className={cn("img-brand object-cover", revealClass[reveal])}
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center whitespace-pre-line p-3 text-center font-mono text-label-sm tracking-label text-ink-300">
          {placeholder}
        </span>
      )}

      {clip && !broken ? (
        <video
          ref={video}
          src={clip}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden
          onError={() => setBroken(true)}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-[220ms] ease-[var(--ease-out)]",
            live ? "opacity-100" : "opacity-0",
          )}
        />
      ) : null}

      {youtubeId && live && !clip ? (
        <iframe
          title={`${alt} — clip`}
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=0&modestbranding=1&playsinline=1&rel=0`}
          allow="autoplay; encrypted-media"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[300%] w-[178%] -translate-x-1/2 -translate-y-1/2 border-0"
        />
      ) : null}

      {summary ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-[var(--scrim-plate)] px-3 py-3 transition-transform duration-[220ms] ease-[var(--ease-out)] group-hover:translate-y-0">
          {meta ? (
            <div className="font-mono text-micro font-bold uppercase tracking-label text-yellow-400">
              {meta}
            </div>
          ) : null}
          <p className="mt-1 font-mono text-micro leading-[1.55] text-paper-100">
            {summary}
          </p>
        </div>
      ) : null}
    </div>
  );
}
