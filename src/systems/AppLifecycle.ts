import { EVENT_KEYS } from '../config/eventKeys.ts';

export type PauseReason = 'visibility' | 'focus' | 'native';

export interface PausableEngine {
  events: { emit(event: string): void };
  loop: { sleep(): void; wake(): void };
  sound: { pauseAll(): void; resumeAll(): void };
}

export interface LifecycleScheduler {
  setTimeout(callback: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}

const PAUSE_EVENT = EVENT_KEYS.appPaused;
const SUSPEND_DELAY_MS = 50;

const defaultScheduler: LifecycleScheduler = {
  setTimeout: (callback, ms) => globalThis.setTimeout(callback, ms),
  clearTimeout: (handle) => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export class AppLifecycle {
  private readonly reasons = new Set<PauseReason>();
  private readonly engine: PausableEngine;
  private readonly scheduler: LifecycleScheduler;
  private suspendTimer: unknown = null;

  constructor(engine: PausableEngine, scheduler: LifecycleScheduler = defaultScheduler) {
    this.engine = engine;
    this.scheduler = scheduler;
  }

  public pause(reason: PauseReason): void {
    const wasPaused = this.reasons.size > 0;
    this.reasons.add(reason);
    if (wasPaused) return;

    this.engine.events.emit(PAUSE_EVENT);
    this.suspendTimer = this.scheduler.setTimeout(() => {
      this.suspendTimer = null;
      if (this.reasons.size === 0) return;

      this.engine.loop.sleep();
      this.engine.sound.pauseAll();
    }, SUSPEND_DELAY_MS);
  }

  public resume(reason: PauseReason): void {
    if (!this.reasons.delete(reason)) return;
    if (this.reasons.size > 0) return;

    if (this.suspendTimer !== null) {
      this.scheduler.clearTimeout(this.suspendTimer);
      this.suspendTimer = null;
    }

    this.engine.loop.wake();
    this.engine.sound.resumeAll();
  }
}
