import { CharacterStage } from "@/components/content/CharacterStage";
import { CHARACTERS } from "@/lib/characters";
import "@/styles/characters.css";

export function Characters() {
  return (
    <section id="characters" className="character-section grain">
      <CharacterStage characters={CHARACTERS} />
    </section>
  );
}
