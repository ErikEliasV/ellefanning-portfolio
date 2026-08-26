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

      <div className="frame relative flex flex-1 flex-col justify-end overflow-hidden [container-type:inline-size]">
        <div
          aria-hidden
          className="pointer-events-none absolute right-[6cqw] top-[4cqw] h-[34cqw] w-[26cqw] bg-yellow-400"
        />

        <div className="absolute bottom-0 right-[-4cqw] z-0 h-[112cqw] w-[104cqw] lg:top-0 lg:h-auto lg:w-[64cqw]">
          <SpotlightPortrait
            src="/images/ellefanning-hero.png"
            alt="Elle Fanning"
            className="h-full w-full"
            imageClassName="object-cover object-top"
            sizes="(min-width: 1024px) 70vw, 110vw"
            radius={190}
            priority
          />
        </div>

        <h1 className="pointer-events-none relative z-10 pb-[1cqw] font-display text-[26cqw] uppercase leading-[0.86] tracking-poster text-ink-900">
          Elle
          <br />
          Fanning
          <span className="ml-[0.04em] inline-block size-[0.14em] bg-yellow-400" />
        </h1>
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
