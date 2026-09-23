"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import { asset } from "@/lib/asset";
import { CharacterDialog, type Origin } from "@/components/content/CharacterDialog";
import type { Character } from "@/lib/characters";
import { isReduced } from "@/lib/scroll";
import { useCharacterDeck } from "@/lib/useCharacterDeck";

// Espelha --duration-modal de styles/globals.css: a saida precisa ficar montada
// exatamente por essa janela para a transicao rodar ate o fim antes do
// desmonte. Sob prefers-reduced-motion o token cai para 120ms -- mesma fonte,
// os dois lados enxergam o mesmo numero. Mesmo par que FilmStage.tsx usa.
const EXIT_MS = 900;
const EXIT_MS_REDUCED = 120;

export function CharacterStage({ characters }: { characters: readonly Character[] }) {
  const { track, deck, rail, active } = useCharacterDeck(characters.length);
  const now = characters[active];
  const [open, setOpen] = useState<number | null>(null);
  // "closing" mantem o CharacterDialog montado durante a saida -- sem ele o
  // desmonte e imediato e nao sobra tempo para a foto encolher de volta.
  const [closing, setClosing] = useState(false);
  const [origin, setOrigin] = useState<Origin | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const exitTimer = useRef(0);
  // Guarda se havia modal aberto no render anterior, para o refoco abaixo nao
  // disparar na montagem inicial.
  const wasOpen = useRef(false);

  function openCharacter(index: number, event: MouseEvent<HTMLButtonElement>) {
    window.clearTimeout(exitTimer.current);
    trigger.current = event.currentTarget;
    const rect = event.currentTarget.getBoundingClientRect();
    // O raio vem lido do proprio card, e nao recalculado a partir da geometria:
    // uma leitura so, no clique, e os dois lados nunca discordam sobre quanto
    // ele media naquele instante.
    const radius = Number.parseFloat(
      window.getComputedStyle(event.currentTarget).borderTopLeftRadius,
    );
    setOrigin({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      radius: Number.isFinite(radius) ? radius : 0,
    });
    setClosing(false);
    setOpen(index);
  }

  // useCallback, e nao uma funcao solta: CharacterDialog usa esta referencia
  // como dependencia do efeito que trava o foco e liga o scroll. Uma identidade
  // nova a cada render faria aquele efeito desmontar e remontar a toa.
  const closeCharacter = useCallback(() => setClosing(true), []);

  useEffect(() => {
    if (!closing) return;
    const ms = isReduced() ? EXIT_MS_REDUCED : EXIT_MS;
    exitTimer.current = window.setTimeout(() => {
      setOpen(null);
      setClosing(false);
    }, ms);
    return () => window.clearTimeout(exitTimer.current);
  }, [closing]);

  // Devolve o foco ao card de origem quando o modal termina de sair.
  useEffect(() => {
    if (open !== null) {
      wasOpen.current = true;
      return;
    }
    if (!wasOpen.current) return;
    wasOpen.current = false;
    trigger.current?.focus();
  }, [open]);

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
                onClick={(event) => openCharacter(index, event)}
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

      {open !== null && origin ? (
        <CharacterDialog
          character={characters[open]}
          closing={closing}
          origin={origin}
          onClose={closeCharacter}
        />
      ) : null}
    </div>
  );
}
