const express = require('express');
const adDashboardController = require('../controllers/adDashboard.controller');
const {
  validateCreateImportBatch,
  validateDateRange,
  validateUpsertDailyPerformance
} = require('../validators/adDashboard.validator');

const router = express.Router();

router.get(
  '/channels',
  adDashboardController.getChannels
);

router.get(
  '/kpi-cards',
  validateDateRange,
  adDashboardController.getKpiCards
);

router.get(
  '/daily',
  validateDateRange,
  adDashboardController.getDailyPerformance
);

router.get(
  '/totals',
  validateDateRange,
  adDashboardController.getTotals
);

router.get(
  '/totals/self-run',
  validateDateRange,
  adDashboardController.getSelfRunTotals
);

router.get(
  '/totals/third-party',
  validateDateRange,
  adDashboardController.getThirdPartyTotals
);

router.get(
  '/totals/general',
  validateDateRange,
  adDashboardController.getGeneralTotals
);

router.post(
  '/import-batches',
  validateCreateImportBatch,
  adDashboardController.createImportBatch
);

router.post(
  '/daily',
  validateUpsertDailyPerformance,
  adDashboardController.upsertDailyPerformance
);

module.exports = router;
