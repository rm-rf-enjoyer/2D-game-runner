import { z } from 'zod';

export const nameSchema = z
  .string()
  .trim()
  .min(1)
  .max(16)
  .regex(/^[A-Za-z0-9 _-]+$/);

export const clientRecordSchema = z.object({
  id: z.string().uuid(),
  name: nameSchema,
  scoreMeters: z.number().int().min(0).max(1_000_000_000),
  savedAt: z.string().datetime(),
});

export const batchRecordsSchema = z.object({
  records: z.array(clientRecordSchema).min(1).max(100),
});

export const topQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type ClientRecordInput = z.infer<typeof clientRecordSchema>;
export type TopQueryInput = z.infer<typeof topQuerySchema>;
