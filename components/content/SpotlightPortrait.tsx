"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { PointerEvent } from "react";
import { cn } from "@/lib/cn";

type SpotlightPortraitProps = {
  src: string;
  alt: string;
  radius?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
};

export function SpotlightPortrait({
  src,
  alt,
  radius = 190,
  sizes = "100vw",
  priority = false,
  className,
  imageClassName = "object-contain object-bottom",
}: SpotlightPortraitProps) {
  const lens = useRef<HTMLDivElement>(null);
  const point = useRef({ x: 0, y: 0 });
  const ticket = useRef(0);

  useEffect(() => () => cancelAnimationFrame(ticket.current), []);

  function paint() {
    ticket.current = 0;
    const { x, y } = point.current;
    if (lens.current) {
      lens.current.style.clipPath = `circle(${radius}px at ${x}px ${y}px)`;
    }
  }

  function track(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;
    point.current = {
      x: event.nativeEvent.offsetX,
      y: event.nativeEvent.offsetY,
    };
    if (!ticket.current) ticket.current = requestAnimationFrame(paint);
  }

  function open(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;
    point.current = {
      x: event.nativeEvent.offsetX,
      y: event.nativeEvent.offsetY,
    };
    paint();
    lens.current?.style.setProperty("opacity", "1");
  }

  function close() {
    lens.current?.style.setProperty("opacity", "0");
  }

  return (
    <div
      onPointerEnter={open}
      onPointerMove={track}
      onPointerLeave={close}
      className={cn("relative", className)}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        draggable={false}
        className={cn("img-brand", imageClassName)}
      />

      <div ref={lens} aria-hidden className="spotlight-lens pointer-events-none">
        <Image
          src={src}
          alt=""
          fill
          sizes={sizes}
          loading="eager"
          draggable={false}
          className={imageClassName}
        />
      </div>
    </div>
  );
}
