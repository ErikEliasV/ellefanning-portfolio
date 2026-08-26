import { cn } from "@/lib/cn";

type EyebrowTone = "ink" | "muted" | "accent" | "invert";

type EyebrowProps = {
  children: React.ReactNode;
  tone?: EyebrowTone;
  rule?: boolean;
  index?: string;
  className?: string;
};

const toneClass: Record<EyebrowTone, string> = {
  ink: "text-ink-800",
  muted: "text-ink-500",
  accent: "text-yellow-600",
  invert: "text-paper-100",
};

const ruleClass: Record<EyebrowTone, string> = {
  ink: "bg-line-rule",
  muted: "bg-line-hairline",
  accent: "bg-yellow-400",
  invert: "bg-line-invert",
};

export function Eyebrow({
  children,
  tone = "ink",
  rule = false,
  index,
  className,
}: EyebrowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 font-mono text-label-sm font-bold uppercase tracking-label-wide",
        toneClass[tone],
        className,
      )}
    >
      {index ? <span className="text-yellow-600">{index}</span> : null}
      <span>{children}</span>
      {rule ? <span className={cn("h-px flex-1", ruleClass[tone])} /> : null}
    </div>
  );
}
