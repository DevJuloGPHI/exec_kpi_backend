const { query, validationResult } = require('express-validator');
const { ApiError } = require('../middlewares/errorHandler');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const isValidDateOnly = (value) => {
  if (typeof value !== 'string' || !DATE_REGEX.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const validateDateRangeOrder = (value, { req }) => {
  if (!req.query.start_date || !req.query.end_date) {
    return true;
  }

  if (!isValidDateOnly(req.query.start_date) || !isValidDateOnly(req.query.end_date)) {
    return true;
  }

  if (req.query.start_date > req.query.end_date) {
    throw new Error('start_date must not be greater than end_date');
  }

  return true;
};

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      new ApiError(
        422,
        'Validation error',
        errors.array().map((error) => ({
          field: error.path,
          message: error.msg
        }))
      )
    );
  }

  return next();
};

const dateRangeRules = () => [
  query('start_date')
    .optional()
    .trim()
    .custom((value) => {
      if (!isValidDateOnly(value)) {
        throw new Error('start_date must be a valid date in YYYY-MM-DD format');
      }

      return true;
    }),
  query('end_date')
    .optional()
    .trim()
    .custom((value) => {
      if (!isValidDateOnly(value)) {
        throw new Error('end_date must be a valid date in YYYY-MM-DD format');
      }

      return true;
    })
    .custom(validateDateRangeOrder)
];

const validateDateRange = [
  ...dateRangeRules(),
  handleValidation
];

const validateDashboardFilters = [
  ...dateRangeRules(),
  query('category_id')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('category_id must be an integer from 1 to 10')
    .toInt(),
  query('shift_id')
    .optional()
    .isInt({ min: 1, max: 3 })
    .withMessage('shift_id must be an integer from 1 to 3')
    .toInt(),
  handleValidation
];

const validateImportBatchFilters = [
  query('status')
    .optional()
    .isIn(['PENDING', 'COMPLETED', 'FAILED'])
    .withMessage('status must be one of PENDING, COMPLETED, FAILED'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be an integer from 1 to 100')
    .toInt(),
  handleValidation
];

module.exports = {
  validateDateRange,
  validateDashboardFilters,
  validateImportBatchFilters
};
