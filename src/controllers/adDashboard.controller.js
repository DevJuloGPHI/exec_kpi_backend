const adDashboardService = require('../services/adDashboard.service');

const sendSuccess = (res, message, data, statusCode = 200) =>
  res.status(statusCode).json({
    success: true,
    message,
    data
  });

const getChannels = async (req, res, next) => {
  try {
    const data = await adDashboardService.getChannels();
    return sendSuccess(res, 'Data fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getDailyPerformance = async (req, res, next) => {
  try {
    const data = await adDashboardService.getDailyPerformance(req.query);
    return sendSuccess(res, 'Data fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getTotals = async (req, res, next) => {
  try {
    const data = await adDashboardService.getGroupTotals(req.query);
    return sendSuccess(res, 'Data fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getSelfRunTotals = async (req, res, next) => {
  try {
    const data = await adDashboardService.getGroupTotals(
      req.query,
      adDashboardService.GROUP_CODES.SELF_RUN
    );
    return sendSuccess(res, 'Data fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getThirdPartyTotals = async (req, res, next) => {
  try {
    const data = await adDashboardService.getGroupTotals(
      req.query,
      adDashboardService.GROUP_CODES.THIRD_PARTY
    );
    return sendSuccess(res, 'Data fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getGeneralTotals = async (req, res, next) => {
  try {
    const data = await adDashboardService.getGeneralTotals(req.query);
    return sendSuccess(res, 'Data fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const createImportBatch = async (req, res, next) => {
  try {
    const data = await adDashboardService.createImportBatch(req.body);
    return sendSuccess(res, 'Import batch created successfully', data, 201);
  } catch (error) {
    return next(error);
  }
};

const upsertDailyPerformance = async (req, res, next) => {
  try {
    const data = await adDashboardService.upsertDailyPerformance(req.body);
    return sendSuccess(res, 'Daily performance saved successfully', data);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getChannels,
  getDailyPerformance,
  getTotals,
  getSelfRunTotals,
  getThirdPartyTotals,
  getGeneralTotals,
  createImportBatch,
  upsertDailyPerformance
};
