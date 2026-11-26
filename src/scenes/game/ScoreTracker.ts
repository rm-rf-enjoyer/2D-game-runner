import { GAMEPLAY_CONFIG } from '../../config/gameConstants.ts';

export interface ScoreLabel {
  text: string;
  setText(text: string): void;
}

export class ScoreTracker {
  private readonly label: ScoreLabel;
  private distance: number = 0;

  constructor(label: ScoreLabel) {
    this.label = label;
  }

  public get text(): string {
    return this.label.text;
  }

  public update(speed: number, delta: number): void {
    const seconds = delta / GAMEPLAY_CONFIG.msPerSecond;
    this.distance += (speed * seconds) / GAMEPLAY_CONFIG.pixelsPerMeter;
    this.render();
  }

  public render(): void {
    this.label.setText(`${Math.floor(this.distance)} m`);
  }
}
