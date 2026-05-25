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
  '/agent-kpi-cards',
  validateKpiFilters,
  kolDashboardController.getAgentKpiCards
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
  '/daily-performance-trend-chart',
  validateKpiFilters,
  kolDashboardController.getDailyPerformanceTrendChart
);

router.get(
  '/top-performing-kol',
  validateKpiFilters,
  kolDashboardController.getTopPerformingKol
);

router.get(
  '/category-performance',
  validateKpiFilters,
  kolDashboardController.getCategoryPerformance
);

router.get(
  '/content-analysis',
  validateKpiFilters,
  kolDashboardController.getContentAnalysis
);

router.get(
  '/cost-efficiency-panel',
  validateKpiFilters,
  kolDashboardController.getCostEfficiencyPanel
);

router.get(
  '/underperforming-kol-watchlist',
  validateKpiFilters,
  kolDashboardController.getUnderperformingKolWatchlist
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
