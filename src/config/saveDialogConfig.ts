import { GAME_HEIGHT, GAME_WIDTH } from './gameConstants.ts';
import { getPanelBounds, PanelBounds } from './panelConfig.ts';
import { getPaletteColor } from './palette.ts';

export const SAVE_DIALOG_CONFIG = {
  depth: 300,
  centerX: GAME_WIDTH / 2,
  centerY: GAME_HEIGHT / 2,
  panel: {
    widthTiles: 8,
    heightTiles: 3,
  },
  field: {
    x: 5,
    y: 10,
    width: 246,
    height: 14,
    maxLength: 16,
    color: getPaletteColor(10),
    textColor: getPaletteColor(14),
    fontSize: 14,
    caretWidth: 14,
    caretHeight: 2,
    caretBlinkDelay: 500,
  },
  button: {
    width: 96,
    padding: 16,
    labelColor: getPaletteColor(14),
  },
} as const;

export function getSaveDialogPanelBounds(): PanelBounds {
  const { centerX, centerY, panel } = SAVE_DIALOG_CONFIG;

  return getPanelBounds({
    centerX,
    centerY,
    widthTiles: panel.widthTiles,
    heightTiles: panel.heightTiles,
  });
}
