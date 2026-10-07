"use client";

import Image from "next/image";
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import { asset } from "@/lib/asset";
import { CharacterDialog, type Origin } from "@/components/characters/CharacterDialog";
import type { Character } from "@/data/characters";
import { isReduced } from "@/lib/scroll";
import { useCharacterDeck } from "@/hooks/useCharacterDeck";

// Espelha --duration-modal de styles/globals.css: a saida precisa ficar montada
// exatamente por essa janela para a transicao rodar ate o fim antes do
// desmonte. Sob prefers-reduced-motion o token cai para 120ms -- mesma fonte,
// os dois lados enxergam o mesmo numero. Mesmo par que FilmStage.tsx usa.
const EXIT_MS = 900;
const EXIT_MS_REDUCED = 120;

// Um card do deck, memorizado. O carrossel do PC troca o indice vivo a cada
// 1,2s, e a troca cai no meio da travessia -- o instante em que as fotos andam
// mais rapido. Sem o memo, cada troca renderizava os oito cards e as 32
// imagens de novo bem ali; com ele, so os dois cuja `live` mudou.
const CharacterCard = memo(function CharacterCard({
  character,
  index,
  live,
  onOpen,
}: {
  character: Character;
  index: number;
  live: boolean;
  onOpen: (index: number, event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      className="character-card"
      style={{ "--focus": character.focus ?? 0.5 } as CSSProperties}
      data-live={live ? "" : undefined}
      data-cursor={live ? "Open" : undefined}
      aria-label={`${character.name} — ${character.film} (${character.year}), open details`}
      onClick={(event) => onOpen(index, event)}
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
      {/* O desfoque progressivo do pe. No no cada card lateral
          leva um Layer blur progressivo -- 0 no topo, 18px na base no
          desktop e 8,5 no telefone. CSS nao tem filtro progressivo.

          Sao TRES camadas, e a contagem e o ponto. A primeira versao
          usava uma so, borrada no raio cheio e cruzada com a nitida
          por um gradiente de altura inteira: no meio do card viam-se
          as DUAS a 50%, que e fantasma, nao desfoque -- foi o que o
          dono do projeto viu e recusou. Com tres degraus, cada faixa
          da altura mostra praticamente uma camada so, e o cruzamento
          acontece entre raios vizinhos (0,3 e 0,62 do cheio), perto
          demais um do outro para dobrar a imagem.

          O `src` e o mesmo da copia nitida nas tres: a rede e a
          decodificacao acontecem uma vez so. */}
      {[1, 2, 3].map((step) => (
        <Image
          key={step}
          src={asset(character.still)}
          alt=""
          aria-hidden
          fill
          sizes="(min-width: 64rem) 36vw, 62vw"
          draggable={false}
          className={`character-card-img character-card-haze character-card-haze-${step}`}
        />
      ))}
      {live ? (
        <span aria-hidden className="character-card-cue">Open</span>
      ) : null}
    </button>
  );
});

export function CharacterStage({ characters }: { characters: readonly Character[] }) {
  const [open, setOpen] = useState<number | null>(null);
  // O carrossel do PC espera com o modal aberto, e durante a saida dele tambem
  // (`open` so volta a null quando ela termina): a foto encolhe de volta para o
  // retangulo de onde saiu, e se o carrossel tivesse andado ela pousaria no
  // lugar de outra personagem.
  const { track, deck, rail, active } = useCharacterDeck(
    characters.length,
    open !== null,
  );
  const now = characters[active];
  // "closing" mantem o CharacterDialog montado durante a saida -- sem ele o
  // desmonte e imediato e nao sobra tempo para a foto encolher de volta.
  const [closing, setClosing] = useState(false);
  const [origin, setOrigin] = useState<Origin | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const exitTimer = useRef(0);
  // Guarda se havia modal aberto no render anterior, para o refoco abaixo nao
  // disparar na montagem inicial.
  const wasOpen = useRef(false);

  // useCallback pela mesma razao do closeCharacter abaixo, agora do lado dos
  // cards: eles sao memorizados, e uma funcao nova a cada render os faria
  // renderizar de novo todos juntos. So le refs e setters, entao nao depende
  // de nada.
  const openCharacter = useCallback(
    (index: number, event: MouseEvent<HTMLButtonElement>) => {
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
    },
    [],
  );

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
        {/* A TINTA, e dentro dela tudo que so existe sobre ela.

            Ate 2026-09-28 isto era um <span> vazio que aparecia por opacidade.
            Agora e um painel preto que entra pela ESQUERDA por translacao, e
            ele carrega a propria palavra branca: o `-fix` anula exatamente a
            translacao do pai, entao o que esta aqui dentro fica PARADO no
            espaco da tela enquanto a caixa desliza por baixo, e o
            `overflow: hidden` do painel recorta na aresta da tinta.

            E por isso que existem duas copias da palavra. A preta mora fora
            daqui e desliza por conta propria; esta, branca, faz o MESMO
            deslize dentro do painel. Onde o preto ja chegou, esta aparece e a
            de fora fica coberta; onde ainda nao chegou, so a de fora existe. O
            resultado e a palavra virando branca a medida que o fundo passa por
            cima dela, com a fronteira sendo a borda da propria tinta -- exata,
            e sem nenhum `clip-path` recalculado a 60/s.

            As palavras de textura do telefone vieram junto pela mesma razao:
            sao um tom ABAIXO do fundo preto, e sobre a tela branca da emenda
            com a filmografia elas apareceriam como dois blocos escuros. Aqui
            dentro elas so existem onde ha tinta. */}
        <span aria-hidden className="character-floor">
          <span className="character-floor-fix">
            {/* Textura, nao texto: duas copias da palavra num tom abaixo do
                fundo, derivando em sentidos opostos. So no telefone. */}
            <p className="character-drift character-drift-top">Characters</p>
            <p className="character-drift character-drift-bottom">Characters</p>

            <p className="character-word character-word-lit">Characters</p>
          </span>
        </span>

        {/* A copia PRETA, e o <h2> de verdade: a branca esta dentro de um
            `aria-hidden`, entao quem carrega o titulo da secao e esta. Ela
            voltou a se MOVER no perfil largo -- deslizava quando era fundo,
            parou quando virou regua dos docks do trilho antigo, e com o trilho
            fora nao ha mais nada ancorado nela. Entra pela direita, sai pela
            esquerda, nos dois tamanhos de tela. */}
        <h2 className="character-word character-word-dark">
          Characters
        </h2>

        <div ref={deck} className="character-deck">
          <div ref={rail} className="character-rail">
            {characters.map((character, index) => (
              <CharacterCard
                key={character.id}
                character={character}
                index={index}
                live={index === active}
                onOpen={openCharacter}
              />
            ))}
          </div>

          <div className="character-cap">
            {/* Separada do texto de proposito. A faixa do no leva um background
                blur PROGRESSIVO (0 a 13,5px), e progressivo em CSS quer dizer
                mascara -- e uma mascara aplicada em `.character-cap` desceria
                para os filhos e apagaria o topo do nome junto com o desfoque.
                Com a camada propria, o gradiente fica no desfoque e o texto
                pinta por cima, inteiro. */}
            <span aria-hidden className="character-cap-haze" />
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
