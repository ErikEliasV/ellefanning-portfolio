import { HoverClip } from "@/components/content/HoverClip";
import { SectionHeader } from "@/components/core/SectionHeader";
import { SideLabel } from "@/components/core/SideLabel";
import { EDITORIAL } from "@/lib/gallery";

const PLACEMENT = [
  "col-span-7 md:col-span-4 md:col-start-1",
  "col-span-5 md:col-span-3 md:col-start-6 md:mt-24",
  "col-span-6 md:col-span-3 md:col-start-10 md:-mt-10",
  "col-span-6 md:col-span-4 md:col-start-2 md:-mt-16",
  "col-span-6 md:col-span-3 md:col-start-7 md:mt-8",
  "col-span-6 md:col-span-4 md:col-start-10 md:-mt-20",
  "col-span-12 md:col-span-5 md:col-start-3 md:mt-4",
];

export function Editorial() {
  return (
    <section id="editorial" className="border-t border-line-rule bg-paper-200">
      <div className="flex">
        <SideLabel tone="ink" className="self-stretch">
          05 — Editorial
        </SideLabel>

        <div className="min-w-0 flex-1">
          <div className="bleed py-8">
            <SectionHeader
              index="05"
              eyebrow="Photography"
              title="Editorial"
              lead="Magazines, campaigns and red carpets — arranged the way a spread is, not the way a grid is."
            />
          </div>

          <div className="bleed grid grid-cols-12 gap-4 pb-16 pt-4">
            {EDITORIAL.map((item, index) => (
              <figure
                key={item.id}
                className={PLACEMENT[index % PLACEMENT.length]}
              >
                <HoverClip
                  alt={`${item.caption} — ${item.meta}`}
                  poster={item.src}
                  clip={item.clip}
                  ratio={item.ratio}
                  sizes="(min-width: 768px) 30vw, 50vw"
                  placeholder={`${item.caption.toUpperCase()}\n${item.ratio.replace(" / ", ":")}`}
                />
                <figcaption className="mt-2 flex items-baseline justify-between gap-3 font-mono text-micro font-bold uppercase tracking-label text-ink-500">
                  <span className="text-ink-900">{item.caption}</span>
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
