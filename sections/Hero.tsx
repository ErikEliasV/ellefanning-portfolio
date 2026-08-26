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
        <div className="absolute inset-0 flex justify-center">
        <div className="relative flex h-full w-full flex-col justify-end px-[var(--gutter-page)] [container-type:inline-size] md:aspect-[1924/1319] md:w-auto md:max-w-full md:px-0">
          <h1 className="pointer-events-none relative z-10 pb-[1cqw] font-display text-[26cqw] uppercase leading-[0.86] tracking-poster text-ink-900 md:absolute md:left-0 md:top-[7.224cqw] md:pb-0 md:text-[16.632cqw] md:leading-[0.875]">
            Elle
            <br />
            Fanning
            <span className="text-yellow-400">.</span>
          </h1>

          <div
            aria-hidden
            className="pointer-events-none absolute right-[6cqw] top-[4cqw] z-0 h-[34cqw] w-[26cqw] bg-yellow-400 md:left-[56.237cqw] md:right-auto md:top-0 md:h-[36.123cqw] md:w-[25.208cqw]"
          />

          <div className="absolute bottom-0 right-[-4cqw] z-0 h-[112cqw] w-[104cqw] md:bottom-auto md:left-[46.466cqw] md:right-auto md:top-[2.859cqw] md:z-20 md:h-[65.696cqw] md:w-[53.534cqw]">
            <SpotlightPortrait
              src="/images/ellefanning-hero.png"
              alt="Elle Fanning"
              className="h-full w-full"
              imageClassName="object-cover object-top"
              sizes="(min-width: 768px) 55vw, 100vw"
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
