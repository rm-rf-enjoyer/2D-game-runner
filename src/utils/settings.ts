const SETTINGS_KEY = 'runGame:settings';

interface Settings {
  muted: boolean;
}

const DEFAULT_SETTINGS: Settings = { muted: false };

export function getSoundMuted(): boolean {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS.muted;

    const parsed = JSON.parse(raw) as Partial<Settings>;
    return typeof parsed.muted === 'boolean' ? parsed.muted : DEFAULT_SETTINGS.muted;
  } catch {
    return DEFAULT_SETTINGS.muted;
  }
}

export function setSoundMuted(muted: boolean): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ muted }));
  } catch {
    return;
  }
}

export function toggleSoundMuted(muted: boolean): boolean {
  const nextMuted = !muted;
  setSoundMuted(nextMuted);
  return nextMuted;
}
