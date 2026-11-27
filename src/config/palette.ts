import paletteSource from '../assets/palette/palette.gpl?raw';

const PALETTE_COLOR_PATTERN = /^\s*(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\s/;

export const PALETTE_COLORS: number[] = paletteSource
  .split('\n')
  .map((line: string): RegExpMatchArray | null => line.match(PALETTE_COLOR_PATTERN))
  .filter((match): match is RegExpMatchArray => match !== null)
  .map((match: RegExpMatchArray): number => {
    const red = Number(match[1]);
    const green = Number(match[2]);
    const blue = Number(match[3]);
    return (red << 16) | (green << 8) | blue;
  });

export function getPaletteColor(index: number): number {
  const color = PALETTE_COLORS[index];
  if (color === undefined) {
    throw new Error(`Palette color index ${index} is out of range`);
  }
  return color;
}

export const PALETTE = {
  night: getPaletteColor(0),
  shadow: getPaletteColor(1),
  navy: getPaletteColor(2),
  steel: getPaletteColor(3),
  plum: getPaletteColor(4),
  magenta: getPaletteColor(5),
  red: getPaletteColor(6),
  violet: getPaletteColor(7),
  green: getPaletteColor(8),
  dustyRose: getPaletteColor(9),
  sand: getPaletteColor(10),
  orange: getPaletteColor(11),
  cyan: getPaletteColor(12),
  yellow: getPaletteColor(13),
  white: getPaletteColor(14),
  teal: getPaletteColor(15),
} as const;
