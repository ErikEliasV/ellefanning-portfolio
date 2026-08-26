import { Eyebrow } from "@/components/core/Eyebrow";
import { cn } from "@/lib/cn";

type SectionHeaderProps = {
  index: string;
  eyebrow: string;
  title: string;
  lead?: string;
  tone?: "ink" | "invert";
  className?: string;
};

export function SectionHeader({
  index,
  eyebrow,
  title,
  lead,
  tone = "ink",
  className,
}: SectionHeaderProps) {
  const invert = tone === "invert";

  return (
    <header className={cn("flex flex-col gap-5", className)}>
      <Eyebrow rule index={`${index}/`} tone={invert ? "invert" : "ink"}>
        {eyebrow}
      </Eyebrow>

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-8">
        <h2
          className={cn(
            "font-display text-display-4 uppercase tracking-poster sm:text-display-3",
            invert ? "text-paper-100" : "text-ink-900",
          )}
        >
          {title}
          <span className="text-yellow-400"> —</span>
        </h2>

        {lead ? (
          <p
            className={cn(
              "max-w-[44ch] font-mono text-body-sm uppercase",
              invert ? "text-ink-300" : "text-ink-500",
            )}
          >
            {lead}
          </p>
        ) : null}
      </div>
    </header>
  );
}
