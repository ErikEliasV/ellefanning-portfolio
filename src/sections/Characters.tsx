import { CharacterStage } from "@/components/characters/CharacterStage";
import { CHARACTERS } from "@/data/characters";
import "@/styles/characters.css";

export function Characters() {
  return (
    <section id="characters" className="character-section grain">
      <CharacterStage characters={CHARACTERS} />
    </section>
  );
}
