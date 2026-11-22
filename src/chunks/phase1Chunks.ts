import { ChunkDefinition, ChunkTemplate } from './ChunkTemplate';

export const PHASE1_JUMP_CHUNK: ChunkDefinition = ChunkTemplate.create({
  id: 'phase1-jump',
  widthTiles: 15,
  heightTiles: 16,
  entryYTiles: 0,
  exitYTiles: 0,
  attachSide: 'right',
  platforms: [
    { xTiles: 0, yTiles: 0, widthTiles: 11 },
  ],
  obstacles: [],
});
