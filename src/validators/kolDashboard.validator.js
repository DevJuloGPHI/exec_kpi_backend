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

const nonNegativeNumberQuery = (field) =>
  query(field)
    .optional()
    .isFloat({ min: 0 })
    .withMessage(`${field} must be numeric and greater than or equal to 0`)
    .toFloat();

const DAILY_PERFORMANCE_SORT_FIELDS = [
  'date',
  'cost',
  'registrations',
  'first_deposits',
  'cost_per_registration',
  'cost_per_first_deposit',
  'conversion'
];

const validateKpiFilters = [
  ...dateRangeRules(),
  query('content_category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('content_category_id must be a positive integer')
    .toInt(),
  query('agent_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('agent_id must be a positive integer')
    .toInt(),
  nonNegativeNumberQuery('cost_per_registration_target'),
  nonNegativeNumberQuery('cost_per_first_deposit_target'),
  nonNegativeNumberQuery('conversion_quality_threshold'),
  nonNegativeNumberQuery('quality_threshold'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be a positive integer')
    .toInt(),
  query('per_page')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('per_page must be an integer from 1 to 100')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be an integer from 1 to 100')
    .toInt(),
  query('sort_by')
    .optional()
    .customSanitizer((value) => String(value).toLowerCase())
    .isIn(DAILY_PERFORMANCE_SORT_FIELDS)
    .withMessage(`sort_by must be one of ${DAILY_PERFORMANCE_SORT_FIELDS.join(', ')}`),
  query('sort_direction')
    .optional()
    .customSanitizer((value) => String(value).toLowerCase())
    .isIn(['asc', 'desc'])
    .withMessage('sort_direction must be one of asc, desc'),
  handleValidation
];

module.exports = {
  validateKpiFilters
};
