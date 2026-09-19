"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";
import { CELL_VECTORS } from "@/lib/characterStage";
import { CHARACTERS } from "@/lib/characters";
import { cn } from "@/lib/cn";
import { depthParallax, flyIn, grainPulse } from "@/lib/reveal";
import { useCharacterStage } from "@/lib/useCharacterStage";
import "@/styles/characters.css";

function two(value: number) {
  return String(value).padStart(2, "0");
}

export function Characters() {
  const [open, setOpen] = useState<string | null>(null);
  const section = useRef<HTMLElement>(null);
  const { track, stage } = useCharacterStage();

  useEffect(() => {
    const node = section.current;
    if (!node) return;

    const cards = Array.from(node.querySelectorAll(".character-card"));
    const kills = [
      grainPulse(node, node),
      flyIn(
        cards.map((el, at) => ({
          el,
          // Mais células que vetores só aconteceria se CHARACTERS crescesse;
          // o módulo é a fonte da coreografia, então a lista dá a volta em vez
          // de deixar uma peça sem movimento nenhum.
          from: CELL_VECTORS[at % CELL_VECTORS.length],
        })),
      ),
    ];

    cards.forEach((card) => {
      const still = card.querySelector(".character-image");
      if (still) kills.push(depthParallax(card, [{ el: still, rate: 0.08 }]));
    });

    return () => kills.forEach((kill) => kill());
  }, []);

  return (
    <section ref={section} id="characters" className="character-section grain">
      <div ref={track} className="character-track">
        <div ref={stage} className="character-stage">
          {/* O preto que varre da direita. Fica por baixo das duas cópias do
              título: é a borda dele que corta uma e revela a outra. */}
          <div aria-hidden className="character-panel" />

          <h2 className="character-heading character-heading-ink">Characters</h2>

          {/* A cópia branca, recortada exatamente pelo mesmo avanço do painel.
              Os dois clip-path medem contra a caixa do palco, e não contra a
              do título, senão as duas bordas não coincidiriam. */}
          <div aria-hidden className="character-veil">
            <p className="character-heading character-heading-paper">
              Characters
            </p>
          </div>
        </div>
      </div>

      <div className="character-shell" data-cursor-skin="invert">
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

                    <span aria-hidden className="character-cue">
                      {isOpen ? "Close" : "Read more"}
                    </span>
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
