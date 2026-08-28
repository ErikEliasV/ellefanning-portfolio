export type Mark = {
  id: string;
  lines: readonly [string, string];
};

export const MARKS: readonly Mark[] = [
  { id: "role", lines: ["Actress", "Producer"] },
  { id: "kind", lines: ["Portfolio", "Selected work"] },
  { id: "edition", lines: ["Archive", "2026 edition"] },
] as const;
