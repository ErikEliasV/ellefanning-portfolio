export type EditorialShot = {
  id: string;
  title: string;
  kicker: string;
  year: string;
  src: string;
  width: number;
  height: number;
  note?: string;
};

export const EDITORIAL_NOTE =
  "Magazine work, campaigns and red carpets. Scroll runs the reel; click a frame to open it full screen.";

export const EDITORIAL_SHOTS: readonly EditorialShot[] = [
  {
    id: "vogue-2014",
    title: "Vogue",
    kicker: "Magazine",
    year: "2014",
    src: "/images/editorial/vogue-2014.jpg",
    width: 1159,
    height: 1542,
  },
  {
    id: "vogue-2017",
    title: "Vogue",
    kicker: "Magazine",
    year: "2017",
    src: "/images/editorial/vogue-2017.webp",
    width: 877,
    height: 1200,
  },
  {
    id: "vanity-fair-2020",
    title: "Vanity Fair",
    kicker: "Magazine",
    year: "2020",
    src: "/images/editorial/vanity-fair-2020.webp",
    width: 1471,
    height: 2000,
  },
  {
    id: "icon-magazine-2020",
    title: "Icon",
    kicker: "Magazine",
    year: "2020",
    src: "/images/editorial/icon-magazine-2020.jpg",
    width: 1024,
    height: 1331,
  },
  {
    id: "vogue-met-gala-2023",
    title: "Vogue",
    kicker: "Met Gala",
    year: "2023",
    src: "/images/editorial/vogue-met-gala-2023.webp",
    width: 1600,
    height: 2400,
  },
  {
    id: "w-magazine-cannes-2023",
    title: "W",
    kicker: "Cannes",
    year: "2023",
    src: "/images/editorial/w-magazine-cannes-2023.avif",
    width: 1800,
    height: 2629,
  },
  {
    id: "harpers-bazaar-coach-2025",
    title: "Harper's Bazaar",
    kicker: "Coach",
    year: "2025",
    src: "/images/editorial/harpers-bazaar-coach-2025.avif",
    width: 1080,
    height: 1080,
  },
  {
    id: "vogue-oscars-2025",
    title: "Vogue",
    kicker: "Oscars",
    year: "2025",
    src: "/images/editorial/vogue-oscars-2025.webp",
    width: 2560,
    height: 3839,
  },
  {
    id: "vogue-2026",
    title: "Vogue",
    kicker: "Magazine",
    year: "2026",
    src: "/images/editorial/vogue-2026.jpg",
    width: 1080,
    height: 1350,
  },
  {
    id: "harpers-bazaar",
    title: "Harper's Bazaar",
    kicker: "Magazine",
    year: "2023",
    src: "/images/editorial/harpers-bazaar.avif",
    width: 980,
    height: 1322,
  },
];
