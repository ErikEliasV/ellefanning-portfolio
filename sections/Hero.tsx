import { SpotlightPortrait } from "@/components/content/SpotlightPortrait";
import { ScrollCue } from "@/components/core/ScrollCue";

const STATEMENT =
  "Screen work, characters and editorials — from the first role to what comes next.";

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

      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center px-[var(--gutter-page)] pt-[4vh] md:px-0">
          <div className="relative aspect-[240/248] w-full [container-type:inline-size] md:aspect-[2281/1450] md:h-full md:w-auto md:max-w-full">
            <h1 className="pointer-events-none absolute left-0 top-[29.167cqw] z-20 font-display text-[20cqw] uppercase leading-[0.875] tracking-poster text-ink-900 md:top-[15.87cqw] md:z-10 md:text-[14.029cqw]">
              Elle
              <br />
              Fanning
              <span className="text-yellow-400">.</span>
            </h1>

            <div
              aria-hidden
              className="pointer-events-none absolute left-[39.583cqw] top-0 z-0 h-[50.75cqw] w-[35.417cqw] bg-yellow-400 md:left-[46.471cqw] md:h-[35.774cqw] md:w-[25.559cqw]"
            />

            <div className="absolute left-[27.5cqw] top-[3.75cqw] z-10 h-[88.333cqw] w-[72.083cqw] md:left-[37.352cqw] md:top-[6.094cqw] md:z-20 md:h-[76.896cqw] md:w-[62.648cqw]">
              <SpotlightPortrait
                src="/images/ellefanning-hero.png"
                alt="Elle Fanning"
                className="h-full w-full"
                imageClassName="object-cover object-top"
                sizes="(min-width: 768px) 45vw, 75vw"
                radius={190}
                priority
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bleed border-t border-line-hairline py-3">
        <p className="font-mono text-body-sm uppercase text-ink-800">
          {STATEMENT}
        </p>
      </div>

      <ScrollCue href="#filmography" index="01 / 08" />
    </section>
  );
}
