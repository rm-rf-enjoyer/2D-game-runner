import paletteSource from '../assets/bg/palette.gpl?raw';

const PALETTE_COLOR_PATTERN = /^\s*(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\s/;

export const PALETTE_COLORS: number[] = paletteSource
  .split('\n')
  .map(line => line.match(PALETTE_COLOR_PATTERN))
  .filter((match): match is RegExpMatchArray => match !== null)
  .map(match => {
    const red = Number(match[1]);
    const green = Number(match[2]);
    const blue = Number(match[3]);
    return (red << 16) | (green << 8) | blue;
  });

export function getPaletteColor(index: number): number {
  return PALETTE_COLORS[index] ?? 0xffffff;
}
