"use client";

import Image from "next/image";
import { useState } from "react";
import { asset } from "@/lib/asset";
import { CHARACTERS } from "@/lib/characters";
import { cn } from "@/lib/cn";
import "@/styles/characters.css";

function two(value: number) {
  return String(value).padStart(2, "0");
}

export function Characters() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section
      id="characters"
      className="character-section"
      data-cursor-skin="invert"
    >
      <div className="character-shell">
        <div className="character-header">
          <h2 className="character-heading">Characters</h2>
        </div>

        <ul className="character-list">
          {CHARACTERS.map((character, index) => {
            const isOpen = open === character.id;

            return (
              <li key={character.id} className="character-cell">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  data-cursor={isOpen ? "Close" : "Read more"}
                  onClick={() => setOpen(isOpen ? null : character.id)}
                  className={cn("character-card", isOpen && "is-open")}
                >
                  <span className="character-shot">
                    {character.still ? (
                      <Image
                        src={asset(character.still)}
                        alt={`${character.name} — ${character.film}`}
                        fill
                        sizes="(min-width: 64rem) 32vw, (min-width: 40rem) 48vw, 94vw"
                        draggable={false}
                        className="character-image"
                      />
                    ) : null}
                  </span>

                  <span className="character-plate">
                    <span className="character-lead">
                      <span className="character-index">{two(index + 1)}</span>
                      <span className="character-name">{character.name}</span>
                      <span className="character-credit">
                        {character.film} · {character.year}
                      </span>
                    </span>

                    <span className="character-story">{character.story}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
