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
