export interface IngestResult {
  acceptedIds: string[];
  duplicates: string[];
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  scoreMeters: number;
  savedAt: string;
}
