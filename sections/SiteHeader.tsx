import { MARKS } from "@/lib/marks";

export function SiteHeader() {
  return (
    <header className="border-b border-line-rule bg-rose-400 text-ink-800">
      <div className="bleed flex items-start justify-between gap-2 py-2 font-mono text-label-sm font-bold uppercase leading-[1.4] tracking-label-wide">
        {MARKS.map((mark, index) => (
          <div
            key={mark.id}
            className={
              index === MARKS.length - 1
                ? "flex flex-col text-right"
                : "flex flex-col"
            }
          >
            {mark.lines.map((line) => (
              <span key={line} className="whitespace-nowrap">
                {line}
              </span>
            ))}
          </div>
        ))}
      </div>
    </header>
  );
}
