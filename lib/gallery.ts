export type GalleryItem = {
  id: string;
  caption: string;
  meta: string;
  ratio: string;
  src?: string;
  clip?: string;
};

export const EDITORIAL: readonly GalleryItem[] = [
  { id: "ed-01", caption: "Cannes", meta: "Festival · 2017", ratio: "3 / 4" },
  { id: "ed-02", caption: "Vogue", meta: "Editorial · 2019", ratio: "4 / 5" },
  { id: "ed-03", caption: "Met Gala", meta: "Red carpet · 2021", ratio: "2 / 3" },
  { id: "ed-04", caption: "Studio", meta: "Portrait · 2022", ratio: "1 / 1" },
  { id: "ed-05", caption: "Campaign", meta: "Fashion · 2023", ratio: "3 / 4" },
  { id: "ed-06", caption: "Cover", meta: "Magazine · 2024", ratio: "4 / 5" },
  { id: "ed-07", caption: "Premiere", meta: "Red carpet · 2024", ratio: "2 / 3" },
];

export const BEHIND: readonly GalleryItem[] = [
  { id: "bts-01", caption: "Between takes", meta: "On set", ratio: "4 / 3" },
  { id: "bts-02", caption: "Costume fitting", meta: "Preparation", ratio: "3 / 4" },
  { id: "bts-03", caption: "Rehearsal", meta: "On set", ratio: "16 / 9" },
  { id: "bts-04", caption: "Camera test", meta: "Preparation", ratio: "1 / 1" },
  { id: "bts-05", caption: "Waiting for light", meta: "On location", ratio: "4 / 3" },
  { id: "bts-06", caption: "Last look", meta: "Photo shoot", ratio: "3 / 4" },
];
