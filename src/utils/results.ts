const RESULTS_KEY = 'runGame:results';

export interface GameResult {
  name: string;
  score: string;
  savedAt: string;
}

function isGameResult(item: unknown): item is GameResult {
  if (typeof item !== 'object' || item === null) return false;

  const result = item as Partial<GameResult>;
  return (
    typeof result.name === 'string' &&
    typeof result.score === 'string' &&
    typeof result.savedAt === 'string'
  );
}

export function getResults(): GameResult[] {
  try {
    const raw = localStorage.getItem(RESULTS_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isGameResult);
  } catch {
    return [];
  }
}

export function saveResult(name: string, score: string): void {
  try {
    const results = getResults();
    results.push({ name, score, savedAt: new Date().toISOString() });
    localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
  } catch {
    return;
  }
}

function getScoreValue(score: string): number {
  const value = Number.parseFloat(score);
  return Number.isFinite(value) ? value : 0;
}

export function getTopResults(limit: number): GameResult[] {
  if (limit <= 0) return [];

  return getResults()
    .sort(
      (a, b) =>
        getScoreValue(b.score) - getScoreValue(a.score) || a.savedAt.localeCompare(b.savedAt)
    )
    .slice(0, limit);
}
