export type Film = {
  id: string;
  title: string;
  year: number;
  character: string;
  director: string;
  poster?: string;
  clip?: string;
  youtubeId?: string;
  summary?: string;
};

export const FILMS: readonly Film[] = [
  {
    id: "i-am-sam",
    title: "I Am Sam",
    year: 2001,
    character: "Lucy Dawson",
    director: "Jessie Nelson",
    poster: "/images/films/i-am-sam.jpg",
    clip: "/videos/i-am-sam.mp4",
    summary:
      "A custody fight over a father with a developmental disability, told through the daughter who outgrows him.",
  },
  {
    id: "babel",
    title: "Babel",
    year: 2006,
    character: "Debbie Jones",
    director: "Alejandro G. Iñárritu",
    poster: "/images/films/babel.jpg",
    clip: "/videos/babel.mp4",
    summary:
      "One rifle shot in the Moroccan desert sets four stories colliding across three continents.",
  },
  {
    id: "benjamin-button",
    title: "The Curious Case of Benjamin Button",
    year: 2008,
    character: "Daisy",
    director: "David Fincher",
    poster: "/images/films/benjamin-button.jpg",
    clip: "/videos/benjamin-button.mp4",
    summary:
      "A man born elderly ages backwards through the century, always out of step with the woman he loves.",
  },
  {
    id: "phoebe-in-wonderland",
    title: "Phoebe in Wonderland",
    year: 2008,
    character: "Phoebe Lichten",
    director: "Daniel Barnz",
    poster: "/images/films/phoebe-in-wonderland.jpg",
    clip: "/videos/phoebe-in-wonderland.mp4",
    summary:
      "A girl who cannot follow the rules finds room to breathe in a school staging of Alice in Wonderland.",
  },
  {
    id: "somewhere",
    title: "Somewhere",
    year: 2010,
    character: "Cleo",
    director: "Sofia Coppola",
    poster: "/images/films/somewhere.jpg",
    clip: "/videos/somewhere.mp4",
    summary:
      "A film star drifting through the Chateau Marmont is pulled back to earth by the daughter he barely knows.",
  },
  {
    id: "super-8",
    title: "Super 8",
    year: 2011,
    character: "Alice Dainard",
    director: "J. J. Abrams",
    poster: "/images/films/super-8.jpg",
    clip: "/videos/super-8.mp4",
    summary:
      "Kids shooting a zombie movie on Super 8 film a train crash — and whatever the wreck sets loose.",
  },
  {
    id: "ginger-and-rosa",
    title: "Ginger & Rosa",
    year: 2012,
    character: "Ginger",
    director: "Sally Potter",
    poster: "/images/films/ginger-and-rosa.jpg",
    clip: "/videos/ginger-and-rosa.mp4",
    summary:
      "Two inseparable girls in 1962 London drift apart under the shadow of the bomb.",
  },
  {
    id: "maleficent",
    title: "Maleficent",
    year: 2014,
    character: "Princess Aurora",
    director: "Robert Stromberg",
    poster: "/images/films/maleficent.jpg",
    clip: "/videos/maleficent.mp4",
    summary:
      "Sleeping Beauty retold from the fairy's side, where the curse answers a betrayal.",
  },
  {
    id: "the-neon-demon",
    title: "The Neon Demon",
    year: 2016,
    character: "Jesse",
    director: "Nicolas Winding Refn",
    poster: "/images/films/the-neon-demon.jpg",
    clip: "/videos/the-neon-demon.mp4",
    summary:
      "An aspiring model arrives in Los Angeles, where beauty is coveted to the point of consumption.",
  },
  {
    id: "20th-century-women",
    title: "20th Century Women",
    year: 2016,
    character: "Julie",
    director: "Mike Mills",
    poster: "/images/films/20th-century-women.jpg",
    clip: "/videos/20th-century-women.mp4",
    summary:
      "Santa Barbara, 1979: a mother enlists two younger women to help raise her teenage son.",
  },
  {
    id: "the-beguiled",
    title: "The Beguiled",
    year: 2017,
    character: "Alicia",
    director: "Sofia Coppola",
    poster: "/images/films/the-beguiled.jpg",
    clip: "/videos/the-beguiled.mp4",
    summary:
      "A wounded Union soldier shelters in a Southern girls' seminary, and the household turns on itself.",
  },
  {
    id: "mary-shelley",
    title: "Mary Shelley",
    year: 2017,
    character: "Mary Shelley",
    director: "Haifaa al-Mansour",
    poster: "/images/films/mary-shelley.jpg",
    clip: "/videos/mary-shelley.mp4",
    summary:
      "The teenage love affair with Percy Shelley that ended in the writing of Frankenstein.",
  },
  {
    id: "teen-spirit",
    title: "Teen Spirit",
    year: 2018,
    character: "Violet Valenski",
    director: "Max Minghella",
    poster: "/images/films/teen-spirit.jpg",
    clip: "/videos/teen-spirit.mp4",
    summary:
      "A shy farm girl on the Isle of Wight chases a singing contest as her way out.",
  },
  {
    id: "the-great",
    title: "The Great",
    year: 2020,
    character: "Catherine the Great",
    director: "Tony McNamara",
    poster: "/images/films/the-great.jpg",
    clip: "/videos/the-great.mp4",
    summary:
      "A young empress arrives in Russia to a brute of a husband and decides to take the throne herself.",
  },
  {
    id: "the-girl-from-plainville",
    title: "The Girl from Plainville",
    year: 2022,
    character: "Michelle Carter",
    director: "Lisa Cholodenko",
    poster: "/images/films/the-girl-from-plainville.jpg",
    clip: "/videos/the-girl-from-plainville.mp4",
    summary:
      "The true case of a teenager charged over the texts that preceded her boyfriend's death.",
  },
  {
    id: "a-complete-unknown",
    title: "A Complete Unknown",
    year: 2024,
    character: "Sylvie Russo",
    director: "James Mangold",
    poster: "/images/films/a-complete-unknown.jpg",
    clip: "/videos/a-complete-unknown.mp4",
    summary:
      "Bob Dylan's arrival in New York and the folk scene he electrified on his way out of it.",
  },
];

export const CURRENT_WORK = {
  title: "Predator: Badlands",
  year: 2025,
  character: "Thia",
  director: "Dan Trachtenberg",
  note: "The newest chapter — and the one still being written.",
} as const;
