export type Character = {
  id: string;
  name: string;
  film: string;
  year: number;
  note: string;
  still?: string;
  altStill?: string;
};

export const CHARACTERS: readonly Character[] = [
  {
    id: "cleo",
    name: "Cleo",
    film: "Somewhere",
    year: 2010,
    note: "A daughter watching her father disappear inside his own fame.",
    still: "/images/characters/cleo-somewhere.jpg",
  },
  {
    id: "alice",
    name: "Alice Dainard",
    film: "Super 8",
    year: 2011,
    note: "The girl who steals the film the moment she starts acting inside it.",
    still: "/images/characters/alice-super8.webp",
  },
  {
    id: "ginger",
    name: "Ginger",
    film: "Ginger & Rosa",
    year: 2012,
    note: "A teenager holding the bomb of the world and her own house at once.",
    still: "/images/characters/ginger-ginger-rosa.jpg",
  },
  {
    id: "aurora",
    name: "Princess Aurora",
    film: "Maleficent",
    year: 2014,
    note: "The fairy tale played straight, with no wink to the camera.",
    still: "/images/characters/princess-aurora-maleficent.jpg",
  },
  {
    id: "jesse",
    name: "Jesse",
    film: "The Neon Demon",
    year: 2016,
    note: "Innocence sharpened into a weapon, then swallowed whole.",
    still: "/images/characters/jesse-the-neon-demon.avif",
  },
  {
    id: "alicia",
    name: "Alicia",
    film: "The Beguiled",
    year: 2017,
    note: "Boredom turning slowly, deliberately, into appetite.",
    still: "/images/characters/alicia-the-beguiled.jpg",
  },
  {
    id: "violet",
    name: "Violet Valenski",
    film: "Teen Spirit",
    year: 2018,
    note: "A voice used as an escape route.",
    still: "/images/characters/violet-valenski-teen-spirit.avif",
  },
  {
    id: "catherine",
    name: "Catherine the Great",
    film: "The Great",
    year: 2020,
    note: "An empress built out of comedy, rage and absolute nerve.",
    still: "/images/characters/catherine-the-great.jpg",
  },
];
