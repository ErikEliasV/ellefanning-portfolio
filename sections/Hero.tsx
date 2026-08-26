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

      <div className="relative flex flex-1 overflow-hidden">
        <div className="frame relative flex flex-col justify-end [container-type:inline-size]">
          <div
            aria-hidden
            className="pointer-events-none absolute right-[6cqw] top-[4cqw] z-0 h-[34cqw] w-[26cqw] bg-yellow-400 md:right-[8cqw] md:top-[6cqw] md:h-[44cqw] md:w-[24cqw]"
          />

          <div className="absolute bottom-0 right-[-4cqw] z-0 h-[112cqw] w-[104cqw] md:bottom-[-8cqw] md:right-[-26cqw] md:top-[3cqw] md:z-20 md:h-auto md:w-[64cqw]">
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

          <h1 className="pointer-events-none relative z-10 pb-[1cqw] font-display text-[26cqw] uppercase leading-[0.86] tracking-poster text-ink-900 md:pb-[8cqw] md:text-[20cqw]">
            Elle
            <br />
            Fanning
            <span className="ml-[0.04em] inline-block size-[0.14em] bg-yellow-400" />
          </h1>
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
