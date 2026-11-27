import { ASSET_KEYS } from './assetKeys.ts';
import { getPaletteColor } from './palette.ts';

export const PANEL_TITLE_CONFIG = {
  font: ASSET_KEYS.texture.fontLower,
  fontSize: 14,
  color: getPaletteColor(14),
  topOffset: 10,
  originX: 0.5,
  originY: 0,
} as const;
