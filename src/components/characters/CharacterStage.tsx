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

const EXIT_MS = 900;
const EXIT_MS_REDUCED = 120;

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
  const { track, deck, rail, active } = useCharacterDeck(
    characters.length,
    open !== null,
  );
  const now = characters[active];
  const [closing, setClosing] = useState(false);
  const [origin, setOrigin] = useState<Origin | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const exitTimer = useRef(0);
  const wasOpen = useRef(false);

  const openCharacter = useCallback(
    (index: number, event: MouseEvent<HTMLButtonElement>) => {
      window.clearTimeout(exitTimer.current);
      trigger.current = event.currentTarget;
      const rect = event.currentTarget.getBoundingClientRect();
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
      <div className="character-stage" data-cursor-skin="invert">
        <span aria-hidden className="character-floor">
          <span className="character-floor-fix">
            <p className="character-drift character-drift-top">Characters</p>
            <p className="character-drift character-drift-bottom">Characters</p>

            <p className="character-word character-word-lit">Characters</p>
          </span>
        </span>

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
