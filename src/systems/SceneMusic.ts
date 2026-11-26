export interface LoopSound {
  stop(): void;
  play(): unknown;
}

export interface SceneSoundManager {
  stopByKey(key: string): void;
  get(key: string): LoopSound | null;
  add(key: string, config: { loop: boolean; volume: number }): LoopSound;
}

export interface SceneMusicConfig {
  key: string;
  volume: number;
  stopKeys: readonly string[];
}

export class SceneMusic {
  private readonly config: SceneMusicConfig;
  private sound: LoopSound | null = null;

  constructor(config: SceneMusicConfig) {
    this.config = config;
  }

  public start(manager: SceneSoundManager): void {
    this.config.stopKeys.forEach((key) => manager.stopByKey(key));

    const sound =
      manager.get(this.config.key) ??
      manager.add(this.config.key, { loop: true, volume: this.config.volume });

    sound.stop();
    sound.play();
    this.sound = sound;
  }

  public stop(): void {
    this.sound?.stop();
    this.sound = null;
  }
}
