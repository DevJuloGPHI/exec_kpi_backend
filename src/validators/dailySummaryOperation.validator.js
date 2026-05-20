const { body, param, query, validationResult } = require('express-validator');
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

const dateField = (field, location) =>
  location(field)
    .trim()
    .custom((value) => {
      if (!isValidDateOnly(value)) {
        throw new Error(`${field} must be a valid date in YYYY-MM-DD format`);
      }

      return true;
    });

const numericBodyField = (field) =>
  body(field)
    .exists({ checkFalsy: false })
    .withMessage(`${field} is required`)
    .bail()
    .isFloat({ min: 0 })
    .withMessage(`${field} must be numeric and greater than or equal to 0`)
    .toFloat();

const recordValidationRules = [
  dateField('summary_date', body),
  numericBodyField('deposit'),
  numericBodyField('withdrawal'),
  body('registered')
    .exists({ checkFalsy: false })
    .withMessage('registered is required')
    .bail()
    .isInt({ min: 0 })
    .withMessage('registered must be an integer greater than or equal to 0')
    .toInt(),
  numericBodyField('promotion')
];

const validateDateRange = [
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
    .custom(validateDateRangeOrder),
  handleValidation
];

const validateSummaryDateParam = [
  dateField('summary_date', param),
  handleValidation
];

const validateSaveDailySummary = [
  ...recordValidationRules,
  body(['net_deposit', 'ggr']).not().exists().withMessage('net_deposit and ggr are computed fields'),
  handleValidation
];

const validateBulkDailySummary = [
  body('records')
    .isArray({ min: 1 })
    .withMessage('records must be a non-empty array'),
  body('records.*.summary_date')
    .custom((value) => {
      if (!isValidDateOnly(value)) {
        throw new Error('summary_date must be a valid date in YYYY-MM-DD format');
      }

      return true;
    }),
  body('records.*.deposit')
    .exists({ checkFalsy: false })
    .withMessage('deposit is required')
    .bail()
    .isFloat({ min: 0 })
    .withMessage('deposit must be numeric and greater than or equal to 0')
    .toFloat(),
  body('records.*.withdrawal')
    .exists({ checkFalsy: false })
    .withMessage('withdrawal is required')
    .bail()
    .isFloat({ min: 0 })
    .withMessage('withdrawal must be numeric and greater than or equal to 0')
    .toFloat(),
  body('records.*.registered')
    .exists({ checkFalsy: false })
    .withMessage('registered is required')
    .bail()
    .isInt({ min: 0 })
    .withMessage('registered must be an integer greater than or equal to 0')
    .toInt(),
  body('records.*.promotion')
    .exists({ checkFalsy: false })
    .withMessage('promotion is required')
    .bail()
    .isFloat({ min: 0 })
    .withMessage('promotion must be numeric and greater than or equal to 0')
    .toFloat(),
  body('records.*.net_deposit').not().exists().withMessage('net_deposit is a computed field'),
  body('records.*.ggr').not().exists().withMessage('ggr is a computed field'),
  handleValidation
];

module.exports = {
  validateDateRange,
  validateSummaryDateParam,
  validateSaveDailySummary,
  validateBulkDailySummary,
  isValidDateOnly
};
