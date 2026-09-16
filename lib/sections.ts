import { CURRENT_WORK } from "@/lib/films";

export type SectionId =
  | "hero"
  | "filmography"
  | "characters"
  | "editorial"
  | "current";

export type NavSection = {
  id: SectionId;
  label: string;
  still: string;
  clip: string;
  focus: number;
};

// Os rotulos sao os do Figma (no 2338:61). CARACTERS estava escrito errado no
// arquivo e entra corrigido; CASES e o nome que o desenho da a secao editorial.
//
// focus e onde o recorte do painel cai na vertical da imagem, 0 topo, 1 base.
// O painel e uma faixa 2.74:1 e os stills sao retrato: sem isso o corte pega a
// barriga do poster em vez do rosto.
export const SECTIONS: readonly NavSection[] = [
  {
    id: "hero",
    label: "HOME",
    still: "/images/ellefanning-hero-portrait.webp",
    clip: "/videos/hero.mp4",
    focus: 0.3,
  },
  {
    id: "filmography",
    label: "FILMOGRAPHY",
    still: "/images/films/the-great.jpg",
    clip: "/videos/filmography.mp4",
    focus: 0.35,
  },
  {
    id: "characters",
    label: "CHARACTERS",
    still: "/images/characters/cleo-somewhere.jpg",
    clip: "/videos/characters.mp4",
    focus: 0.4,
  },
  {
    id: "editorial",
    label: "CASES",
    still: "/images/editorial/vogue-2026.jpg",
    clip: "/videos/editorial.mp4",
    focus: 0.3,
  },
  {
    id: "current",
    label: "NOW",
    still: `https://i.ytimg.com/vi/${CURRENT_WORK.youtubeId}/maxresdefault.jpg`,
    clip: "/videos/now.mp4",
    focus: 0.5,
  },
] as const;
