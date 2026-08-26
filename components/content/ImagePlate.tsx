import Image from "next/image";
import { cn } from "@/lib/cn";

type ImagePlateProps = {
  src?: string;
  alt?: string;
  ratio?: string;
  fill?: boolean;
  caption?: string;
  captionRole?: string;
  placeholder?: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
};

export function ImagePlate({
  src,
  alt = "",
  ratio = "3 / 4",
  fill = false,
  caption,
  captionRole,
  placeholder = "IMAGE",
  priority = false,
  sizes = "100vw",
  className,
}: ImagePlateProps) {
  return (
    <div
      role="img"
      aria-label={alt || caption}
      style={fill ? undefined : { aspectRatio: ratio }}
      className={cn(
        "relative overflow-hidden bg-ink-700",
        fill && "h-full w-full",
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="img-brand object-cover"
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center whitespace-pre-line p-3 text-center font-mono text-label-sm tracking-label text-ink-300">
          {placeholder}
        </span>
      )}

      {caption ? (
        <div className="absolute bottom-0 right-0 bg-[var(--scrim-plate)] px-3 py-2">
          <div className="whitespace-pre-line font-mono text-label uppercase tracking-[0.1em] text-paper-100">
            {caption}
          </div>
          {captionRole ? (
            <div className="font-mono text-label-sm font-bold uppercase tracking-label text-yellow-400">
              {captionRole}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
