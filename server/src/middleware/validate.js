import { AppError } from './errorHandler.js';

/**
 * Validates req.body (or custom source) with Zod schema.
 */
export function validateBody(schema, source = (req) => req.body) {
  return (req, res, next) => {
    const parsed = schema.safeParse(source(req));
    if (!parsed.success) {
      const err = new AppError(400, 'Validation failed');
      err.details = parsed.error.flatten();
      return next(err);
    }
    req.validated = req.validated || {};
    req.validated.body = parsed.data;
    next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      const err = new AppError(400, 'Validation failed');
      err.details = parsed.error.flatten();
      return next(err);
    }
    req.validated = req.validated || {};
    req.validated.query = parsed.data;
    next();
  };
}

export function validateParams(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.params);
    if (!parsed.success) {
      const err = new AppError(400, 'Validation failed');
      err.details = parsed.error.flatten();
      return next(err);
    }
    req.validated = req.validated || {};
    req.validated.params = parsed.data;
    next();
  };
}
