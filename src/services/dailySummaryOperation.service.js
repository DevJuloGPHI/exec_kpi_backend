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

const buildDateRangeWhere = ({ start_date, end_date } = {}) => {
  const conditions = [];
  const params = [];

  // Only static SQL fragments are added here; user-supplied dates always go through parameters.
  if (start_date) {
    conditions.push('summary_date >= ?');
    params.push(start_date);
  }

  if (end_date) {
    conditions.push('summary_date <= ?');
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

module.exports = {
  findAll,
  findByDate,
  save,
  saveBulk,
  getDashboardSummary,
  normalizeRecord
};
