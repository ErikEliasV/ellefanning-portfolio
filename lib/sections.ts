export type SectionId =
  | "hero"
  | "filmography"
  | "characters"
  | "editorial"
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
  { id: "editorial", index: "04", label: "Editorial" },
  { id: "current", index: "05", label: "Projetos atuais" },
  { id: "footer", index: "06", label: "Final" },
] as const;
