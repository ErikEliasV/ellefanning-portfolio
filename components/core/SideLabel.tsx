import { cn } from "@/lib/cn";

type SideLabelTone = "accent" | "ink" | "paper";

type SideLabelProps = {
  children: React.ReactNode;
  tone?: SideLabelTone;
  className?: string;
};

const toneClass: Record<SideLabelTone, string> = {
  accent: "bg-yellow-400 text-ink-900",
  ink: "bg-ink-900 text-paper-100",
  paper: "bg-paper-100 text-ink-900",
};

export function SideLabel({
  children,
  tone = "accent",
  className,
}: SideLabelProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex w-11 shrink-0 items-center justify-center",
        toneClass[tone],
        className,
      )}
    >
      <span className="[writing-mode:vertical-rl] rotate-180 font-mono text-label font-bold uppercase leading-none tracking-label-wide">
        {children}
      </span>
    </div>
  );
}
