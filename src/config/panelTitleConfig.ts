import { ASSET_KEYS } from './assetKeys.ts';
import { PALETTE } from './palette.ts';

export const PANEL_TITLE_CONFIG = {
  font: ASSET_KEYS.texture.fontLower,
  fontSize: 14,
  color: PALETTE.white,
  topOffset: 10,
  originX: 0.5,
  originY: 0,
} as const;
