import type { FastifyError, FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { BatchTooLargeError, InvalidRecordsError } from '../modules/records/errors.ts';

function isFastifyError(error: unknown): error is FastifyError {
  return error instanceof Error && ('statusCode' in error || 'code' in error);
}

export function setErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof InvalidRecordsError) {
      return reply.code(error.statusCode).send({
        error: { code: error.code, message: error.message, details: error.details },
      });
    }

    if (error instanceof BatchTooLargeError) {
      return reply.code(error.statusCode).send({
        error: { code: error.code, message: error.message, limit: error.limit },
      });
    }

    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: {
          code: 'INVALID_QUERY',
          message: 'Invalid query parameters',
          details: error.issues,
        },
      });
    }

    const statusCode = isFastifyError(error) ? (error.statusCode ?? 500) : 500;

    if (statusCode >= 500) {
      app.log.error(error);
      return reply.code(statusCode).send({
        error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      });
    }

    return reply.code(statusCode).send({
      error: {
        code: isFastifyError(error) ? (error.code ?? 'BAD_REQUEST') : 'BAD_REQUEST',
        message: error instanceof Error ? error.message : 'Bad request',
      },
    });
  });
}
