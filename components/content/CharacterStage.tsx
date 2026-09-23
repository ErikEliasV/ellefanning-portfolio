"use client";

import Image from "next/image";
import { type CSSProperties } from "react";
import { asset } from "@/lib/asset";
import type { Character } from "@/lib/characters";

export function CharacterStage({ characters }: { characters: readonly Character[] }) {
  const now = characters[0];

  return (
    <div className="character-track">
      {/* O palco e escuro desde o primeiro quadro em que se ve alguma coisa,
          entao a pele clara do cursor vale para tudo que estiver aqui dentro --
          nao ha mais o limiar que a varredura antiga precisava. */}
      <div className="character-stage" data-cursor-skin="invert">
        <span aria-hidden className="character-floor" />

        {/* Textura, nao texto: duas copias da palavra num tom abaixo do fundo,
            derivando em sentidos opostos. So existem no telefone (Tarefa 9). */}
        <p aria-hidden className="character-drift character-drift-top">Characters</p>
        <p aria-hidden className="character-drift character-drift-bottom">Characters</p>

        {/* O mesmo <h2> nos dois tamanhos de tela: gigante atras do deck no
            desktop, pequeno e branco acima dele no telefone. Esconder um e
            mostrar outro deixaria o celular sem cabecalho nenhum. */}
        <h2 className="character-word">Characters</h2>

        <div className="character-deck">
          <div className="character-rail">
            {characters.map((character, index) => (
              <button
                key={character.id}
                type="button"
                className="character-card"
                style={{ "--focus": character.focus ?? 0.5 } as CSSProperties}
                data-live={index === 0 ? "" : undefined}
                data-cursor={index === 0 ? "Open" : undefined}
                aria-label={`${character.name} — ${character.film} (${character.year}), open details`}
              >
                <Image
                  src={asset(character.still)}
                  alt=""
                  aria-hidden
                  fill
                  sizes="(min-width: 64rem) 36vw, 62vw"
                  priority={index === 0}
                  draggable={false}
                  className="character-card-img"
                />
                {index === 0 ? (
                  <span aria-hidden className="character-card-cue">Open</span>
                ) : null}
              </button>
            ))}
          </div>

          <div className="character-cap">
            <span className="character-cap-block">
              <span className="character-cap-name">{now.name}</span>
              <span className="character-cap-film">{now.film}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
