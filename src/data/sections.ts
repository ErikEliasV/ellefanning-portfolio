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
