"use client";

import Image from "next/image";
import { type CSSProperties } from "react";
import { asset } from "@/lib/asset";
import type { Character } from "@/lib/characters";
import { useCharacterDeck } from "@/lib/useCharacterDeck";

export function CharacterStage({ characters }: { characters: readonly Character[] }) {
  const { track, deck, rail, active } = useCharacterDeck(characters.length);
  const now = characters[active];

  return (
    <div ref={track} className="character-track">
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

        <div ref={deck} className="character-deck">
          <div ref={rail} className="character-rail">
            {characters.map((character, index) => (
              <button
                key={character.id}
                type="button"
                className="character-card"
                style={{ "--focus": character.focus ?? 0.5 } as CSSProperties}
                data-live={index === active ? "" : undefined}
                data-cursor={index === active ? "Open" : undefined}
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
                {/* A copia espelhada. No Figma os cards da direita estao
                    espelhados e os da esquerda e o do centro nao; e o que deixa
                    o leque simetrico. Duas copias cruzando opacidade, e nao um
                    scaleX que vira de uma vez: uma troca instantanea sobre um
                    rosto a 60 quadros por segundo o olho pega. O cruzamento
                    acontece no quarto externo do ultimo salto, com o card ainda
                    estreito e em boa parte coberto pelo vizinho. Mesmo arquivo
                    da copia de baixo: o browser serve as duas da mesma
                    requisicao. */}
                <Image
                  src={asset(character.still)}
                  alt=""
                  aria-hidden
                  fill
                  sizes="(min-width: 64rem) 36vw, 62vw"
                  draggable={false}
                  className="character-card-img character-card-img-mirror"
                />
                {index === active ? (
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
