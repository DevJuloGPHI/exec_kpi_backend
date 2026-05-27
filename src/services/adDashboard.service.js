const pool = require('../config/db');
const { ApiError } = require('../middlewares/errorHandler');

const GROUP_CODES = {
  SELF_RUN: 'SELF_RUN',
  THIRD_PARTY: 'THIRD_PARTY'
};

const GROUP_LABELS = {
  [GROUP_CODES.SELF_RUN]: 'Self-run Ads Total',
  [GROUP_CODES.THIRD_PARTY]: 'Third Party Ads Total'
};

const toNumber = (value) => Number(value || 0);

const mapDailyPerformanceRow = (row) => ({
  id: Number(row.id),
  report_date: row.report_date,
  group_code: row.group_code,
  group_name: row.group_name,
  channel_name: row.channel_name,
  spend: toNumber(row.spend),
  registrations: Number(row.registrations || 0),
  first_deposits: Number(row.first_deposits || 0),
  registration_cost: toNumber(row.registration_cost),
  first_deposit_cost: toNumber(row.first_deposit_cost),
  registration_to_deposit_rate_percent: toNumber(row.registration_to_deposit_rate_percent)
});

const mapTotalRow = (row) => ({
  report_date: row.report_date,
  row_label: row.row_label,
  group_code: row.group_code,
  group_name: row.group_name,
  total_cost: toNumber(row.total_cost),
  total_registrations: Number(row.total_registrations || 0),
  total_first_deposits: Number(row.total_first_deposits || 0),
  registration_cost: toNumber(row.registration_cost),
  first_deposit_cost: toNumber(row.first_deposit_cost),
  registration_to_deposit_rate_percent: toNumber(row.registration_to_deposit_rate_percent)
});

const buildDateRangeWhere = (filters = {}, dateColumn = 'dp.report_date', baseConditions = [], baseParams = []) => {
  const conditions = [...baseConditions];
  const params = [...baseParams];

  if (filters.start_date) {
    conditions.push(`${dateColumn} >= ?`);
    params.push(filters.start_date);
  }

  if (filters.end_date) {
    conditions.push(`${dateColumn} <= ?`);
    params.push(filters.end_date);
  }

  return {
    whereClause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    params
  };
};

const getChannels = async () => {
  const [rows] = await pool.execute(
    `
      SELECT
        c.id,
        c.channel_name,
        c.channel_code,
        cg.group_code,
        cg.group_name,
        c.is_active
      FROM ad_channels c
      INNER JOIN ad_channel_groups cg
        ON c.channel_group_id = cg.id
      ORDER BY
        FIELD(cg.group_code, 'SELF_RUN', 'THIRD_PARTY'),
        c.channel_name ASC,
        c.id ASC
    `
  );

  return rows.map((row) => ({
    id: Number(row.id),
    channel_name: row.channel_name,
    channel_code: row.channel_code,
    group_code: row.group_code,
    group_name: row.group_name,
    is_active: Boolean(row.is_active)
  }));
};

const getKpiCards = async (filters = {}) => {
  const { whereClause, params } = buildDateRangeWhere(filters);
  const [rows] = await pool.execute(
    `
      SELECT
        COALESCE(SUM(dp.spend), 0) AS total_spend,
        COALESCE(SUM(dp.registrations), 0) AS total_registrations,
        COALESCE(SUM(dp.first_deposits), 0) AS total_deposits,
        COUNT(DISTINCT dp.channel_id) AS total_number_of_channel
      FROM ad_daily_performance dp
      ${whereClause}
    `,
    params
  );

  const row = rows[0] || {};

  return {
    total_spend: toNumber(row.total_spend),
    total_registrations: Number(row.total_registrations || 0),
    total_deposits: Number(row.total_deposits || 0),
    total_number_of_channel: Number(row.total_number_of_channel || 0)
  };
};

const getDailyPerformance = async (filters = {}) => {
  const { whereClause, params } = buildDateRangeWhere(filters);
  const [rows] = await pool.execute(
    `
      SELECT
        dp.id,
        dp.report_date,
        cg.group_code,
        cg.group_name,
        c.channel_name,
        dp.spend,
        dp.registrations,
        dp.first_deposits,
        ROUND(
          CASE
            WHEN dp.registrations = 0 THEN 0
            ELSE dp.spend / dp.registrations
          END,
          2
        ) AS registration_cost,
        ROUND(
          CASE
            WHEN dp.first_deposits = 0 THEN 0
            ELSE dp.spend / dp.first_deposits
          END,
          2
        ) AS first_deposit_cost,
        ROUND(
          CASE
            WHEN dp.registrations = 0 THEN 0
            ELSE dp.first_deposits / dp.registrations * 100
          END,
          2
        ) AS registration_to_deposit_rate_percent
      FROM ad_daily_performance dp
      INNER JOIN ad_channels c
        ON dp.channel_id = c.id
      INNER JOIN ad_channel_groups cg
        ON c.channel_group_id = cg.id
      ${whereClause}
      ORDER BY
        dp.report_date DESC,
        FIELD(cg.group_code, 'SELF_RUN', 'THIRD_PARTY'),
        c.channel_name ASC
    `,
    params
  );

  return rows.map(mapDailyPerformanceRow);
};

const getGroupTotals = async (filters = {}, groupCode = undefined) => {
  const baseConditions = groupCode
    ? ['cg.group_code = ?']
    : ["cg.group_code IN ('SELF_RUN', 'THIRD_PARTY')"];
  const baseParams = groupCode ? [groupCode] : [];
  const { whereClause, params } = buildDateRangeWhere(
    filters,
    'dp.report_date',
    baseConditions,
    baseParams
  );

  const [rows] = await pool.execute(
    `
      SELECT
        dp.report_date,
        CASE
          WHEN cg.group_code = 'SELF_RUN' THEN 'Self-run Ads Total'
          WHEN cg.group_code = 'THIRD_PARTY' THEN 'Third Party Ads Total'
        END AS row_label,
        cg.group_code,
        cg.group_name,
        SUM(dp.spend) AS total_cost,
        SUM(dp.registrations) AS total_registrations,
        SUM(dp.first_deposits) AS total_first_deposits,
        ROUND(
          CASE
            WHEN SUM(dp.registrations) = 0 THEN 0
            ELSE SUM(dp.spend) / SUM(dp.registrations)
          END,
          2
        ) AS registration_cost,
        ROUND(
          CASE
            WHEN SUM(dp.first_deposits) = 0 THEN 0
            ELSE SUM(dp.spend) / SUM(dp.first_deposits)
          END,
          2
        ) AS first_deposit_cost,
        ROUND(
          CASE
            WHEN SUM(dp.registrations) = 0 THEN 0
            ELSE SUM(dp.first_deposits) / SUM(dp.registrations) * 100
          END,
          2
        ) AS registration_to_deposit_rate_percent
      FROM ad_daily_performance dp
      INNER JOIN ad_channels c
        ON dp.channel_id = c.id
      INNER JOIN ad_channel_groups cg
        ON c.channel_group_id = cg.id
      ${whereClause}
      GROUP BY
        dp.report_date,
        cg.group_code,
        cg.group_name
      ORDER BY
        dp.report_date DESC,
        FIELD(cg.group_code, 'SELF_RUN', 'THIRD_PARTY')
    `,
    params
  );

  return rows.map(mapTotalRow);
};

const getGeneralTotals = async (filters = {}) => {
  const { whereClause, params } = buildDateRangeWhere(filters);
  const [rows] = await pool.execute(
    `
      SELECT
        dp.report_date,
        'General Total Ads' AS row_label,
        'GENERAL' AS group_code,
        'All Advertising Channels' AS group_name,
        SUM(dp.spend) AS total_cost,
        SUM(dp.registrations) AS total_registrations,
        SUM(dp.first_deposits) AS total_first_deposits,
        ROUND(
          CASE
            WHEN SUM(dp.registrations) = 0 THEN 0
            ELSE SUM(dp.spend) / SUM(dp.registrations)
          END,
          2
        ) AS registration_cost,
        ROUND(
          CASE
            WHEN SUM(dp.first_deposits) = 0 THEN 0
            ELSE SUM(dp.spend) / SUM(dp.first_deposits)
          END,
          2
        ) AS first_deposit_cost,
        ROUND(
          CASE
            WHEN SUM(dp.registrations) = 0 THEN 0
            ELSE SUM(dp.first_deposits) / SUM(dp.registrations) * 100
          END,
          2
        ) AS registration_to_deposit_rate_percent
      FROM ad_daily_performance dp
      ${whereClause}
      GROUP BY dp.report_date
      ORDER BY dp.report_date DESC
    `,
    params
  );

  return rows.map(mapTotalRow);
};

const createImportBatch = async (payload) => {
  const [result] = await pool.execute(
    `
      INSERT INTO ad_import_batches
        (file_name, report_type, imported_by, remarks)
      VALUES
        (?, ?, ?, ?)
    `,
    [
      payload.file_name,
      payload.report_type,
      payload.imported_by || null,
      payload.remarks || null
    ]
  );

  return {
    id: Number(result.insertId),
    file_name: payload.file_name,
    report_type: payload.report_type,
    imported_by: payload.imported_by || null,
    remarks: payload.remarks || null
  };
};

const findSavedDailyPerformance = async (connection, reportDate, channelId) => {
  const [rows] = await connection.execute(
    `
      SELECT
        dp.id,
        dp.report_date,
        cg.group_code,
        cg.group_name,
        c.channel_name,
        dp.spend,
        dp.registrations,
        dp.first_deposits,
        ROUND(
          CASE
            WHEN dp.registrations = 0 THEN 0
            ELSE dp.spend / dp.registrations
          END,
          2
        ) AS registration_cost,
        ROUND(
          CASE
            WHEN dp.first_deposits = 0 THEN 0
            ELSE dp.spend / dp.first_deposits
          END,
          2
        ) AS first_deposit_cost,
        ROUND(
          CASE
            WHEN dp.registrations = 0 THEN 0
            ELSE dp.first_deposits / dp.registrations * 100
          END,
          2
        ) AS registration_to_deposit_rate_percent
      FROM ad_daily_performance dp
      INNER JOIN ad_channels c
        ON dp.channel_id = c.id
      INNER JOIN ad_channel_groups cg
        ON c.channel_group_id = cg.id
      WHERE dp.report_date = ?
        AND dp.channel_id = ?
      LIMIT 1
    `,
    [reportDate, channelId]
  );

  return rows[0] ? mapDailyPerformanceRow(rows[0]) : null;
};

const upsertDailyPerformance = async (payload) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [channelRows] = await connection.execute(
      `
        SELECT
          id,
          is_active
        FROM ad_channels
        WHERE id = ?
        LIMIT 1
      `,
      [payload.channel_id]
    );

    const channel = channelRows[0];

    if (!channel || !Boolean(channel.is_active)) {
      throw new ApiError(404, 'Channel not found or inactive');
    }

    const [batchRows] = await connection.execute(
      `
        SELECT id
        FROM ad_import_batches
        WHERE id = ?
        LIMIT 1
      `,
      [payload.import_batch_id]
    );

    if (!batchRows[0]) {
      throw new ApiError(404, 'Import batch not found');
    }

    await connection.execute(
      `
        INSERT INTO ad_daily_performance
          (import_batch_id, channel_id, report_date, spend, registrations, first_deposits)
        VALUES
          (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          import_batch_id = VALUES(import_batch_id),
          spend = VALUES(spend),
          registrations = VALUES(registrations),
          first_deposits = VALUES(first_deposits),
          updated_at = CURRENT_TIMESTAMP
      `,
      [
        payload.import_batch_id,
        payload.channel_id,
        payload.report_date,
        payload.spend,
        payload.registrations,
        payload.first_deposits
      ]
    );

    const savedRow = await findSavedDailyPerformance(
      connection,
      payload.report_date,
      payload.channel_id
    );

    await connection.commit();

    return savedRow;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  GROUP_CODES,
  GROUP_LABELS,
  getChannels,
  getKpiCards,
  getDailyPerformance,
  getGroupTotals,
  getGeneralTotals,
  createImportBatch,
  upsertDailyPerformance
};
