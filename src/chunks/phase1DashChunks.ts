import { ChunkDefinition, ChunkTemplate } from './ChunkTemplate';

// TODO: design jump+dash chunk layout
export const PHASE1_JUMP_DASH_CHUNK: ChunkDefinition = ChunkTemplate.create({
  id: 'phase1-jump-dash',
  widthTiles: 18,
  heightTiles: 16,
  entryYTiles: 0,
  exitYTiles: 0,
  attachSide: 'right',
  platforms: [
    { xTiles: 0, yTiles: 0, widthTiles: 14 },
  ],
  obstacles: [],
});
