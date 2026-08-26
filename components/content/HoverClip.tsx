"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";

type HoverClipProps = {
  alt: string;
  poster?: string;
  clip?: string;
  youtubeId?: string;
  ratio?: string;
  placeholder?: string;
  sizes?: string;
  className?: string;
};

export function HoverClip({
  alt,
  poster,
  clip,
  youtubeId,
  ratio = "3 / 4",
  placeholder = "STILL",
  sizes = "(min-width: 768px) 30vw, 70vw",
  className,
}: HoverClipProps) {
  const [live, setLive] = useState(false);
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
          className="img-brand object-cover group-hover:[filter:var(--filter-image-hover)]"
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center whitespace-pre-line p-3 text-center font-mono text-label-sm tracking-label text-ink-300">
          {placeholder}
        </span>
      )}

      {clip ? (
        <video
          ref={video}
          src={clip}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden
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
    </div>
  );
}
