import { Eyebrow } from "@/components/core/Eyebrow";
import { Rule } from "@/components/core/Rule";
import { SECTIONS } from "@/lib/sections";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col justify-center">
      <div className="frame py-16">
        <Eyebrow rule index="00/">
          Design system
        </Eyebrow>
        <h1 className="mt-6 font-display text-poster uppercase text-ink-900">
          Elle
          <br />
          Fanning
          <span className="ml-[0.06em] inline-block size-[0.18em] bg-yellow-400 align-baseline" />
        </h1>
        <Rule className="mt-8" />
        <ol className="mt-8 grid gap-0 sm:grid-cols-2">
          {SECTIONS.map((section) => (
            <li
              key={section.id}
              className="flex items-baseline gap-3 border-b border-line-hairline py-3 font-mono text-label font-bold uppercase tracking-label"
            >
              <span className="text-yellow-600">{section.index}</span>
              <span className="text-ink-500">{section.label}</span>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
