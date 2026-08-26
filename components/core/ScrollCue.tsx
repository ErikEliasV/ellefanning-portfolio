import { cn } from "@/lib/cn";

type ScrollCueProps = {
  href: string;
  label?: string;
  index?: string;
  className?: string;
};

export function ScrollCue({
  href,
  label = "Scroll",
  index,
  className,
}: ScrollCueProps) {
  return (
    <div className={cn("border-t border-line-rule", className)}>
      <div className="bleed flex items-center justify-between gap-4 py-2 font-mono text-label-sm font-bold uppercase tracking-label-wide">
        <a
          href={href}
          className="group flex items-center gap-2 py-1 text-ink-800 transition-colors duration-[140ms] ease-[var(--ease-out)] hover:text-yellow-600"
        >
          <span
            aria-hidden
            className="inline-block transition-transform duration-[140ms] ease-[var(--ease-out)] group-hover:translate-y-0.5"
          >
            &darr;
          </span>
          {label}
        </a>
        {index ? <span className="text-ink-500">{index}</span> : null}
      </div>
    </div>
  );
}
