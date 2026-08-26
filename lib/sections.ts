export type SectionId =
  | "hero"
  | "filmography"
  | "characters"
  | "timeline"
  | "editorial"
  | "behind-the-scenes"
  | "current"
  | "footer";

export type Section = {
  id: SectionId;
  index: string;
  label: string;
};

export const SECTIONS: readonly Section[] = [
  { id: "hero", index: "01", label: "Apresentação" },
  { id: "filmography", index: "02", label: "Filmografia" },
  { id: "characters", index: "03", label: "Personagens" },
  { id: "timeline", index: "04", label: "Carreira" },
  { id: "editorial", index: "05", label: "Editorial" },
  { id: "behind-the-scenes", index: "06", label: "Bastidores" },
  { id: "current", index: "07", label: "Projetos atuais" },
  { id: "footer", index: "08", label: "Final" },
] as const;
