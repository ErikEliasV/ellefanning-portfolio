export const BLOCKS_A = 67;
export const BLOCKS_B = 40;

const NARROW_MAX = 1023;

const NARROW_CELLS = 34;

const MIN_COLS = 12;

export function gridCols(width: number, height: number) {
  if (width > NARROW_MAX) return BLOCKS_A;
  const cell = Math.min(width, height) / NARROW_CELLS;
  if (!cell) return BLOCKS_A;
  return Math.max(Math.round(width / cell), MIN_COLS);
}

export function coarseCols(cols: number) {
  return Math.max((cols * BLOCKS_B) / BLOCKS_A, 1);
}
