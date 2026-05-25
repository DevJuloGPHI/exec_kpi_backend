const kolDashboardService = require('../services/kolDashboard.service');

const sendSuccess = (res, message, data) =>
  res.status(200).json({
    success: true,
    message,
    data
  });

const getDashboardData = async (req, res, next) => {
  try {
    const data = await kolDashboardService.getDashboardData(req.query);
    return sendSuccess(res, 'KOL dashboard data fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const data = await kolDashboardService.getSummary(req.query);
    return sendSuccess(res, 'KOL dashboard summary fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getKpiCards = async (req, res, next) => {
  try {
    const data = await kolDashboardService.getKpiCards(req.query);
    return sendSuccess(res, 'KOL KPI cards fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getSpendAcquisitionVolume = async (req, res, next) => {
  try {
    const data = await kolDashboardService.getSpendAcquisitionVolume(req.query);
    return sendSuccess(res, 'KOL spend acquisition volume fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getConversionRateTracking = async (req, res, next) => {
  try {
    const data = await kolDashboardService.getConversionRateTracking(req.query);
    return sendSuccess(res, 'KOL conversion rate tracking fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getDailyPerformanceTrendChart = async (req, res, next) => {
  try {
    const data = await kolDashboardService.getDailyPerformanceTrendChart(req.query);
    return sendSuccess(res, 'Daily Performance Trend Chart fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getTopPerformingKol = async (req, res, next) => {
  try {
    const data = await kolDashboardService.getTopPerformingKol(req.query);
    return sendSuccess(res, 'Top Performing KOL fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getCategoryPerformance = async (req, res, next) => {
  try {
    const data = await kolDashboardService.getCategoryPerformance(req.query);
    return sendSuccess(res, 'KOL category performance fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getCostEfficiencyPanel = async (req, res, next) => {
  try {
    const data = await kolDashboardService.getCostEfficiencyPanel(req.query);
    return sendSuccess(res, 'KOL cost efficiency panel fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getUnderperformingKolWatchlist = async (req, res, next) => {
  try {
    const data = await kolDashboardService.getUnderperformingKolWatchlist(req.query);
    return sendSuccess(res, 'Underperforming KOL watchlist fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getKolDailyPerformance = async (req, res, next) => {
  try {
    const data = await kolDashboardService.getKolDailyPerformance(req.query);
    return sendSuccess(res, 'KOL daily performance fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getAcquisitionUnitCosts = async (req, res, next) => {
  try {
    const data = await kolDashboardService.getAcquisitionUnitCosts(req.query);
    return sendSuccess(res, 'KOL acquisition unit costs fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getDashboardData,
  getSummary,
  getKpiCards,
  getSpendAcquisitionVolume,
  getConversionRateTracking,
  getDailyPerformanceTrendChart,
  getTopPerformingKol,
  getCategoryPerformance,
  getCostEfficiencyPanel,
  getUnderperformingKolWatchlist,
  getKolDailyPerformance,
  getAcquisitionUnitCosts
};
