export type GalleryItem = {
  id: string;
  caption: string;
  meta: string;
  ratio: string;
  src?: string;
  clip?: string;
};

export const BEHIND: readonly GalleryItem[] = [
  { id: "bts-01", caption: "Between takes", meta: "On set", ratio: "4 / 3" },
  { id: "bts-02", caption: "Costume fitting", meta: "Preparation", ratio: "3 / 4" },
  { id: "bts-03", caption: "Rehearsal", meta: "On set", ratio: "16 / 9" },
  { id: "bts-04", caption: "Camera test", meta: "Preparation", ratio: "1 / 1" },
  { id: "bts-05", caption: "Waiting for light", meta: "On location", ratio: "4 / 3" },
  { id: "bts-06", caption: "Last look", meta: "Photo shoot", ratio: "3 / 4" },
];
