import { BadRequestError } from '../common/errors.js';

export const validate = (schemas = {}) => (req, res, next) => {
  try {
    if (schemas.body) {
      const parsed = schemas.body.parse(req.body);
      req.body = parsed;
    }
    if (schemas.query) {
      const parsed = schemas.query.parse(req.query);
      req.query = parsed;
    }
    if (schemas.params) {
      const parsed = schemas.params.parse(req.params);
      req.params = parsed;
    }
    next();
  } catch (error) {
    if (error.name === 'ZodError') {
      const details = error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message
      }));
      return next(new BadRequestError('Validation error', details));
    }
    next(error);
  }
};
