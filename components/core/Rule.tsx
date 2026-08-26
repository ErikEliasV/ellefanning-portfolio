import { cn } from "@/lib/cn";

type RuleWeight = "hair" | "rule" | "heavy" | "block";
type RuleTone = "ink" | "hair" | "accent" | "invert";

type RuleProps = {
  weight?: RuleWeight;
  tone?: RuleTone;
  className?: string;
};

const weightClass: Record<RuleWeight, string> = {
  hair: "h-px",
  rule: "h-px",
  heavy: "h-[2px]",
  block: "h-[3px]",
};

const toneClass: Record<RuleTone, string> = {
  ink: "bg-line-rule",
  hair: "bg-line-hairline",
  accent: "bg-yellow-400",
  invert: "bg-line-invert",
};

export function Rule({ weight = "rule", tone = "ink", className }: RuleProps) {
  return (
    <div
      role="separator"
      className={cn("w-full", weightClass[weight], toneClass[tone], className)}
    />
  );
}
