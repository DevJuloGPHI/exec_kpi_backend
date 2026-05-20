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

module.exports = {
  getAllDailySummaryRecords,
  getDailySummaryRecordByDate,
  saveDailySummaryRecord,
  saveBulkDailySummaryRecords,
  getDashboardSummary
};
