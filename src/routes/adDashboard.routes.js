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
  '/self-run-ads',
  validateDateRange,
  adDashboardController.getSelfRunAds
);

router.get(
  '/third-party-ads',
  validateDateRange,
  adDashboardController.getThirdPartyAds
);

router.get(
  '/general-total-ads',
  validateDateRange,
  adDashboardController.getGeneralTotalAds
);

router.get(
  '/vendor_collaboration',
  adDashboardController.getVendorCollaboration
);

router.get(
  '/financial-exposure',
  adDashboardController.getFinancialExposure
);

router.get(
  '/media-pipeline',
  adDashboardController.getMediaPipeline
);

router.get(
  '/media_professional',
  adDashboardController.getMediaProfessional
);

router.get(
  '/media-timeline',
  validateDateRange,
  adDashboardController.getMediaTimeline
);

router.get(
  '/executive-timeline',
  validateDateRange,
  adDashboardController.getExecutiveTimeline
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
