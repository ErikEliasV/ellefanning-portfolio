export type Character = {
  id: string;
  name: string;
  film: string;
  year: number;
  note: string;
  story: string;
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
    story:
      "Sofia Coppola gives her almost no dialogue and asks her to carry the film anyway. Cleo trails her father through the Chateau Marmont, cooks him eggs benedict, skates figures in an empty rink, and never once says out loud that he is disappearing. The whole performance lives in what she notices and decides not to mention.",
    still: "/images/characters/cleo-somewhere.jpg",
  },
  {
    id: "alice",
    name: "Alice Dainard",
    film: "Super 8",
    year: 2011,
    note: "The girl who steals the film the moment she starts acting inside it.",
    story:
      "The film is about a monster, a train wreck and a group of boys with a camera. The scene everyone remembers is a rehearsal on a station platform, where Alice steps into their bad amateur movie and quietly turns it into acting. The boys stop breathing. So does the audience.",
    still: "/images/characters/alice-super8.webp",
  },
  {
    id: "ginger",
    name: "Ginger",
    film: "Ginger & Rosa",
    year: 2012,
    note: "A teenager holding the bomb of the world and her own house at once.",
    story:
      "London, 1962, with the missile crisis closing in. Ginger writes poems about nuclear annihilation partly because it is easier than writing about her best friend and her father. Sally Potter keeps the camera close, and Fanning holds an English accent and a slow collapse in the same shot.",
    still: "/images/characters/ginger-ginger-rosa.jpg",
  },
  {
    id: "aurora",
    name: "Princess Aurora",
    film: "Maleficent",
    year: 2014,
    note: "The fairy tale played straight, with no wink to the camera.",
    story:
      "The part is a trap: a princess best known for sleeping through her own story, in a film that belongs to the woman who cursed her. Fanning plays her with no irony at all, and that straightness is exactly what lets the ending land as grief instead of camp.",
    still: "/images/characters/princess-aurora-maleficent.jpg",
  },
  {
    id: "jesse",
    name: "Jesse",
    film: "The Neon Demon",
    year: 2016,
    note: "Innocence sharpened into a weapon, then swallowed whole.",
    story:
      "A sixteen-year-old arrives in Los Angeles to model and the city sets about consuming her. Refn frames her as an object before he frames her as a person, and Fanning plays the precise moment innocence works out that it is worth something — and starts spending it.",
    still: "/images/characters/jesse-the-neon-demon.avif",
  },
  {
    id: "alicia",
    name: "Alicia",
    film: "The Beguiled",
    year: 2017,
    note: "Boredom turning slowly, deliberately, into appetite.",
    story:
      "The oldest girl in a Virginia seminary in the middle of the Civil War, watching a wounded Union soldier and doing arithmetic. Fanning gives boredom a temperature. Almost nothing she does is innocent, and almost nothing she does is explicit, which is the whole trick of the film.",
    still: "/images/characters/alicia-the-beguiled.jpg",
  },
  {
    id: "violet",
    name: "Violet Valenski",
    film: "Teen Spirit",
    year: 2018,
    note: "A voice used as an escape route.",
    story:
      "A Polish girl on the Isle of Wight singing her way off a farm and onto a talent show stage. Fanning sang it herself, which matters: the film's argument is that the voice is simultaneously the way out and the next cage, and you can hear her decide to take it anyway.",
    still: "/images/characters/violet-valenski-teen-spirit.avif",
  },
  {
    id: "catherine",
    name: "Catherine the Great",
    film: "The Great",
    year: 2020,
    note: "An empress built out of comedy, rage and absolute nerve.",
    story:
      "Tony McNamara's court runs on insult comedy delivered at a scream, and Fanning plays a young empress who is idealistic, monstrous, ridiculous and entirely serious about the enlightenment — frequently inside a single sentence. Three seasons of holding a tone almost nobody else could hold.",
    still: "/images/characters/catherine-the-great.jpg",
  },
];
