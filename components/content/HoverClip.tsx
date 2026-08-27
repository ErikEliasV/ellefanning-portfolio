import Image from "next/image";
import { asset } from "@/lib/asset";
import { cn } from "@/lib/cn";

type HoverClipReveal = "contrast" | "color";

type HoverClipProps = {
  alt: string;
  poster?: string;
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
  ratio = "3 / 4",
  placeholder = "STILL",
  sizes = "(min-width: 768px) 30vw, 70vw",
  reveal = "contrast",
  summary,
  meta,
  className,
}: HoverClipProps) {
  return (
    <div
      style={{ aspectRatio: ratio }}
      className={cn("group relative", className)}
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
    </div>
  );
}
