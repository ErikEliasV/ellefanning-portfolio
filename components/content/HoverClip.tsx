"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";
import { cn } from "@/lib/cn";

type HoverClipReveal = "contrast" | "color";

type HoverClipProps = {
  alt: string;
  poster?: string;
  clip?: string;
  youtubeId?: string;
  clipStart?: number;
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

function embedUrl(id: string, start?: number) {
  const params = [
    "autoplay=1",
    "mute=1",
    "loop=1",
    `playlist=${id}`,
    "controls=0",
    "modestbranding=1",
    "playsinline=1",
    "rel=0",
    "disablekb=1",
    "iv_load_policy=3",
    "enablejsapi=1",
  ];

  if (start) params.push(`start=${start}`);
  if (typeof window !== "undefined") {
    params.push(`origin=${encodeURIComponent(window.location.origin)}`);
  }

  return `https://www.youtube-nocookie.com/embed/${id}?${params.join("&")}`;
}

export function HoverClip({
  alt,
  poster,
  clip,
  youtubeId,
  clipStart,
  ratio = "3 / 4",
  placeholder = "STILL",
  sizes = "(min-width: 768px) 30vw, 70vw",
  reveal = "contrast",
  summary,
  meta,
  className,
}: HoverClipProps) {
  const [live, setLive] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [refused, setRefused] = useState(false);
  const [broken, setBroken] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const cue = useRef<number | null>(null);
  const pulse = useRef<number | null>(null);

  function drop() {
    if (cue.current) {
      window.clearTimeout(cue.current);
      cue.current = null;
    }
    if (pulse.current) {
      window.clearInterval(pulse.current);
      pulse.current = null;
    }
  }

  useEffect(() => drop, []);

  useEffect(() => {
    if (!live) return;

    function listen(event: MessageEvent) {
      if (typeof event.data !== "string") return;
      if (!event.origin.includes("youtube")) return;

      let message: { event?: string; info?: unknown };
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }

      drop();

      if (message.event === "onError") {
        setRefused(true);
        setRolling(false);
      }

      if (message.event === "onStateChange" && message.info === 1) {
        setRolling(true);
      }
    }

    window.addEventListener("message", listen);
    return () => window.removeEventListener("message", listen);
  }, [live]);

  function open() {
    setLive(true);
    video.current?.play().catch(() => undefined);
  }

  function close() {
    setLive(false);
    setRolling(false);
    setRefused(false);
    drop();
    video.current?.pause();
  }

  function roll() {
    drop();

    const ping = () =>
      frame.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "listening", id: 1, channel: "widget" }),
        "*",
      );

    ping();
    pulse.current = window.setInterval(ping, 300);
    cue.current = window.setTimeout(() => setRolling(true), 2600);
  }

  const lens = youtubeId && !clip;

  return (
    <div
      onPointerEnter={open}
      onPointerLeave={close}
      onFocus={open}
      onBlur={close}
      style={{ aspectRatio: ratio, "--lens": "clamp(118px, 14vh, 186px)" } as React.CSSProperties}
      className={cn(
        "group relative outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-400",
        className,
      )}
    >
      <div className="absolute inset-0 overflow-hidden bg-ink-700">
        {poster ? (
          <Image
            src={asset(poster)}
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
            src={asset(clip)}
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

      {lens ? (
        <>
          <span
            aria-hidden
            style={{ clipPath: live ? "inset(0%)" : "inset(50%)" }}
            className="pointer-events-none absolute left-[34%] top-full z-40 h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 bg-line-rule transition-[clip-path] duration-[160ms] ease-[var(--ease-out)]"
          />

          <svg
            aria-hidden
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ clipPath: live ? "inset(0%)" : "inset(0 100% 0 0)" }}
            className="pointer-events-none absolute left-[34%] top-full z-40 h-[5.5rem] w-[28%] text-ink-900 transition-[clip-path] duration-[200ms] ease-[var(--ease-out)]"
          >
            <line
              x1="0"
              y1="0"
              x2="100"
              y2="100"
              stroke="currentColor"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <div
            aria-hidden
            style={{
              top: "calc(100% + 5.5rem + var(--lens) * 0.7071)",
              width: "var(--lens)",
              transform: "translate(-50%, -50%) rotate(45deg)",
              clipPath: live ? "inset(0%)" : "inset(50%)",
            }}
            className="pointer-events-none absolute left-[62%] z-40 aspect-square border-2 border-line-rule bg-ink-900 transition-[clip-path] delay-[120ms] duration-[280ms] ease-[var(--ease-out)]"
          >
            <div
              style={{ transform: "translate(-50%, -50%) rotate(-45deg)" }}
              className="absolute left-1/2 top-1/2 h-[142%] w-[142%]"
            >
              <div className="absolute left-1/2 top-1/2 h-full w-[178%] -translate-x-1/2 -translate-y-1/2">
                <Image
                  src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`}
                  alt=""
                  fill
                  sizes="360px"
                  className="object-cover"
                />
                {live ? (
                  <iframe
                    ref={frame}
                    title={`${alt} — clip`}
                    src={embedUrl(youtubeId, clipStart)}
                    allow="autoplay; encrypted-media"
                    onLoad={roll}
                    className={cn(
                      "absolute inset-0 h-full w-full border-0",
                      rolling && !refused ? "opacity-100" : "opacity-0",
                    )}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
