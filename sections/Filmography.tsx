import { FilmStrip } from "@/components/content/FilmStrip";
import { SectionHeader } from "@/components/core/SectionHeader";
import { SideLabel } from "@/components/core/SideLabel";
import { FILMS } from "@/lib/films";

export function Filmography() {
  return (
    <section id="filmography" className="border-t border-line-rule">
      <div className="flex">
        <SideLabel
          tone="ink"
          className="sticky top-0 h-svh self-start border-r border-line-rule"
        >
          02 — Filmography
        </SideLabel>

        <div className="min-w-0 flex-1">
          <div className="bleed py-8">
            <SectionHeader
              index="02"
              eyebrow="Selected work"
              title="Filmography"
              lead="Two decades of screen work. Scroll to run the reel — titles are pulled in from the right and read out at the gate."
            />
          </div>

          <FilmStrip films={FILMS} />

          <div className="bleed flex items-baseline justify-between gap-4 border-t border-line-hairline py-3 font-mono text-label-sm font-bold uppercase tracking-label-wide text-ink-500">
            <span>{FILMS.length} titles</span>
            <span>2001 — 2024</span>
          </div>
        </div>
      </div>
    </section>
  );
}
