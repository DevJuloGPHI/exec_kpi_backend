const express = require('express');
const kolDashboardController = require('../controllers/kolDashboard.controller');
const { validateKpiFilters } = require('../validators/kolDashboard.validator');

const router = express.Router();

router.get(
  '/',
  validateKpiFilters,
  kolDashboardController.getDashboardData
);

router.get(
  '/summary',
  validateKpiFilters,
  kolDashboardController.getSummary
);

router.get(
  '/kpi-cards',
  validateKpiFilters,
  kolDashboardController.getKpiCards
);

router.get(
  '/spend-acquisition-volume',
  validateKpiFilters,
  kolDashboardController.getSpendAcquisitionVolume
);

router.get(
  '/conversion-rate-tracking',
  validateKpiFilters,
  kolDashboardController.getConversionRateTracking
);

router.get(
  '/kol-daily-performance',
  validateKpiFilters,
  kolDashboardController.getKolDailyPerformance
);

router.get(
  '/acquisition-unit-costs',
  validateKpiFilters,
  kolDashboardController.getAcquisitionUnitCosts
);

module.exports = router;
