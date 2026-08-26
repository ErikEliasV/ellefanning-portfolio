import { HoverClip } from "@/components/content/HoverClip";
import { SectionHeader } from "@/components/core/SectionHeader";
import { SideLabel } from "@/components/core/SideLabel";
import { BEHIND } from "@/lib/gallery";

export function BehindTheScenes() {
  return (
    <section
      id="behind-the-scenes"
      className="grain border-t border-line-rule bg-ink-900 text-paper-100"
    >
      <div className="relative flex">
        <SideLabel tone="paper" className="self-stretch">
          06 — Backstage
        </SideLabel>

        <div className="min-w-0 flex-1">
          <div className="bleed py-8">
            <SectionHeader
              index="06"
              eyebrow="Behind the scenes"
              title="Backstage"
              tone="invert"
              lead="Rehearsals, fittings and the long waits — the part of the job that never makes the cut."
            />
          </div>

          <div className="bleed grid grid-cols-2 gap-4 pb-16 pt-4 md:grid-cols-6">
            {BEHIND.map((item, index) => (
              <figure
                key={item.id}
                className={
                  index % 5 === 0
                    ? "col-span-2 md:col-span-3"
                    : index % 3 === 0
                      ? "col-span-2 md:col-span-3"
                      : "col-span-1 md:col-span-2"
                }
              >
                <HoverClip
                  alt={`${item.caption} — ${item.meta}`}
                  poster={item.src}
                  clip={item.clip}
                  ratio={item.ratio}
                  sizes="(min-width: 768px) 33vw, 50vw"
                  placeholder={item.caption.toUpperCase()}
                  className="bg-ink-800"
                />
                <figcaption className="mt-2 flex items-baseline justify-between gap-3 font-mono text-micro font-bold uppercase tracking-label text-ink-300">
                  <span className="text-paper-100">{item.caption}</span>
                  <span>{item.meta}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
