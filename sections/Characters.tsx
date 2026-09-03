import { HoverClip } from "@/components/content/HoverClip";
import { CHARACTERS } from "@/lib/characters";
import "@/styles/characters.css";

const LEAD =
  "Not the films — the people inside them. Hover a face to read what she made of it.";

export function Characters() {
  return (
    <section
      id="characters"
      className="grain border-t border-line-rule bg-ink-900 text-paper-100"
    >
      <div className="character-header">
        <div className="character-header-row">
          <h2 className="character-heading">Characters</h2>
          <p className="character-lead">{LEAD}</p>
        </div>
      </div>

      <ul className="grid grid-cols-2 border-t border-line-invert md:grid-cols-4">
        {CHARACTERS.map((character, index) => (
          <li
            key={character.id}
            className="group relative border-b border-r border-line-invert last:border-r-0"
          >
            <HoverClip
              alt={`${character.name} — ${character.film}`}
              poster={character.still}
              reveal="always-color"
              ratio="3 / 4"
              sizes="(min-width: 768px) 25vw, 50vw"
              placeholder={`${character.name.toUpperCase()}\n${character.film}`}
              className="bg-ink-800"
            />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-[var(--scrim-plate)] px-3 py-2">
              <span className="font-mono text-micro font-bold uppercase tracking-label text-rose-400">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="font-display text-display-4 uppercase leading-[0.92] text-paper-100">
                {character.name}
              </span>
              <span className="font-mono text-micro uppercase tracking-label text-ink-300">
                {character.film} · {character.year}
              </span>
              <p className="max-h-0 overflow-hidden font-mono text-micro uppercase leading-relaxed text-paper-100 opacity-0 transition-all duration-[220ms] ease-[var(--ease-out)] group-hover:max-h-24 group-hover:pt-2 group-hover:opacity-100">
                {character.note}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
