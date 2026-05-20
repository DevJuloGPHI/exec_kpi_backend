const express = require('express');
const dailySummaryOperationController = require('../controllers/dailySummaryOperation.controller');
const {
  validateBulkDailySummary,
  validateDateRange,
  validateSaveDailySummary,
  validateSummaryDateParam
} = require('../validators/dailySummaryOperation.validator');

const router = express.Router();

router.get(
  '/',
  validateDateRange,
  dailySummaryOperationController.getAllDailySummaryRecords
);

router.get(
  '/dashboard/summary',
  validateDateRange,
  dailySummaryOperationController.getDashboardSummary
);

router.get(
  '/:summary_date',
  validateSummaryDateParam,
  dailySummaryOperationController.getDailySummaryRecordByDate
);

router.post(
  '/',
  validateSaveDailySummary,
  dailySummaryOperationController.saveDailySummaryRecord
);

router.post(
  '/bulk',
  validateBulkDailySummary,
  dailySummaryOperationController.saveBulkDailySummaryRecords
);

module.exports = router;
