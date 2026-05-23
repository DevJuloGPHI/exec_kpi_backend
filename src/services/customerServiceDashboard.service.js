const pool = require('../config/db');

const DEFAULT_FILTERS = {
  start_date: '2026-04-01',
  end_date: '2026-04-30',
  category_id: 10
};

const CATEGORY_NAMES = {
  1: 'Registration',
  2: 'Promotion',
  3: 'Verification Code / OTP',
  4: 'KYC',
  5: 'Account',
  6: 'Withdrawal',
  7: 'Deposit',
  8: 'Game Related',
  9: 'Other',
  10: 'Unlabeled / No Tag'
};

const SHIFT_NAMES = {
  1: 'Morning',
  2: 'Afternoon / MID',
  3: 'Evening / Night'
};

const roundNumber = (value, precision = 2) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  const factor = 10 ** precision;
  return (
    Math.sign(numericValue) *
    Math.round((Math.abs(numericValue) + Number.EPSILON) * factor) /
    factor
  );
};

const toCount = (value) => Number(value || 0);

const normalizeDateFilters = (filters = {}) => ({
  start_date: filters.start_date || DEFAULT_FILTERS.start_date,
  end_date: filters.end_date || DEFAULT_FILTERS.end_date
});

const normalizeReportFilters = (filters = {}) => ({
  ...normalizeDateFilters(filters),
  category_id:
    filters.category_id === undefined || filters.category_id === ''
      ? DEFAULT_FILTERS.category_id
      : Number(filters.category_id),
  shift_id:
    filters.shift_id === undefined || filters.shift_id === ''
      ? undefined
      : Number(filters.shift_id)
});

const toMonthStart = (date) => `${date.slice(0, 7)}-01`;

const daysBetweenInclusive = (startDate, endDate) => {
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
  const start = Date.UTC(startYear, startMonth - 1, startDay);
  const end = Date.UTC(endYear, endMonth - 1, endDay);

  return Math.max(0, Math.floor((end - start) / 86400000) + 1);
};

const buildDateRangeWhere = (filters = {}, dateColumn = 'report_date') => {
  const normalizedFilters = normalizeDateFilters(filters);

  return {
    filters: normalizedFilters,
    whereClause: `WHERE ${dateColumn} BETWEEN ? AND ?`,
    params: [normalizedFilters.start_date, normalizedFilters.end_date]
  };
};

const buildCategoryDateWhere = (filters = {}, tableAlias = 'scv') => {
  const normalizedFilters = normalizeReportFilters(filters);
  const conditions = [
    `${tableAlias}.report_date BETWEEN ? AND ?`,
    `${tableAlias}.category_id = ?`
  ];
  const params = [
    normalizedFilters.start_date,
    normalizedFilters.end_date,
    normalizedFilters.category_id
  ];

  if (normalizedFilters.shift_id) {
    conditions.push(`${tableAlias}.shift_id = ?`);
    params.push(normalizedFilters.shift_id);
  }

  return {
    filters: normalizedFilters,
    whereClause: `WHERE ${conditions.join(' AND ')}`,
    params
  };
};

const categoryNameFor = (row) =>
  CATEGORY_NAMES[Number(row.category_id || row.id)] || row.category_name;
const shiftNameFor = (row) =>
  SHIFT_NAMES[Number(row.shift_id || row.id)] || row.shift_name;

const formatCategory = (row) => ({
  category_id: Number(row.category_id || row.id),
  category_code: row.category_code,
  category_name: categoryNameFor(row),
  category_name_cn: row.category_name_cn || null,
  is_active: row.is_active === undefined ? undefined : Boolean(row.is_active)
});

const formatShift = (row) => ({
  shift_id: Number(row.shift_id || row.id),
  shift_code: row.shift_code,
  shift_name: shiftNameFor(row),
  shift_name_cn: row.shift_name_cn || null,
  start_time: row.start_time || null,
  end_time: row.end_time || null
});

const addSharePercentages = (rows, totalCount) =>
  rows.map((row) => ({
    ...row,
    share_percentage: totalCount > 0 ? roundNumber((row.total_count / totalCount) * 100, 2) : 0
  }));

const getCategories = async () => {
  const [rows] = await pool.execute(
    `
      SELECT
        id,
        category_code,
        category_name,
        category_name_cn,
        is_active
      FROM cs_categories
      ORDER BY id ASC
    `
  );

  return rows.map(formatCategory);
};

const getShifts = async () => {
  const [rows] = await pool.execute(
    `
      SELECT
        id,
        shift_code,
        shift_name,
        shift_name_cn,
        start_time,
        end_time
      FROM cs_shifts
      ORDER BY id ASC
    `
  );

  return rows.map(formatShift);
};

const getTimeSlots = async () => {
  const [rows] = await pool.execute(
    `
      SELECT
        id AS time_slot_id,
        time_slot_label,
        start_time,
        end_time
      FROM cs_time_slots
      ORDER BY start_time ASC
    `
  );

  return rows.map((row) => ({
    time_slot_id: Number(row.time_slot_id),
    time_slot_label: row.time_slot_label,
    start_time: row.start_time,
    end_time: row.end_time
  }));
};

const getSummary = async (filters = {}) => {
  const normalizedFilters = normalizeReportFilters(filters);
  const totalDays = daysBetweenInclusive(normalizedFilters.start_date, normalizedFilters.end_date);

  const [summaryRows] = await pool.execute(
    `
      SELECT
        COALESCE(SUM(total_count), 0) AS total_count,
        MIN(report_date) AS data_start_date,
        MAX(report_date) AS data_end_date,
        COUNT(DISTINCT report_date) AS days_with_records
      FROM cs_shift_category_volume
      WHERE report_date BETWEEN ? AND ?
    `,
    [normalizedFilters.start_date, normalizedFilters.end_date]
  );

  const [selectedCategoryRows] = await pool.execute(
    `
      SELECT
        c.id AS category_id,
        c.category_code,
        c.category_name,
        c.category_name_cn,
        COALESCE(SUM(scv.total_count), 0) AS total_count
      FROM cs_categories c
      LEFT JOIN cs_shift_category_volume scv
        ON scv.category_id = c.id
        AND scv.report_date BETWEEN ? AND ?
      WHERE c.id = ?
      GROUP BY c.id, c.category_code, c.category_name, c.category_name_cn
      LIMIT 1
    `,
    [normalizedFilters.start_date, normalizedFilters.end_date, normalizedFilters.category_id]
  );

  const [peakDayRows] = await pool.execute(
    `
      SELECT
        report_date AS date,
        COALESCE(SUM(total_count), 0) AS total_count
      FROM cs_hourly_volume
      WHERE report_date BETWEEN ? AND ?
      GROUP BY report_date
      ORDER BY total_count DESC, report_date ASC
      LIMIT 1
    `,
    [normalizedFilters.start_date, normalizedFilters.end_date]
  );

  const [peakTimeSlotRows] = await pool.execute(
    `
      SELECT
        ts.id AS time_slot_id,
        ts.time_slot_label,
        ts.start_time,
        ts.end_time,
        COALESCE(SUM(hv.total_count), 0) AS total_count
      FROM cs_time_slots ts
      LEFT JOIN cs_hourly_volume hv
        ON hv.time_slot_id = ts.id
        AND hv.report_date BETWEEN ? AND ?
      GROUP BY ts.id, ts.time_slot_label, ts.start_time, ts.end_time
      ORDER BY total_count DESC, ts.start_time ASC
      LIMIT 1
    `,
    [normalizedFilters.start_date, normalizedFilters.end_date]
  );

  const [peakShiftRows] = await pool.execute(
    `
      SELECT
        s.id AS shift_id,
        s.shift_code,
        s.shift_name,
        s.shift_name_cn,
        s.start_time,
        s.end_time,
        COALESCE(SUM(scv.total_count), 0) AS total_count
      FROM cs_shifts s
      LEFT JOIN cs_shift_category_volume scv
        ON scv.shift_id = s.id
        AND scv.report_date BETWEEN ? AND ?
      GROUP BY s.id, s.shift_code, s.shift_name, s.shift_name_cn, s.start_time, s.end_time
      ORDER BY total_count DESC, s.id ASC
      LIMIT 1
    `,
    [normalizedFilters.start_date, normalizedFilters.end_date]
  );

  const [peakCategoryRows] = await pool.execute(
    `
      SELECT
        c.id AS category_id,
        c.category_code,
        c.category_name,
        c.category_name_cn,
        COALESCE(SUM(scv.total_count), 0) AS total_count
      FROM cs_categories c
      LEFT JOIN cs_shift_category_volume scv
        ON scv.category_id = c.id
        AND scv.report_date BETWEEN ? AND ?
      GROUP BY c.id, c.category_code, c.category_name, c.category_name_cn
      ORDER BY total_count DESC, c.id ASC
      LIMIT 1
    `,
    [normalizedFilters.start_date, normalizedFilters.end_date]
  );

  const summary = summaryRows[0];
  const totalCount = toCount(summary.total_count);
  const selectedCategory = selectedCategoryRows[0]
    ? {
        ...formatCategory(selectedCategoryRows[0]),
        total_count: toCount(selectedCategoryRows[0].total_count),
        share_percentage:
          totalCount > 0
            ? roundNumber((toCount(selectedCategoryRows[0].total_count) / totalCount) * 100, 2)
            : 0
      }
    : null;

  return {
    filters: normalizedFilters,
    period: {
      start_date: normalizedFilters.start_date,
      end_date: normalizedFilters.end_date,
      data_start_date: summary.data_start_date,
      data_end_date: summary.data_end_date,
      total_days: totalDays,
      days_with_records: Number(summary.days_with_records || 0)
    },
    total_count: totalCount,
    average_daily_count: totalDays > 0 ? roundNumber(totalCount / totalDays, 2) : 0,
    selected_category: selectedCategory,
    peak_day: peakDayRows[0]
      ? {
          date: peakDayRows[0].date,
          total_count: toCount(peakDayRows[0].total_count)
        }
      : null,
    peak_time_slot: peakTimeSlotRows[0]
      ? {
          time_slot_id: Number(peakTimeSlotRows[0].time_slot_id),
          time_slot_label: peakTimeSlotRows[0].time_slot_label,
          start_time: peakTimeSlotRows[0].start_time,
          end_time: peakTimeSlotRows[0].end_time,
          total_count: toCount(peakTimeSlotRows[0].total_count)
        }
      : null,
    peak_shift: peakShiftRows[0]
      ? {
          ...formatShift(peakShiftRows[0]),
          total_count: toCount(peakShiftRows[0].total_count)
        }
      : null,
    peak_category: peakCategoryRows[0]
      ? {
          ...formatCategory(peakCategoryRows[0]),
          total_count: toCount(peakCategoryRows[0].total_count)
        }
      : null
  };
};

const getDailyVolume = async (filters = {}) => {
  const { filters: normalizedFilters, whereClause, params } = buildDateRangeWhere(
    filters,
    'report_date'
  );
  const [rows] = await pool.execute(
    `
      SELECT
        report_date AS date,
        COALESCE(SUM(total_count), 0) AS total_count
      FROM cs_hourly_volume
      ${whereClause}
      GROUP BY report_date
      ORDER BY report_date ASC
    `,
    params
  );

  return {
    filters: normalizedFilters,
    total_count: rows.reduce((sum, row) => sum + toCount(row.total_count), 0),
    days: rows.map((row) => ({
      date: row.date,
      total_count: toCount(row.total_count)
    }))
  };
};

const getHourlyVolume = async (filters = {}) => {
  const normalizedFilters = normalizeDateFilters(filters);
  const [rows] = await pool.execute(
    `
      SELECT
        ts.id AS time_slot_id,
        ts.time_slot_label,
        ts.start_time,
        ts.end_time,
        COALESCE(SUM(hv.total_count), 0) AS total_count,
        COALESCE(AVG(hv.total_count), 0) AS average_count,
        COALESCE(MAX(hv.total_count), 0) AS peak_single_day_count
      FROM cs_time_slots ts
      LEFT JOIN cs_hourly_volume hv
        ON hv.time_slot_id = ts.id
        AND hv.report_date BETWEEN ? AND ?
      GROUP BY ts.id, ts.time_slot_label, ts.start_time, ts.end_time
      ORDER BY ts.start_time ASC
    `,
    [normalizedFilters.start_date, normalizedFilters.end_date]
  );

  return {
    filters: normalizedFilters,
    total_count: rows.reduce((sum, row) => sum + toCount(row.total_count), 0),
    time_slots: rows.map((row) => ({
      time_slot_id: Number(row.time_slot_id),
      time_slot_label: row.time_slot_label,
      start_time: row.start_time,
      end_time: row.end_time,
      total_count: toCount(row.total_count),
      average_count: roundNumber(row.average_count, 2),
      peak_single_day_count: toCount(row.peak_single_day_count)
    }))
  };
};

const getCategoryBreakdown = async (filters = {}) => {
  const normalizedFilters = normalizeDateFilters(filters);
  const [rows] = await pool.execute(
    `
      SELECT
        c.id AS category_id,
        c.category_code,
        c.category_name,
        c.category_name_cn,
        COALESCE(SUM(scv.total_count), 0) AS total_count
      FROM cs_categories c
      LEFT JOIN cs_shift_category_volume scv
        ON scv.category_id = c.id
        AND scv.report_date BETWEEN ? AND ?
      GROUP BY c.id, c.category_code, c.category_name, c.category_name_cn
      ORDER BY total_count DESC, c.id ASC
    `,
    [normalizedFilters.start_date, normalizedFilters.end_date]
  );
  const totalCount = rows.reduce((sum, row) => sum + toCount(row.total_count), 0);
  const categories = rows.map((row) => ({
    ...formatCategory(row),
    total_count: toCount(row.total_count)
  }));

  return {
    filters: normalizedFilters,
    total_count: totalCount,
    categories: addSharePercentages(categories, totalCount)
  };
};

const getShiftBreakdown = async (filters = {}) => {
  const normalizedFilters = normalizeReportFilters(filters);
  const [rows] = await pool.execute(
    `
      SELECT
        s.id AS shift_id,
        s.shift_code,
        s.shift_name,
        s.shift_name_cn,
        s.start_time,
        s.end_time,
        COALESCE(SUM(scv.total_count), 0) AS total_count
      FROM cs_shifts s
      LEFT JOIN cs_shift_category_volume scv
        ON scv.shift_id = s.id
        AND scv.report_date BETWEEN ? AND ?
        AND scv.category_id = ?
      GROUP BY s.id, s.shift_code, s.shift_name, s.shift_name_cn, s.start_time, s.end_time
      ORDER BY s.id ASC
    `,
    [normalizedFilters.start_date, normalizedFilters.end_date, normalizedFilters.category_id]
  );
  const totalCount = rows.reduce((sum, row) => sum + toCount(row.total_count), 0);
  const shifts = rows.map((row) => ({
    ...formatShift(row),
    total_count: toCount(row.total_count)
  }));

  return {
    filters: normalizedFilters,
    total_count: totalCount,
    shifts: addSharePercentages(shifts, totalCount)
  };
};

const getShiftCategoryVolume = async (filters = {}) => {
  const { filters: normalizedFilters, whereClause, params } = buildCategoryDateWhere(filters);
  const [rows] = await pool.execute(
    `
      SELECT
        scv.report_date AS date,
        scv.shift_id,
        s.shift_code,
        s.shift_name,
        s.shift_name_cn,
        s.start_time,
        s.end_time,
        scv.category_id,
        c.category_code,
        c.category_name,
        c.category_name_cn,
        COALESCE(SUM(scv.total_count), 0) AS total_count
      FROM cs_shift_category_volume scv
      INNER JOIN cs_shifts s ON s.id = scv.shift_id
      INNER JOIN cs_categories c ON c.id = scv.category_id
      ${whereClause}
      GROUP BY
        scv.report_date,
        scv.shift_id,
        s.shift_code,
        s.shift_name,
        s.shift_name_cn,
        s.start_time,
        s.end_time,
        scv.category_id,
        c.category_code,
        c.category_name,
        c.category_name_cn
      ORDER BY scv.report_date ASC, scv.shift_id ASC
    `,
    params
  );

  return {
    filters: normalizedFilters,
    total_count: rows.reduce((sum, row) => sum + toCount(row.total_count), 0),
    records: rows.map((row) => ({
      date: row.date,
      ...formatShift(row),
      ...formatCategory(row),
      total_count: toCount(row.total_count)
    }))
  };
};

const getShiftCategoryMatrix = async (filters = {}) => {
  const normalizedFilters = normalizeDateFilters(filters);
  const [rows] = await pool.execute(
    `
      SELECT
        s.id AS shift_id,
        s.shift_code,
        s.shift_name,
        s.shift_name_cn,
        s.start_time,
        s.end_time,
        c.id AS category_id,
        c.category_code,
        c.category_name,
        c.category_name_cn,
        COALESCE(SUM(scv.total_count), 0) AS total_count
      FROM cs_shifts s
      CROSS JOIN cs_categories c
      LEFT JOIN cs_shift_category_volume scv
        ON scv.shift_id = s.id
        AND scv.category_id = c.id
        AND scv.report_date BETWEEN ? AND ?
      GROUP BY
        s.id,
        s.shift_code,
        s.shift_name,
        s.shift_name_cn,
        s.start_time,
        s.end_time,
        c.id,
        c.category_code,
        c.category_name,
        c.category_name_cn
      ORDER BY s.id ASC, c.id ASC
    `,
    [normalizedFilters.start_date, normalizedFilters.end_date]
  );

  const shifts = [];
  const shiftMap = new Map();
  let totalCount = 0;

  rows.forEach((row) => {
    const shiftId = Number(row.shift_id);
    const count = toCount(row.total_count);
    totalCount += count;

    if (!shiftMap.has(shiftId)) {
      const shift = {
        ...formatShift(row),
        total_count: 0,
        categories: []
      };
      shiftMap.set(shiftId, shift);
      shifts.push(shift);
    }

    const shift = shiftMap.get(shiftId);
    shift.total_count += count;
    shift.categories.push({
      ...formatCategory(row),
      total_count: count
    });
  });

  return {
    filters: normalizedFilters,
    total_count: totalCount,
    shifts: shifts.map((shift) => ({
      ...shift,
      share_percentage:
        totalCount > 0 ? roundNumber((shift.total_count / totalCount) * 100, 2) : 0,
      categories: addSharePercentages(shift.categories, shift.total_count)
    }))
  };
};

const getMonthlyCategorySummary = async (filters = {}) => {
  const normalizedFilters = normalizeDateFilters(filters);
  const startMonth = toMonthStart(normalizedFilters.start_date);
  const endMonth = toMonthStart(normalizedFilters.end_date);
  const [rows] = await pool.execute(
    `
      SELECT
        m.report_month,
        c.id AS category_id,
        c.category_code,
        c.category_name,
        c.category_name_cn,
        COALESCE(SUM(m.total_count), 0) AS total_count
      FROM cs_monthly_category_summary m
      INNER JOIN cs_categories c ON c.id = m.category_id
      WHERE m.report_month BETWEEN ? AND ?
      GROUP BY m.report_month, c.id, c.category_code, c.category_name, c.category_name_cn
      ORDER BY m.report_month ASC, c.id ASC
    `,
    [startMonth, endMonth]
  );

  const months = [];
  const monthMap = new Map();
  let totalCount = 0;

  rows.forEach((row) => {
    const reportMonth = row.report_month;
    const count = toCount(row.total_count);
    totalCount += count;

    if (!monthMap.has(reportMonth)) {
      const month = {
        report_month: reportMonth,
        total_count: 0,
        categories: []
      };
      monthMap.set(reportMonth, month);
      months.push(month);
    }

    const month = monthMap.get(reportMonth);
    month.total_count += count;
    month.categories.push({
      ...formatCategory(row),
      total_count: count
    });
  });

  return {
    filters: {
      ...normalizedFilters,
      start_month: startMonth,
      end_month: endMonth
    },
    total_count: totalCount,
    months: months.map((month) => ({
      ...month,
      share_percentage:
        totalCount > 0 ? roundNumber((month.total_count / totalCount) * 100, 2) : 0,
      categories: addSharePercentages(month.categories, month.total_count)
    }))
  };
};

const getImportBatches = async (filters = {}) => {
  const requestedLimit = filters.limit ? Number(filters.limit) : 20;
  const limit =
    Number.isInteger(requestedLimit) && requestedLimit >= 1 && requestedLimit <= 100
      ? requestedLimit
      : 20;
  const params = [];
  const conditions = [];

  if (filters.status) {
    conditions.push('status = ?');
    params.push(filters.status);
  }

  const [rows] = await pool.execute(
    `
      SELECT
        id,
        file_name,
        sheet_name,
        report_month,
        imported_by,
        imported_at,
        status,
        remarks
      FROM cs_import_batches
      ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
      ORDER BY imported_at DESC, id DESC
      LIMIT ${limit}
    `,
    params
  );

  return {
    filters: {
      status: filters.status || null,
      limit
    },
    import_batches: rows.map((row) => ({
      id: Number(row.id),
      file_name: row.file_name,
      sheet_name: row.sheet_name,
      report_month: row.report_month,
      imported_by: row.imported_by,
      imported_at: row.imported_at,
      status: row.status,
      remarks: row.remarks
    }))
  };
};

const getDashboardData = async (filters = {}) => {
  const [
    summary,
    dailyVolume,
    hourlyVolume,
    categoryBreakdown,
    shiftBreakdown,
    shiftCategoryVolume,
    shiftCategoryMatrix,
    monthlyCategorySummary,
    categories,
    shifts,
    timeSlots,
    importBatches
  ] = await Promise.all([
    getSummary(filters),
    getDailyVolume(filters),
    getHourlyVolume(filters),
    getCategoryBreakdown(filters),
    getShiftBreakdown(filters),
    getShiftCategoryVolume(filters),
    getShiftCategoryMatrix(filters),
    getMonthlyCategorySummary(filters),
    getCategories(),
    getShifts(),
    getTimeSlots(),
    getImportBatches({ limit: 5 })
  ]);

  return {
    summary,
    daily_volume: dailyVolume,
    hourly_volume: hourlyVolume,
    category_breakdown: categoryBreakdown,
    shift_breakdown: shiftBreakdown,
    shift_category_volume: shiftCategoryVolume,
    shift_category_matrix: shiftCategoryMatrix,
    monthly_category_summary: monthlyCategorySummary,
    metadata: {
      categories,
      shifts,
      time_slots: timeSlots,
      recent_import_batches: importBatches.import_batches
    }
  };
};

module.exports = {
  DEFAULT_FILTERS,
  CATEGORY_NAMES,
  SHIFT_NAMES,
  getCategories,
  getShifts,
  getTimeSlots,
  getSummary,
  getDailyVolume,
  getHourlyVolume,
  getCategoryBreakdown,
  getShiftBreakdown,
  getShiftCategoryVolume,
  getShiftCategoryMatrix,
  getMonthlyCategorySummary,
  getImportBatches,
  getDashboardData
};
