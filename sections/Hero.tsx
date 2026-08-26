import { ImagePlate } from "@/components/content/ImagePlate";
import { Rule } from "@/components/core/Rule";
import { ScrollCue } from "@/components/core/ScrollCue";
import { SideLabel } from "@/components/core/SideLabel";

const STATEMENT = `Screen work, characters
and editorials —
from the first role
to what comes next.`;

export function Hero() {
  return (
    <section id="hero" className="flex min-h-svh flex-col">
      <div className="border-b border-line-rule">
        <div className="bleed flex justify-between gap-4 py-3 font-mono text-label-sm font-bold uppercase leading-[1.4] tracking-label-wide">
          <span>
            Actress
            <br />
            Producer
          </span>
          <span className="hidden sm:block">
            Portfolio
            <br />
            Selected work
          </span>
          <span className="text-right">
            Archive
            <br />
            2026 edition
          </span>
        </div>
      </div>

      <div className="grid flex-1 lg:grid-cols-[1.15fr_1fr]">
        <div className="bleed flex flex-col justify-between gap-7 py-8 lg:py-10">
          <h1 className="font-display text-poster uppercase text-ink-900">
            Elle
            <br />
            Fanning
            <span className="ml-[0.06em] inline-block size-[0.16em] bg-yellow-400" />
          </h1>
          <div className="max-w-[34ch]">
            <Rule />
            <p className="mt-3 whitespace-pre-line font-mono text-body uppercase text-ink-800">
              {STATEMENT}
            </p>
          </div>
        </div>

        <div className="flex min-h-[42svh] border-line-rule lg:min-h-0 lg:border-l">
          <SideLabel tone="accent">01 — Introduction</SideLabel>
          <ImagePlate
            fill
            className="flex-1"
            alt="Elle Fanning"
            caption="Elle Fanning"
            captionRole="Actress · Producer"
            placeholder={"PORTRAIT\nFULL BLEED · GRAYSCALE"}
            sizes="(min-width: 1024px) 46vw, 100vw"
            priority
          />
        </div>
      </div>

      <ScrollCue href="#filmography" index="01 / 08" />
    </section>
  );
}
