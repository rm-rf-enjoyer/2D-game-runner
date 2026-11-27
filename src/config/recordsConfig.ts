import { GAME_HEIGHT, GAME_WIDTH } from './gameConstants.ts';
import { getPanelBounds, PanelBounds } from './panelConfig.ts';
import { SAVE_DIALOG_CONFIG } from './saveDialogConfig.ts';

export const RECORDS_CONFIG = {
  depth: 5,
  centerX: GAME_WIDTH / 2,
  centerY: GAME_HEIGHT / 2,
  panel: {
    widthTiles: 14,
    heightTiles: 8,
  },
  title: 'records',
  rows: {
    lineSpacing: 2,
    padding: 8,
    topOffset: 32,
    scoreOffsetChars: 2,
    maxRows: 10,
    maxNameLength: SAVE_DIALOG_CONFIG.field.maxLength,
  },
  backButton: {
    text: 'BACK',
    width: 96,
    bottomPadding: 24,
  },
} as const;

export function getRecordsPanelBounds(): PanelBounds {
  const { centerX, centerY, panel } = RECORDS_CONFIG;

  return getPanelBounds({
    centerX,
    centerY,
    widthTiles: panel.widthTiles,
    heightTiles: panel.heightTiles,
  });
}
