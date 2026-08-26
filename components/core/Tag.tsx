import { cn } from "@/lib/cn";

type TagVariant = "outline" | "accent" | "solid" | "quiet";

type TagProps = {
  children: React.ReactNode;
  variant?: TagVariant;
  size?: "sm" | "md";
  className?: string;
};

const variantClass: Record<TagVariant, string> = {
  outline: "border border-ink-900 bg-transparent text-ink-800",
  accent: "border border-ink-900 bg-yellow-400 text-ink-900",
  solid: "border border-ink-900 bg-ink-900 text-paper-100",
  quiet: "border border-transparent bg-paper-300 text-ink-500",
};

export function Tag({
  children,
  variant = "outline",
  size = "md",
  className,
}: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono text-micro font-bold uppercase leading-none tracking-label",
        size === "sm" ? "px-1 py-0.5" : "px-2.5 py-1",
        variantClass[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
