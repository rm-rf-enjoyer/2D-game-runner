export class InvalidRecordsError extends Error {
  public readonly statusCode = 400;
  public readonly code = 'INVALID_RECORDS';
  public readonly details: unknown;

  constructor(details: unknown) {
    super('Invalid records payload');
    this.name = 'InvalidRecordsError';
    this.details = details;
  }
}

export class BatchTooLargeError extends Error {
  public readonly statusCode = 413;
  public readonly code = 'BATCH_TOO_LARGE';
  public readonly limit: number;

  constructor(limit: number) {
    super(`Batch exceeds the limit of ${limit} records`);
    this.name = 'BatchTooLargeError';
    this.limit = limit;
  }
}
