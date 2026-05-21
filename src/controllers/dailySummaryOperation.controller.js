const dailySummaryOperationService = require('../services/dailySummaryOperation.service');
const { ApiError } = require('../middlewares/errorHandler');

const getAllDailySummaryRecords = async (req, res, next) => {
  try {
    const records = await dailySummaryOperationService.findAll({
      start_date: req.query.start_date,
      end_date: req.query.end_date
    });

    return res.status(200).json({
      success: true,
      message: 'Daily summary records fetched successfully',
      data: records
    });
  } catch (error) {
    return next(error);
  }
};

const getDailySummaryRecordByDate = async (req, res, next) => {
  try {
    const record = await dailySummaryOperationService.findByDate(req.params.summary_date);

    if (!record) {
      throw new ApiError(404, 'Daily summary record not found');
    }

    return res.status(200).json({
      success: true,
      message: 'Daily summary record fetched successfully',
      data: record
    });
  } catch (error) {
    return next(error);
  }
};

const getDailyPromoRoiAnalysis = async (req, res, next) => {
  try {
    const records = await dailySummaryOperationService.getDailyPromoRoiAnalysis({
      start_date: req.query.start_date,
      end_date: req.query.end_date
    });

    return res.status(200).json({
      success: true,
      message: 'Daily promo ROI analysis data fetched successfully',
      data: records
    });
  } catch (error) {
    return next(error);
  }
};

const getGgrSummaryReport = async (req, res, next) => {
  try {
    const report = await dailySummaryOperationService.getGgrSummaryReport({
      start_date: req.query.start_date,
      end_date: req.query.end_date
    });

    return res.status(200).json({
      success: true,
      message: 'GGR summary report fetched successfully',
      data: report
    });
  } catch (error) {
    return next(error);
  }
};

const getCumulativeGgrWaterfallReport = async (req, res, next) => {
  try {
    const report = await dailySummaryOperationService.getCumulativeGgrWaterfallReport({
      start_date: req.query.start_date,
      end_date: req.query.end_date
    });

    return res.status(200).json({
      success: true,
      message: 'Cumulative GGR waterfall report fetched successfully',
      data: report
    });
  } catch (error) {
    return next(error);
  }
};

const saveDailySummaryRecord = async (req, res, next) => {
  try {
    await dailySummaryOperationService.save(req.body);

    return res.status(200).json({
      success: true,
      message: 'Daily summary record saved successfully'
    });
  } catch (error) {
    return next(error);
  }
};

const saveBulkDailySummaryRecords = async (req, res, next) => {
  try {
    const savedCount = await dailySummaryOperationService.saveBulk(req.body.records);

    return res.status(200).json({
      success: true,
      message: 'Bulk daily summary records saved successfully',
      inserted_or_updated: savedCount
    });
  } catch (error) {
    return next(error);
  }
};

const getDashboardSummary = async (req, res, next) => {
  try {
    const summary = await dailySummaryOperationService.getDashboardSummary({
      start_date: req.query.start_date,
      end_date: req.query.end_date
    });

    return res.status(200).json({
      success: true,
      message: 'Dashboard summary fetched successfully',
      data: summary
    });
  } catch (error) {
    return next(error);
  }
};

const getPlayerBehaviourLiquidity = async (req, res, next) => {
  try {
    const records = await dailySummaryOperationService.getPlayerBehaviourLiquidity({
      start_date: req.query.start_date,
      end_date: req.query.end_date
    });

    return res.status(200).json({
      success: true,
      message: 'Player behaviour and liquidity data fetched successfully',
      data: records
    });
  } catch (error) {
    return next(error);
  }
};

const getCumulativeMonthlyTrajectory = async (req, res, next) => {
  try {
    const records = await dailySummaryOperationService.getCumulativeMonthlyTrajectory({
      start_date: req.query.start_date,
      end_date: req.query.end_date
    });

    return res.status(200).json({
      success: true,
      message: 'Cumulative monthly trajectory data fetched successfully',
      data: records
    });
  } catch (error) {
    return next(error);
  }
};

const getDashboardData = async (req, res, next) => {
  try {
    const dashboardData = await dailySummaryOperationService.getDashboardData({
      start_date: req.query.start_date,
      end_date: req.query.end_date
    });

    return res.status(200).json({
      success: true,
      message: 'Dashboard data fetched successfully',
      data: dashboardData
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllDailySummaryRecords,
  getDailySummaryRecordByDate,
  getDailyPromoRoiAnalysis,
  getGgrSummaryReport,
  getCumulativeGgrWaterfallReport,
  saveDailySummaryRecord,
  saveBulkDailySummaryRecords,
  getDashboardSummary,
  getPlayerBehaviourLiquidity,
  getCumulativeMonthlyTrajectory,
  getDashboardData
};
