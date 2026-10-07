export type EditorialFrame = {
  src: string;
  width: number;
  height: number;
};

export type EditorialShot = {
  id: string;
  title: string;
  kicker: string;
  year: string;
  src: string;
  width: number;
  height: number;
  note?: string;
  gallery?: readonly EditorialFrame[];
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
    gallery: [
      { src: "/images/editorial/vogue-2014/01.webp", width: 984, height: 763 },
      { src: "/images/editorial/vogue-2014/02.webp", width: 604, height: 804 },
    ],
  },
  {
    id: "vogue-2017",
    title: "Vogue",
    kicker: "Magazine",
    year: "2017",
    src: "/images/editorial/vogue-2017.webp",
    width: 877,
    height: 1200,
    gallery: [
      { src: "/images/editorial/vogue-2017/01.webp", width: 1600, height: 1095 },
      { src: "/images/editorial/vogue-2017/02.webp", width: 1200, height: 630 },
      { src: "/images/editorial/vogue-2017/03.webp", width: 1024, height: 693 },
    ],
  },
  {
    id: "vanity-fair-2020",
    title: "Vanity Fair",
    kicker: "Magazine",
    year: "2020",
    src: "/images/editorial/vanity-fair-2020.webp",
    width: 1471,
    height: 2000,
    gallery: [
      { src: "/images/editorial/vanity-fair-2020/01.webp", width: 1200, height: 1800 },
      { src: "/images/editorial/vanity-fair-2020/02.webp", width: 1200, height: 1800 },
      { src: "/images/editorial/vanity-fair-2020/03.webp", width: 1600, height: 1066 },
    ],
  },
  {
    id: "icon-magazine-2020",
    title: "Icon",
    kicker: "Magazine",
    year: "2020",
    src: "/images/editorial/icon-magazine-2020.jpg",
    width: 1024,
    height: 1331,
    gallery: [
      { src: "/images/editorial/icon-magazine-2020/01.webp", width: 1024, height: 1331 },
      { src: "/images/editorial/icon-magazine-2020/02.webp", width: 800, height: 1018 },
      { src: "/images/editorial/icon-magazine-2020/03.webp", width: 800, height: 1000 },
      { src: "/images/editorial/icon-magazine-2020/04.webp", width: 800, height: 1000 },
    ],
  },
  {
    id: "vogue-met-gala-2023",
    title: "Vogue",
    kicker: "Met Gala",
    year: "2023",
    src: "/images/editorial/vogue-met-gala-2023.webp",
    width: 1600,
    height: 2400,
    gallery: [
      { src: "/images/editorial/vogue-met-gala-2023/01.webp", width: 1350, height: 1800 },
      { src: "/images/editorial/vogue-met-gala-2023/02.webp", width: 1200, height: 1800 },
    ],
  },
  {
    id: "w-magazine-cannes-2023",
    title: "W",
    kicker: "Cannes",
    year: "2023",
    src: "/images/editorial/w-magazine-cannes-2023.avif",
    width: 1800,
    height: 2629,
    gallery: [
      { src: "/images/editorial/w-magazine-cannes-2023/01.webp", width: 1232, height: 1800 },
      { src: "/images/editorial/w-magazine-cannes-2023/02.webp", width: 828, height: 1246 },
      { src: "/images/editorial/w-magazine-cannes-2023/03.webp", width: 750, height: 1125 },
      { src: "/images/editorial/w-magazine-cannes-2023/04.webp", width: 640, height: 706 },
    ],
  },
  {
    id: "harpers-bazaar-coach-2025",
    title: "Harper's Bazaar",
    kicker: "Coach",
    year: "2025",
    src: "/images/editorial/harpers-bazaar-coach-2025.avif",
    width: 1080,
    height: 1080,
    gallery: [
      { src: "/images/editorial/harpers-bazaar-coach-2025/01.webp", width: 768, height: 960 },
      { src: "/images/editorial/harpers-bazaar-coach-2025/02.webp", width: 768, height: 523 },
    ],
  },
  {
    id: "vogue-oscars-2025",
    title: "Vogue",
    kicker: "Oscars",
    year: "2025",
    src: "/images/editorial/vogue-oscars-2025.webp",
    width: 2560,
    height: 3839,
    gallery: [
      { src: "/images/editorial/vogue-oscars-2025/01.webp", width: 1200, height: 1800 },
    ],
  },
  {
    id: "vogue-2026",
    title: "Vogue",
    kicker: "Magazine",
    year: "2026",
    src: "/images/editorial/vogue-2026.jpg",
    width: 1080,
    height: 1350,
    gallery: [
      { src: "/images/editorial/vogue-2026/01.webp", width: 1440, height: 1800 },
      { src: "/images/editorial/vogue-2026/02.webp", width: 1440, height: 1800 },
      { src: "/images/editorial/vogue-2026/03.webp", width: 1440, height: 1799 },
      { src: "/images/editorial/vogue-2026/04.webp", width: 1439, height: 1799 },
      { src: "/images/editorial/vogue-2026/05.webp", width: 1439, height: 1799 },
    ],
  },
  {
    id: "harpers-bazaar",
    title: "Harper's Bazaar",
    kicker: "Magazine",
    year: "2023",
    src: "/images/editorial/harpers-bazaar.avif",
    width: 980,
    height: 1322,
    gallery: [
      { src: "/images/editorial/harpers-bazaar/01.webp", width: 1600, height: 1066 },
      { src: "/images/editorial/harpers-bazaar/02.webp", width: 1600, height: 902 },
      { src: "/images/editorial/harpers-bazaar/03.webp", width: 980, height: 1303 },
      { src: "/images/editorial/harpers-bazaar/04.webp", width: 980, height: 1299 },
    ],
  },
];
