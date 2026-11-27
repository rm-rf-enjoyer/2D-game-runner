export const PANEL_TILE_SIZE = 32;

export interface PanelBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface PanelBoundsOptions {
  centerX: number;
  centerY: number;
  widthTiles: number;
  heightTiles: number;
}

export function getPanelBounds(options: PanelBoundsOptions): PanelBounds {
  const width = options.widthTiles * PANEL_TILE_SIZE;
  const height = options.heightTiles * PANEL_TILE_SIZE;

  return {
    left: options.centerX - width / 2,
    top: options.centerY - height / 2,
    width,
    height,
  };
}
