const express = require('express');
const customerServiceDashboardController = require('../controllers/customerServiceDashboard.controller');
const {
  validateDashboardFilters,
  validateDateRange,
  validateImportBatchFilters
} = require('../validators/customerServiceDashboard.validator');

const router = express.Router();

router.get(
  '/',
  validateDashboardFilters,
  customerServiceDashboardController.getDashboardData
);

router.get(
  '/summary',
  validateDashboardFilters,
  customerServiceDashboardController.getSummary
);

router.get(
  '/categories',
  customerServiceDashboardController.getCategories
);

router.get(
  '/shifts',
  customerServiceDashboardController.getShifts
);

router.get(
  '/time-slots',
  customerServiceDashboardController.getTimeSlots
);

router.get(
  '/daily-volume',
  validateDateRange,
  customerServiceDashboardController.getDailyVolume
);

router.get(
  '/hourly-volume',
  validateDateRange,
  customerServiceDashboardController.getHourlyVolume
);

router.get(
  '/category-breakdown',
  validateDateRange,
  customerServiceDashboardController.getCategoryBreakdown
);

router.get(
  '/shift-breakdown',
  validateDashboardFilters,
  customerServiceDashboardController.getShiftBreakdown
);

router.get(
  '/shift-category-volume',
  validateDashboardFilters,
  customerServiceDashboardController.getShiftCategoryVolume
);

router.get(
  '/shift-category-matrix',
  validateDateRange,
  customerServiceDashboardController.getShiftCategoryMatrix
);

router.get(
  '/monthly-category-summary',
  validateDateRange,
  customerServiceDashboardController.getMonthlyCategorySummary
);

router.get(
  '/import-batches',
  validateImportBatchFilters,
  customerServiceDashboardController.getImportBatches
);

module.exports = router;
