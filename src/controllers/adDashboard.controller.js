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

const getKpiCards = async (req, res, next) => {
  try {
    const data = await adDashboardService.getKpiCards(req.query);
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

const getThirdPartyAds = async (req, res, next) => {
  try {
    const data = await adDashboardService.getThirdPartyAds(req.query);
    return sendSuccess(res, 'Data fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getSelfRunAds = async (req, res, next) => {
  try {
    const data = await adDashboardService.getSelfRunAds(req.query);
    return sendSuccess(res, 'Data fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getGeneralTotalAds = async (req, res, next) => {
  try {
    const data = await adDashboardService.getGeneralTotalAds(req.query);
    return sendSuccess(res, 'Data fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getVendorCollaboration = async (req, res, next) => {
  try {
    const data = await adDashboardService.getVendorCollaboration();
    return sendSuccess(res, 'Data fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getFinancialExposure = async (req, res, next) => {
  try {
    const data = await adDashboardService.getFinancialExposure();
    return sendSuccess(res, 'Data fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getMediaPipeline = async (req, res, next) => {
  try {
    const data = await adDashboardService.getMediaPipeline();
    return sendSuccess(res, 'Data fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getMediaProfessional = async (req, res, next) => {
  try {
    const data = await adDashboardService.getMediaProfessional();
    return sendSuccess(res, 'Data fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getMediaTimeline = async (req, res, next) => {
  try {
    const data = await adDashboardService.getMediaTimeline(req.query);
    return sendSuccess(res, 'Data fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getExecutiveTimeline = getMediaTimeline;

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
  getKpiCards,
  getDailyPerformance,
  getSelfRunAds,
  getThirdPartyAds,
  getGeneralTotalAds,
  getVendorCollaboration,
  getFinancialExposure,
  getMediaPipeline,
  getMediaProfessional,
  getMediaTimeline,
  getExecutiveTimeline,
  getTotals,
  getSelfRunTotals,
  getThirdPartyTotals,
  getGeneralTotals,
  createImportBatch,
  upsertDailyPerformance
};
