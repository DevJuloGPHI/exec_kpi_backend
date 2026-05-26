const { body, query } = require('express-validator');
const validate = require('../middlewares/validate.middleware');

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

const dateQueryRules = [
  query('start_date')
    .optional({ checkFalsy: true })
    .trim()
    .custom((value) => {
      if (!isValidDateOnly(value)) {
        throw new Error('start_date must be a valid date in YYYY-MM-DD format');
      }

      return true;
    }),
  query('end_date')
    .optional({ checkFalsy: true })
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
  ...dateQueryRules,
  validate
];

const validateCreateImportBatch = [
  body('file_name')
    .exists({ checkFalsy: true })
    .withMessage('file_name is required')
    .bail()
    .isString()
    .withMessage('file_name must be a string')
    .trim()
    .isLength({ max: 255 })
    .withMessage('file_name must not exceed 255 characters'),
  body('report_type')
    .exists({ checkFalsy: true })
    .withMessage('report_type is required')
    .bail()
    .isString()
    .withMessage('report_type must be a string')
    .trim()
    .equals('daily_ad_performance')
    .withMessage('report_type must be daily_ad_performance'),
  body('imported_by')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage('imported_by must be a string')
    .trim()
    .isLength({ max: 100 })
    .withMessage('imported_by must not exceed 100 characters'),
  body('remarks')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage('remarks must be a string')
    .trim()
    .isLength({ max: 1000 })
    .withMessage('remarks must not exceed 1000 characters'),
  validate
];

const validateUpsertDailyPerformance = [
  body('import_batch_id')
    .exists({ checkFalsy: true })
    .withMessage('import_batch_id is required')
    .bail()
    .isInt({ min: 1 })
    .withMessage('import_batch_id must be a positive integer')
    .toInt(),
  body('channel_id')
    .exists({ checkFalsy: true })
    .withMessage('channel_id is required')
    .bail()
    .isInt({ min: 1 })
    .withMessage('channel_id must be a positive integer')
    .toInt(),
  body('report_date')
    .exists({ checkFalsy: true })
    .withMessage('report_date is required')
    .bail()
    .trim()
    .custom((value) => {
      if (!isValidDateOnly(value)) {
        throw new Error('report_date must be a valid date in YYYY-MM-DD format');
      }

      return true;
    }),
  body('spend')
    .exists({ checkFalsy: false })
    .withMessage('spend is required')
    .bail()
    .isFloat({ min: 0 })
    .withMessage('spend must be zero or greater')
    .toFloat(),
  body('registrations')
    .exists({ checkFalsy: false })
    .withMessage('registrations is required')
    .bail()
    .isInt({ min: 0 })
    .withMessage('registrations must be zero or greater')
    .toInt(),
  body('first_deposits')
    .exists({ checkFalsy: false })
    .withMessage('first_deposits is required')
    .bail()
    .isInt({ min: 0 })
    .withMessage('first_deposits must be zero or greater')
    .toInt(),
  validate
];

module.exports = {
  validateDateRange,
  validateCreateImportBatch,
  validateUpsertDailyPerformance,
  isValidDateOnly
};
