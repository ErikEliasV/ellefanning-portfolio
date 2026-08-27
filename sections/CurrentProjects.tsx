import { HoverClip } from "@/components/content/HoverClip";
import { SectionHeader } from "@/components/core/SectionHeader";
import { SideLabel } from "@/components/core/SideLabel";
import { Tag } from "@/components/core/Tag";
import { CURRENT_WORK } from "@/lib/films";

export function CurrentProjects() {
  return (
    <section id="current" className="border-t border-line-rule">
      <div className="flex">
        <SideLabel tone="accent" className="self-stretch">
          05 — Now
        </SideLabel>

        <div className="min-w-0 flex-1">
          <div className="bleed py-8">
            <SectionHeader
              index="05"
              eyebrow="Current work"
              title="Now"
              lead="Where the filmography stops being an archive and starts being a schedule."
            />
          </div>

          <div className="bleed grid gap-8 pb-16 pt-4 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <HoverClip
              alt={`${CURRENT_WORK.title} (${CURRENT_WORK.year})`}
              ratio="16 / 9"
              sizes="(min-width: 1024px) 55vw, 92vw"
              placeholder={`${CURRENT_WORK.title.toUpperCase()}\n16:9 · KEY ART`}
            />

            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap gap-1">
                <Tag variant="accent">{CURRENT_WORK.year}</Tag>
                <Tag>Feature</Tag>
                <Tag variant="quiet">In release</Tag>
              </div>

              <h3 className="font-display text-display-3 uppercase leading-[0.92] text-ink-900">
                {CURRENT_WORK.title}
              </h3>

              <dl className="flex flex-col gap-2 font-mono text-label uppercase tracking-label">
                <div className="flex justify-between gap-4 border-b border-line-hairline pb-2">
                  <dt className="text-ink-500">Role</dt>
                  <dd className="text-ink-900">{CURRENT_WORK.character}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-line-hairline pb-2">
                  <dt className="text-ink-500">Director</dt>
                  <dd className="text-ink-900">{CURRENT_WORK.director}</dd>
                </div>
              </dl>

              <p className="max-w-[44ch] font-mono text-body-sm uppercase text-ink-500">
                {CURRENT_WORK.note}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
