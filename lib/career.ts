export type CareerEntry = {
  id: string;
  year: string;
  label: string;
  project: string;
  note: string;
  media?: string;
  clip?: string;
};

export const CAREER: readonly CareerEntry[] = [
  {
    id: "2001",
    year: "2001",
    label: "First frame",
    project: "I Am Sam",
    note: "Cast at three years old as the younger version of her sister's character.",
  },
  {
    id: "2006",
    year: "2006",
    label: "Ensemble",
    project: "Babel",
    note: "A small part inside a film that circles the globe.",
  },
  {
    id: "2010",
    year: "2010",
    label: "The turn",
    project: "Somewhere",
    note: "Sofia Coppola hands her a whole film to carry, quietly.",
  },
  {
    id: "2011",
    year: "2011",
    label: "Breakout",
    project: "Super 8",
    note: "A summer blockbuster that everybody leaves talking about her.",
  },
  {
    id: "2014",
    year: "2014",
    label: "Scale",
    project: "Maleficent",
    note: "The studio fairy tale, played without irony.",
  },
  {
    id: "2016",
    year: "2016",
    label: "The swing",
    project: "The Neon Demon",
    note: "Horror, fashion and self-destruction in the same year as 20th Century Women.",
  },
  {
    id: "2020",
    year: "2020",
    label: "Producer",
    project: "The Great",
    note: "She stops only acting in the work and starts making it.",
  },
  {
    id: "2024",
    year: "2024",
    label: "Now",
    project: "A Complete Unknown",
    note: "Two decades in, still being cast as the surprise.",
  },
];
