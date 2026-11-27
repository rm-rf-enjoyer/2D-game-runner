import Phaser from 'phaser';
import { MenuPanel } from './MenuPanel.ts';
import { createMenuButton } from './buttonFactory.ts';
import { createPanelTitle } from './panelTitleFactory.ts';
import { RECORDS_CONFIG, getRecordsPanelBounds } from '../config/recordsConfig.ts';
import { PANEL_TITLE_CONFIG } from '../config/panelTitleConfig.ts';
import { PanelBounds } from '../config/panelConfig.ts';
import { getTopResults, GameResult } from '../utils/results.ts';

const SCORE_SPACE_PATTERN = /\s+/g;

interface Rows {
  names: string[];
  scores: string[];
}

export class RecordsPanel {
  private readonly scene: Phaser.Scene;
  private readonly bounds: PanelBounds;

  private readonly container: Phaser.GameObjects.Container;
  private readonly panel: MenuPanel;
  private readonly title: Phaser.GameObjects.BitmapText;
  private readonly text: Phaser.GameObjects.BitmapText;
  private readonly scores: Phaser.GameObjects.BitmapText;

  constructor(scene: Phaser.Scene, onBack: () => void) {
    this.scene = scene;
    this.bounds = getRecordsPanelBounds();
    this.container = this.scene.add.container(0, 0).setDepth(RECORDS_CONFIG.depth);

    this.panel = this._createPanel();
    this.title = this._createTitle();

    const rows = this._buildRows();
    this.text = this._createNames(rows);
    this.scores = this._createScores(rows);

    this._assemble();
    this._createBackButton(onBack);
  }

  public destroy(): void {
    this.container.destroy(true);
  }

  private _createPanel(): MenuPanel {
    const { panel, centerX, centerY } = RECORDS_CONFIG;

    return new MenuPanel({
      scene: this.scene,
      centerX,
      centerY,
      widthTiles: panel.widthTiles,
      heightTiles: panel.heightTiles,
    });
  }

  private _createTitle(): Phaser.GameObjects.BitmapText {
    const { title, centerX } = RECORDS_CONFIG;

    return createPanelTitle({
      scene: this.scene,
      centerX,
      panelTop: this.bounds.top,
      text: title,
    });
  }

  private _buildRows(): Rows {
    const results = getTopResults(RECORDS_CONFIG.rows.maxRows);

    if (!results.length) {
      return { names: ['no records'], scores: [''] };
    }

    return {
      names: results.map((result, index) => this._formatName(result, index + 1)),
      scores: results.map((result) => this._formatScore(result)),
    };
  }

  private _createNames(rows: Rows): Phaser.GameObjects.BitmapText {
    return this._createText(rows.names, this._getNamesX(), 0);
  }

  private _createScores(rows: Rows): Phaser.GameObjects.BitmapText {
    return this._createText(rows.scores, this._getScoresX(), 1);
  }

  private _createText(lines: string[], x: number, originX: number): Phaser.GameObjects.BitmapText {
    const { font, fontSize, color } = PANEL_TITLE_CONFIG;

    return this.scene.add
      .bitmapText(x, this._getTextY(), font, lines.join('\n'), fontSize)
      .setOrigin(originX, 0)
      .setTint(color)
      .setLineSpacing(RECORDS_CONFIG.rows.lineSpacing);
  }

  private _createBackButton(onBack: () => void): void {
    const { backButton, centerX } = RECORDS_CONFIG;
    const back = createMenuButton({
      scene: this.scene,
      x: centerX,
      y: this.bounds.top + this.bounds.height - backButton.bottomPadding,
      text: backButton.text,
      width: backButton.width,
      onClick: onBack,
    });

    this.container.add([back.button.container, back.label]);
  }

  private _assemble(): void {
    this.container.add([this.panel.getContainer(), this.title, this.text, this.scores]);
  }

  private _getTextY(): number {
    const { padding, topOffset } = RECORDS_CONFIG.rows;
    return this.bounds.top + padding + topOffset;
  }

  private _getNamesX(): number {
    return this.bounds.left + RECORDS_CONFIG.rows.padding;
  }

  private _getScoresX(): number {
    const { padding, scoreOffsetChars } = RECORDS_CONFIG.rows;
    return (
      this.bounds.left +
      this.bounds.width -
      padding -
      PANEL_TITLE_CONFIG.fontSize * scoreOffsetChars
    );
  }

  private _formatName(result: GameResult, rank: number): string {
    const name = result.name.toLowerCase().slice(0, RECORDS_CONFIG.rows.maxNameLength);
    return `${rank}.${name}`;
  }

  private _formatScore(result: GameResult): string {
    return result.score.toLowerCase().replace(SCORE_SPACE_PATTERN, '');
  }
}
