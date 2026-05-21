const pool = require('../config/db');

const DAILY_SUMMARY_COLUMNS = `
  summary_date,
  deposit,
  withdrawal,
  net_deposit,
  registered,
  promotion,
  ggr
`;

const roundMoney = (value) => Number(Number(value).toFixed(2));
const roundDecimal = (value, precision) => Number(Number(value).toFixed(precision));

const normalizeRecord = (record) => {
  const deposit = Number(record.deposit);
  const withdrawal = Number(record.withdrawal);
  const promotion = Number(record.promotion);
  // Clients never send computed KPI columns; the backend is the source of truth.
  const netDeposit = roundMoney(deposit - withdrawal);
  const ggr = roundMoney(netDeposit - promotion);

  return {
    summary_date: record.summary_date,
    deposit,
    withdrawal,
    net_deposit: netDeposit,
    registered: Number(record.registered),
    promotion,
    ggr
  };
};

const upsertSql = `
  INSERT INTO daily_summary_operation
    (summary_date, deposit, withdrawal, net_deposit, registered, promotion, ggr)
  VALUES
    (?, ?, ?, ?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE
    deposit = VALUES(deposit),
    withdrawal = VALUES(withdrawal),
    net_deposit = VALUES(net_deposit),
    registered = VALUES(registered),
    promotion = VALUES(promotion),
    ggr = VALUES(ggr),
    updated_at = CURRENT_TIMESTAMP
`;

const buildDateRangeWhere = ({ start_date, end_date } = {}, dateColumn = 'summary_date') => {
  const conditions = [];
  const params = [];

  // Only static SQL fragments are added here; user-supplied dates always go through parameters.
  if (start_date) {
    conditions.push(`${dateColumn} >= ?`);
    params.push(start_date);
  }

  if (end_date) {
    conditions.push(`${dateColumn} <= ?`);
    params.push(end_date);
  }

  return {
    whereClause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    params
  };
};

const findAll = async (filters = {}) => {
  const { whereClause, params } = buildDateRangeWhere(filters);
  const [rows] = await pool.execute(
    `
      SELECT ${DAILY_SUMMARY_COLUMNS}
      FROM daily_summary_operation
      ${whereClause}
      ORDER BY summary_date ASC
    `,
    params
  );

  return rows;
};

const findByDate = async (summaryDate) => {
  const [rows] = await pool.execute(
    `
      SELECT ${DAILY_SUMMARY_COLUMNS}
      FROM daily_summary_operation
      WHERE summary_date = ?
      LIMIT 1
    `,
    [summaryDate]
  );

  return rows[0] || null;
};

const getDailyPromoRoiAnalysis = async (filters = {}) => {
  const { whereClause, params } = buildDateRangeWhere(filters);
  const [rows] = await pool.execute(
    `
      SELECT
        summary_date AS date,
        promotion,
        registered,
        ggr
      FROM daily_summary_operation
      ${whereClause}
      ORDER BY summary_date ASC
    `,
    params
  );

  return rows.map((row) => ({
    date: row.date,
    promotion: roundMoney(row.promotion),
    registered: Number(row.registered),
    ggr: roundMoney(row.ggr)
  }));
};

const getGgrSummaryReport = async (filters = {}) => {
  const { whereClause, params } = buildDateRangeWhere(filters, 'm.report_date');

  const [summaryRows] = await pool.execute(
    `
      SELECT
        COALESCE(SUM(m.ggr), 0) AS weekly_net_ggr,
        COALESCE(SUM(m.total_bet_amount), 0) AS total_bets,
        COALESCE(SUM(m.total_payout_amount), 0) AS total_payouts,
        COALESCE(SUM(m.pagcor_share), 0) AS total_pagcor_share,
        COALESCE(SUM(m.audit_fee), 0) AS total_audit_fee,
        MIN(m.report_date) AS start_date,
        MAX(m.report_date) AS end_date,
        COUNT(DISTINCT m.report_date) AS total_days
      FROM ggr_daily_platform_metrics m
      ${whereClause}
    `,
    params
  );

  const [platformRows] = await pool.execute(
    `
      SELECT
        m.platform_id,
        p.platform_code,
        p.platform_name,
        COALESCE(SUM(m.ggr), 0) AS ggr,
        COALESCE(SUM(m.total_bet_amount), 0) AS total_bets,
        COALESCE(SUM(m.total_payout_amount), 0) AS total_payouts,
        COALESCE(SUM(m.pagcor_share), 0) AS pagcor_share,
        COALESCE(SUM(m.audit_fee), 0) AS audit_fee
      FROM ggr_daily_platform_metrics m
      INNER JOIN platforms p ON p.id = m.platform_id
      ${whereClause}
      GROUP BY m.platform_id, p.platform_code, p.platform_name
      ORDER BY ggr DESC, p.platform_name ASC
    `,
    params
  );

  const summary = summaryRows[0];
  const normalizedPlatforms = platformRows.map((row) => ({
    platform_id: Number(row.platform_id),
    platform_code: row.platform_code,
    platform_name: row.platform_name,
    ggr: roundMoney(row.ggr),
    total_bets: roundMoney(row.total_bets),
    total_payouts: roundMoney(row.total_payouts),
    pagcor_share: roundDecimal(row.pagcor_share, 4),
    audit_fee: roundDecimal(row.audit_fee, 4)
  }));

  return {
    period: {
      start_date: summary.start_date,
      end_date: summary.end_date,
      total_days: Number(summary.total_days)
    },
    weekly_net_ggr: roundMoney(summary.weekly_net_ggr),
    total_bets: roundMoney(summary.total_bets),
    total_payouts: roundMoney(summary.total_payouts),
    total_pagcor_share: roundDecimal(summary.total_pagcor_share, 4),
    total_audit_fee: roundDecimal(summary.total_audit_fee, 4),
    best_performing_platform: normalizedPlatforms[0] || null,
    worst_performing_platform: normalizedPlatforms[normalizedPlatforms.length - 1] || null,
    platform_breakdown: normalizedPlatforms
  };
};

const getCumulativeGgrWaterfallReport = async (filters = {}) => {
  const { whereClause, params } = buildDateRangeWhere(filters, 'report_date');
  const [rows] = await pool.execute(
    `
      SELECT
        daily.date,
        daily.daily_ggr,
        daily.total_bets,
        daily.total_payouts,
        SUM(daily.daily_ggr) OVER (
          ORDER BY daily.date ASC
          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS cumulative_ggr
      FROM (
        SELECT
          report_date AS date,
          COALESCE(SUM(ggr), 0) AS daily_ggr,
          COALESCE(SUM(total_bet_amount), 0) AS total_bets,
          COALESCE(SUM(total_payout_amount), 0) AS total_payouts
        FROM ggr_daily_platform_metrics
        ${whereClause}
        GROUP BY report_date
      ) daily
      ORDER BY daily.date ASC
    `,
    params
  );

  let previousCumulative = 0;
  const dailyPoints = rows.map((row) => {
    const dailyGgr = roundMoney(row.daily_ggr);
    const cumulativeGgr = roundMoney(row.cumulative_ggr);
    const waterfallStart = roundMoney(previousCumulative);
    const waterfallEnd = cumulativeGgr;
    previousCumulative = cumulativeGgr;

    return {
      date: row.date,
      daily_ggr: dailyGgr,
      cumulative_ggr: cumulativeGgr,
      total_bets: roundMoney(row.total_bets),
      total_payouts: roundMoney(row.total_payouts),
      waterfall_start: waterfallStart,
      waterfall_end: waterfallEnd,
      direction: dailyGgr >= 0 ? 'positive' : 'negative'
    };
  });

  const totals = dailyPoints.reduce(
    (accumulator, row) => ({
      weekly_net_ggr: accumulator.weekly_net_ggr + row.daily_ggr,
      total_bets: accumulator.total_bets + row.total_bets,
      total_payouts: accumulator.total_payouts + row.total_payouts
    }),
    {
      weekly_net_ggr: 0,
      total_bets: 0,
      total_payouts: 0
    }
  );

  const bestDay = dailyPoints.reduce(
    (best, row) => (!best || row.daily_ggr > best.daily_ggr ? row : best),
    null
  );
  const worstDay = dailyPoints.reduce(
    (worst, row) => (!worst || row.daily_ggr < worst.daily_ggr ? row : worst),
    null
  );

  return {
    period: {
      start_date: dailyPoints[0]?.date || null,
      end_date: dailyPoints[dailyPoints.length - 1]?.date || null,
      total_days: dailyPoints.length
    },
    weekly_net_ggr: roundMoney(totals.weekly_net_ggr),
    total_bets: roundMoney(totals.total_bets),
    total_payouts: roundMoney(totals.total_payouts),
    best_day: bestDay,
    worst_day: worstDay,
    waterfall_points: [
      {
        label: 'Week start',
        date: null,
        daily_ggr: 0,
        cumulative_ggr: 0,
        total_bets: 0,
        total_payouts: 0,
        waterfall_start: 0,
        waterfall_end: 0,
        direction: 'baseline'
      },
      ...dailyPoints
    ]
  };
};

const save = async (record) => {
  const normalizedRecord = normalizeRecord(record);

  await pool.execute(upsertSql, [
    normalizedRecord.summary_date,
    normalizedRecord.deposit,
    normalizedRecord.withdrawal,
    normalizedRecord.net_deposit,
    normalizedRecord.registered,
    normalizedRecord.promotion,
    normalizedRecord.ggr
  ]);

  return normalizedRecord;
};

const saveBulk = async (records) => {
  const connection = await pool.getConnection();

  try {
    // Keep bulk upserts atomic so partial imports do not leave the dashboard inconsistent.
    await connection.beginTransaction();

    for (const record of records) {
      const normalizedRecord = normalizeRecord(record);
      await connection.execute(upsertSql, [
        normalizedRecord.summary_date,
        normalizedRecord.deposit,
        normalizedRecord.withdrawal,
        normalizedRecord.net_deposit,
        normalizedRecord.registered,
        normalizedRecord.promotion,
        normalizedRecord.ggr
      ]);
    }

    await connection.commit();
    return records.length;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getDashboardSummary = async (filters = {}) => {
  const { whereClause, params } = buildDateRangeWhere(filters);

  const [summaryRows] = await pool.execute(
    `
      SELECT
        COALESCE(SUM(deposit), 0) AS total_deposit,
        COALESCE(SUM(withdrawal), 0) AS total_withdrawal,
        COALESCE(SUM(net_deposit), 0) AS total_net_deposit,
        COALESCE(SUM(registered), 0) AS total_registered,
        COALESCE(SUM(promotion), 0) AS total_promotion,
        COALESCE(SUM(ggr), 0) AS total_ggr,
        COALESCE(AVG(deposit), 0) AS average_daily_deposit,
        COALESCE(AVG(withdrawal), 0) AS average_daily_withdrawal,
        COALESCE(AVG(ggr), 0) AS average_daily_ggr,
        COUNT(*) AS total_days
      FROM daily_summary_operation
      ${whereClause}
    `,
    params
  );

  const [bestRows] = await pool.execute(
    `
      SELECT summary_date, ggr
      FROM daily_summary_operation
      ${whereClause}
      ORDER BY ggr DESC, summary_date ASC
      LIMIT 1
    `,
    params
  );

  const [worstRows] = await pool.execute(
    `
      SELECT summary_date, ggr
      FROM daily_summary_operation
      ${whereClause}
      ORDER BY ggr ASC, summary_date ASC
      LIMIT 1
    `,
    params
  );

  const summary = summaryRows[0];

  return {
    total_deposit: roundMoney(summary.total_deposit),
    total_withdrawal: roundMoney(summary.total_withdrawal),
    total_net_deposit: roundMoney(summary.total_net_deposit),
    total_registered: Number(summary.total_registered),
    total_promotion: roundMoney(summary.total_promotion),
    total_ggr: roundMoney(summary.total_ggr),
    average_daily_deposit: roundMoney(summary.average_daily_deposit),
    average_daily_withdrawal: roundMoney(summary.average_daily_withdrawal),
    average_daily_ggr: roundMoney(summary.average_daily_ggr),
    total_days: Number(summary.total_days),
    best_ggr_day: bestRows[0] || null,
    worst_ggr_day: worstRows[0] || null
  };
};

const getPlayerBehaviourLiquidity = async (filters = {}) => {
  const { whereClause, params } = buildDateRangeWhere(filters);
  const [rows] = await pool.execute(
    `
      SELECT
        summary_date AS date,
        deposit,
        withdrawal,
        ROUND(
          CASE
            WHEN deposit > 0 THEN (withdrawal / deposit) * 100
            ELSE 0
          END,
          2
        ) AS withdrawal_ratio
      FROM daily_summary_operation
      ${whereClause}
      ORDER BY summary_date ASC
    `,
    params
  );

  return rows;
};

const getCumulativeMonthlyTrajectory = async (filters = {}) => {
  const { whereClause, params } = buildDateRangeWhere(filters);
  const [rows] = await pool.execute(
    `
      SELECT
        summary_date AS date,
        ROUND(
          SUM(ggr) OVER (
            ORDER BY summary_date ASC
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
          ),
          2
        ) AS cumulative_net_revenue_after_promotions,
        ROUND(
          SUM(net_deposit) OVER (
            ORDER BY summary_date ASC
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
          ),
          2
        ) AS cumulative_net_deposit
      FROM daily_summary_operation
      ${whereClause}
      ORDER BY summary_date ASC
    `,
    params
  );

  return rows;
};

const getDashboardData = async (filters = {}) => {
  const [records, summary] = await Promise.all([
    findAll(filters),
    getDashboardSummary(filters)
  ]);

  return {
    records,
    summary
  };
};

module.exports = {
  findAll,
  findByDate,
  getDailyPromoRoiAnalysis,
  getGgrSummaryReport,
  getCumulativeGgrWaterfallReport,
  save,
  saveBulk,
  getDashboardSummary,
  getPlayerBehaviourLiquidity,
  getCumulativeMonthlyTrajectory,
  getDashboardData,
  normalizeRecord
};
