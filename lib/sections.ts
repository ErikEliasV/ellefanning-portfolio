export type SectionId =
  | "hero"
  | "filmography"
  | "characters"
  | "editorial"
  | "current";

export type NavSection = {
  id: SectionId;
  label: string;
  clip: string;
  focus: number;
};

// Os rotulos sao os do Figma (no 2338:61). CARACTERS estava escrito errado no
// arquivo e entra corrigido; CASES e o nome que o desenho da a secao editorial.
//
// focus e onde o recorte do painel cai na vertical do clipe, 0 topo, 1 base.
// O painel e mais largo que 16:9, entao o corte come altura: e isso que decide
// qual faixa do quadro sobrevive.
export const SECTIONS: readonly NavSection[] = [
  {
    id: "hero",
    label: "HOME",
    clip: "/videos/hero.mp4",
    focus: 0.3,
  },
  {
    id: "filmography",
    label: "FILMOGRAPHY",
    clip: "/videos/filmography.mp4",
    focus: 0.35,
  },
  {
    id: "characters",
    label: "CHARACTERS",
    clip: "/videos/characters.mp4",
    focus: 0.4,
  },
  {
    id: "editorial",
    label: "CASES",
    clip: "/videos/editorial.mp4",
    focus: 0.3,
  },
  {
    id: "current",
    label: "NOW",
    clip: "/videos/now.mp4",
    focus: 0.5,
  },
] as const;
