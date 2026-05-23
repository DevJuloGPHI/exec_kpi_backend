const customerServiceDashboardService = require('../services/customerServiceDashboard.service');

const sendSuccess = (res, message, data) =>
  res.status(200).json({
    success: true,
    message,
    data
  });

const getDashboardData = async (req, res, next) => {
  try {
    const data = await customerServiceDashboardService.getDashboardData(req.query);
    return sendSuccess(res, 'Customer service dashboard data fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const data = await customerServiceDashboardService.getSummary(req.query);
    return sendSuccess(res, 'Customer service summary fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const data = await customerServiceDashboardService.getCategories();
    return sendSuccess(res, 'Customer service categories fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getShifts = async (req, res, next) => {
  try {
    const data = await customerServiceDashboardService.getShifts();
    return sendSuccess(res, 'Customer service shifts fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getTimeSlots = async (req, res, next) => {
  try {
    const data = await customerServiceDashboardService.getTimeSlots();
    return sendSuccess(res, 'Customer service time slots fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getDailyVolume = async (req, res, next) => {
  try {
    const data = await customerServiceDashboardService.getDailyVolume(req.query);
    return sendSuccess(res, 'Customer service daily volume fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getHourlyVolume = async (req, res, next) => {
  try {
    const data = await customerServiceDashboardService.getHourlyVolume(req.query);
    return sendSuccess(res, 'Customer service hourly volume fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getCategoryBreakdown = async (req, res, next) => {
  try {
    const data = await customerServiceDashboardService.getCategoryBreakdown(req.query);
    return sendSuccess(res, 'Customer service category breakdown fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getShiftBreakdown = async (req, res, next) => {
  try {
    const data = await customerServiceDashboardService.getShiftBreakdown(req.query);
    return sendSuccess(res, 'Customer service shift breakdown fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getShiftCategoryVolume = async (req, res, next) => {
  try {
    const data = await customerServiceDashboardService.getShiftCategoryVolume(req.query);
    return sendSuccess(res, 'Customer service shift category volume fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getShiftCategoryMatrix = async (req, res, next) => {
  try {
    const data = await customerServiceDashboardService.getShiftCategoryMatrix(req.query);
    return sendSuccess(res, 'Customer service shift category matrix fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getMonthlyCategorySummary = async (req, res, next) => {
  try {
    const data = await customerServiceDashboardService.getMonthlyCategorySummary(req.query);
    return sendSuccess(res, 'Customer service monthly category summary fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getImportBatches = async (req, res, next) => {
  try {
    const data = await customerServiceDashboardService.getImportBatches(req.query);
    return sendSuccess(res, 'Customer service import batches fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getDashboardData,
  getSummary,
  getCategories,
  getShifts,
  getTimeSlots,
  getDailyVolume,
  getHourlyVolume,
  getCategoryBreakdown,
  getShiftBreakdown,
  getShiftCategoryVolume,
  getShiftCategoryMatrix,
  getMonthlyCategorySummary,
  getImportBatches
};
