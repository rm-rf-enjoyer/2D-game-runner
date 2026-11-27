import Phaser from 'phaser';
import { PANEL_TITLE_CONFIG } from '../config/panelTitleConfig.ts';
import { PALETTE } from '../config/palette.ts';
import { RECORDS_CONFIG, getRecordsPanelBounds } from '../config/recordsConfig.ts';
import type { PanelBounds } from '../config/panelConfig.ts';
import { MenuPanel } from './MenuPanel.ts';
import { createMenuButton, type MenuButtonReturn } from './buttonFactory.ts';
import { createPanelTitle } from './panelTitleFactory.ts';
import { getRecordsService } from '../services/records/recordsService.ts';
import type { RecordsMode } from '../services/records/types.ts';

const SCORE_SPACE_PATTERN = /\s+/g;
const ACTIVE_TINT = PALETTE.green;
const INACTIVE_TINT = PALETTE.white;

interface Rows {
  names: string[];
  scores: string[];
}

interface ScoreRow {
  name: string;
  scoreMeters: number;
}

interface ModeButtons {
  device: MenuButtonReturn;
  global: MenuButtonReturn;
}

export class RecordsPanel {
  private readonly scene: Phaser.Scene;
  private readonly bounds: PanelBounds;
  private readonly service = getRecordsService();
  private readonly container: Phaser.GameObjects.Container;
  private readonly panel: MenuPanel;
  private readonly title: Phaser.GameObjects.BitmapText;
  private readonly text: Phaser.GameObjects.BitmapText;
  private readonly scores: Phaser.GameObjects.BitmapText;
  private readonly modeButtons: ModeButtons;
  private readonly backButton: MenuButtonReturn;

  private mode: RecordsMode = 'local';
  private requestId = 0;
  private destroyed = false;

  constructor(scene: Phaser.Scene, onBack: () => void) {
    this.scene = scene;
    this.bounds = getRecordsPanelBounds();
    this.container = this.scene.add.container(0, 0).setDepth(RECORDS_CONFIG.depth);

    this.panel = this._createPanel();
    this.title = this._createTitle();

    const rows = this._buildRows(this._getLocalRows());
    this.text = this._createNames(rows);
    this.scores = this._createScores(rows);

    this.modeButtons = this._createModeButtons();
    this.backButton = this._createBackButton(onBack);
    this._assemble();
    this._refreshTitles();
    this._renderRows(rows);
  }

  public destroy(): void {
    this.destroyed = true;
    this.requestId += 1;
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

  private _createModeButtons(): ModeButtons {
    const { buttons } = RECORDS_CONFIG;
    const common = {
      scene: this.scene,
      y: this._getButtonY(),
      width: buttons.width,
    };

    const device = createMenuButton({
      ...common,
      x: this._getButtonX(0),
      text: buttons.device.text,
      onClick: () => void this._setMode('local'),
    });
    const global = createMenuButton({
      ...common,
      x: this._getButtonX(1),
      text: buttons.global.text,
      onClick: () => void this._setMode('global'),
    });

    return { device, global };
  }

  private _createBackButton(onBack: () => void): MenuButtonReturn {
    const { buttons } = RECORDS_CONFIG;

    return createMenuButton({
      scene: this.scene,
      x: this._getButtonX(2),
      y: this._getButtonY(),
      text: buttons.back.text,
      width: buttons.width,
      onClick: onBack,
    });
  }

  private _getButtonX(index: number): number {
    const { buttons, centerX } = RECORDS_CONFIG;
    const totalWidth = buttons.width * 3 + buttons.gap * 2;
    return centerX - totalWidth / 2 + buttons.width / 2 + index * (buttons.width + buttons.gap);
  }

  private _getButtonY(): number {
    return this.bounds.top + this.bounds.height - RECORDS_CONFIG.buttons.bottomPadding;
  }

  private async _setMode(mode: RecordsMode): Promise<void> {
    if (this.destroyed || this.mode === mode) return;

    this.mode = mode;
    this._renderTints();

    if (mode === 'local') {
      this.requestId += 1;
      this._refreshTitles();
      this._renderRows(this._buildRows(this._getLocalRows()));
      return;
    }

    const request = ++this.requestId;
    this.title.setText('loading');
    this._renderRows(this._buildRows([]));

    const snapshot = await this.service.getGlobalLeaderboard(RECORDS_CONFIG.rows.maxRows);
    if (this.destroyed || request !== this.requestId) return;

    this.title.setText(snapshot.stale ? 'offline' : 'global');
    this._renderRows(this._buildRows(snapshot.records));
  }

  private _refreshTitles(): void {
    this.title.setText(this.mode === 'global' ? 'global' : RECORDS_CONFIG.title);
  }

  private _renderTints(): void {
    this.modeButtons.device.label.setTint(this.mode === 'local' ? ACTIVE_TINT : INACTIVE_TINT);
    this.modeButtons.global.label.setTint(this.mode === 'global' ? ACTIVE_TINT : INACTIVE_TINT);
  }

  private _getLocalRows(): ScoreRow[] {
    return this.service.getLocalLeaderboard(RECORDS_CONFIG.rows.maxRows);
  }

  private _buildRows(rows: ScoreRow[]): Rows {
    if (!rows.length) {
      return { names: ['no records'], scores: [''] };
    }

    return {
      names: rows.map((row, index) => this._formatName(row, index + 1)),
      scores: rows.map((row) => this._formatScore(row)),
    };
  }

  private _renderRows(rows: Rows): void {
    this.text.setText(rows.names.join('\n'));
    this.scores.setText(rows.scores.join('\n'));
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

  private _assemble(): void {
    this.container.add([
      this.panel.getContainer(),
      this.title,
      this.text,
      this.scores,
      this.modeButtons.device.button.container,
      this.modeButtons.device.label,
      this.modeButtons.global.button.container,
      this.modeButtons.global.label,
      this.backButton.button.container,
      this.backButton.label,
    ]);
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

  private _formatName(row: ScoreRow, rank: number): string {
    const name = row.name.toLowerCase().slice(0, RECORDS_CONFIG.rows.maxNameLength);
    return `${rank}.${name}`;
  }

  private _formatScore(row: ScoreRow): string {
    return `${row.scoreMeters}m`.replace(SCORE_SPACE_PATTERN, '');
  }
}
