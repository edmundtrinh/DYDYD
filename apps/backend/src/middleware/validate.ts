import { Context, Next } from 'hono';
import { ZodSchema, ZodError } from 'zod';
import { Errors } from './errorHandler';

export const validateBody = (schema: ZodSchema) => {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();
      const parsed = schema.parse(body);
      c.set('validatedBody', parsed);
      await next();
    } catch (err) {
      if (err instanceof ZodError) {
        const formattedErrors: Record<string, string[]> = {};
        err.errors.forEach((e) => {
          const field = e.path.join('.');
          if (!formattedErrors[field]) {
            formattedErrors[field] = [];
          }
          formattedErrors[field].push(e.message);
        });
        throw Errors.validationError(formattedErrors);
      }
      throw err;
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return async (c: Context, next: Next) => {
    try {
      const query = c.req.query();
      const parsed = schema.parse(query);
      c.set('validatedQuery', parsed);
      await next();
    } catch (err) {
      if (err instanceof ZodError) {
        const formattedErrors: Record<string, string[]> = {};
        err.errors.forEach((e) => {
          const field = e.path.join('.');
          if (!formattedErrors[field]) {
            formattedErrors[field] = [];
          }
          formattedErrors[field].push(e.message);
        });
        throw Errors.validationError(formattedErrors);
      }
      throw err;
    }
  };
};
