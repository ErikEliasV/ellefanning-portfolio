export type Film = {
  id: string;
  title: string;
  year: number;
  character: string;
  director: string;
  poster?: string;
  clip?: string;
  youtubeId?: string;
};

export const FILMS: readonly Film[] = [
  {
    id: "i-am-sam",
    title: "I Am Sam",
    year: 2001,
    character: "Lucy Dawson",
    director: "Jessie Nelson",
  },
  {
    id: "babel",
    title: "Babel",
    year: 2006,
    character: "Debbie Jones",
    director: "Alejandro G. Iñárritu",
  },
  {
    id: "benjamin-button",
    title: "The Curious Case of Benjamin Button",
    year: 2008,
    character: "Daisy",
    director: "David Fincher",
  },
  {
    id: "phoebe-in-wonderland",
    title: "Phoebe in Wonderland",
    year: 2008,
    character: "Phoebe Lichten",
    director: "Daniel Barnz",
  },
  {
    id: "somewhere",
    title: "Somewhere",
    year: 2010,
    character: "Cleo",
    director: "Sofia Coppola",
  },
  {
    id: "super-8",
    title: "Super 8",
    year: 2011,
    character: "Alice Dainard",
    director: "J. J. Abrams",
  },
  {
    id: "ginger-and-rosa",
    title: "Ginger & Rosa",
    year: 2012,
    character: "Ginger",
    director: "Sally Potter",
  },
  {
    id: "maleficent",
    title: "Maleficent",
    year: 2014,
    character: "Princess Aurora",
    director: "Robert Stromberg",
  },
  {
    id: "the-neon-demon",
    title: "The Neon Demon",
    year: 2016,
    character: "Jesse",
    director: "Nicolas Winding Refn",
  },
  {
    id: "20th-century-women",
    title: "20th Century Women",
    year: 2016,
    character: "Julie",
    director: "Mike Mills",
  },
  {
    id: "the-beguiled",
    title: "The Beguiled",
    year: 2017,
    character: "Alicia",
    director: "Sofia Coppola",
  },
  {
    id: "mary-shelley",
    title: "Mary Shelley",
    year: 2017,
    character: "Mary Shelley",
    director: "Haifaa al-Mansour",
  },
  {
    id: "teen-spirit",
    title: "Teen Spirit",
    year: 2018,
    character: "Violet Valenski",
    director: "Max Minghella",
  },
  {
    id: "the-great",
    title: "The Great",
    year: 2020,
    character: "Catherine the Great",
    director: "Tony McNamara",
  },
  {
    id: "the-girl-from-plainville",
    title: "The Girl from Plainville",
    year: 2022,
    character: "Michelle Carter",
    director: "Lisa Cholodenko",
  },
  {
    id: "a-complete-unknown",
    title: "A Complete Unknown",
    year: 2024,
    character: "Sylvie Russo",
    director: "James Mangold",
  },
];

export const CURRENT_WORK = {
  title: "Predator: Badlands",
  year: 2025,
  character: "Thia",
  director: "Dan Trachtenberg",
  note: "The newest chapter — and the one still being written.",
} as const;
