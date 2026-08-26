import { HoverClip } from "@/components/content/HoverClip";
import { SectionHeader } from "@/components/core/SectionHeader";
import { SideLabel } from "@/components/core/SideLabel";
import { CAREER } from "@/lib/career";

export function CareerTimeline() {
  return (
    <section id="timeline" className="border-t border-line-rule">
      <div className="flex">
        <SideLabel tone="paper" className="self-stretch border-r border-line-rule">
          04 — Career
        </SideLabel>

        <div className="min-w-0 flex-1">
          <div className="bleed py-8">
            <SectionHeader
              index="04"
              eyebrow="Timeline"
              title="Career"
              lead="From a first credit at three years old to the work being shot right now."
            />
          </div>

          <ol className="border-t border-line-hairline">
            {CAREER.map((entry) => (
              <li
                key={entry.id}
                className="group border-b border-line-hairline transition-colors duration-[140ms] ease-[var(--ease-out)] hover:bg-paper-200"
              >
                <div className="bleed grid items-center gap-4 py-4 md:grid-cols-[8rem_1fr_14rem] md:gap-8">
                  <div className="font-display text-display-4 uppercase leading-none text-ink-900 transition-colors duration-[140ms] ease-[var(--ease-out)] group-hover:text-yellow-600 md:text-display-3">
                    {entry.year}
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-micro font-bold uppercase tracking-label-wide text-yellow-600">
                      {entry.label}
                    </span>
                    <span className="font-mono text-body font-bold uppercase tracking-label text-ink-900">
                      {entry.project}
                    </span>
                    <p className="max-w-[52ch] font-mono text-body-sm uppercase text-ink-500">
                      {entry.note}
                    </p>
                  </div>

                  <HoverClip
                    alt={`${entry.project} (${entry.year})`}
                    poster={entry.media}
                    clip={entry.clip}
                    ratio="16 / 9"
                    sizes="(min-width: 768px) 14rem, 90vw"
                    placeholder={entry.year}
                    className="w-full"
                  />
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
