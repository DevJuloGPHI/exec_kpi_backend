const pool = require('../config/db');

const MID_MONTH_DAY_START = 1;
const MID_MONTH_DAY_END = 15;
const DEFAULT_UNIT_COST_TARGETS = {
  cost_per_registration: 30,
  cost_per_first_deposit: 60
};
const DEFAULT_CONVERSION_QUALITY_THRESHOLD = 50;
const DEFAULT_DAILY_PERFORMANCE_PAGE = 1;
const DEFAULT_DAILY_PERFORMANCE_PER_PAGE = 10;
const MAX_DAILY_PERFORMANCE_PER_PAGE = 100;
const DAILY_PERFORMANCE_SORT_DIRECTIONS = ['asc', 'desc'];
const DAILY_PERFORMANCE_SORT_EXPRESSIONS = {
  date: 'date',
  cost: 'cost',
  registrations: 'registrations',
  first_deposits: 'first_deposits',
  cost_per_registration: 'cost_per_registration',
  cost_per_first_deposit: 'cost_per_first_deposit',
  conversion: 'conversion'
};
const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
];

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

const roundMoney = (value) => roundNumber(value, 2);
const toCount = (value) => Number(value || 0);

const optionalPositiveInt = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const numericValue = Number(value);
  return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : undefined;
};

const optionalNonNegativeNumber = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : undefined;
};

const normalizeFilters = (filters = {}) => ({
  start_date: filters.start_date || undefined,
  end_date: filters.end_date || undefined,
  content_category_id: optionalPositiveInt(filters.content_category_id),
  agent_id: optionalPositiveInt(filters.agent_id)
});

const normalizeUnitCostTargets = (filters = {}) => ({
  cost_per_registration:
    optionalNonNegativeNumber(filters.cost_per_registration_target) ??
    DEFAULT_UNIT_COST_TARGETS.cost_per_registration,
  cost_per_first_deposit:
    optionalNonNegativeNumber(filters.cost_per_first_deposit_target) ??
    DEFAULT_UNIT_COST_TARGETS.cost_per_first_deposit
});

const normalizeConversionQualityThreshold = (filters = {}) =>
  optionalNonNegativeNumber(filters.conversion_quality_threshold) ??
  optionalNonNegativeNumber(filters.quality_threshold) ??
  DEFAULT_CONVERSION_QUALITY_THRESHOLD;

const normalizeDailyPerformancePagination = (filters = {}) => {
  const page = optionalPositiveInt(filters.page) || DEFAULT_DAILY_PERFORMANCE_PAGE;
  const perPage = Math.min(
    optionalPositiveInt(filters.per_page) ||
      optionalPositiveInt(filters.limit) ||
      DEFAULT_DAILY_PERFORMANCE_PER_PAGE,
    MAX_DAILY_PERFORMANCE_PER_PAGE
  );

  return {
    page,
    per_page: perPage,
    offset: (page - 1) * perPage
  };
};

const normalizeDailyPerformanceSort = (filters = {}) => {
  const requestedSortBy = String(filters.sort_by || 'date').toLowerCase();
  const requestedSortDirection = String(filters.sort_direction || 'asc').toLowerCase();

  return {
    sort_by: DAILY_PERFORMANCE_SORT_EXPRESSIONS[requestedSortBy] ? requestedSortBy : 'date',
    sort_direction: DAILY_PERFORMANCE_SORT_DIRECTIONS.includes(requestedSortDirection)
      ? requestedSortDirection
      : 'asc'
  };
};

const hasAgentScope = (filters) =>
  Boolean(filters.content_category_id || filters.agent_id);

const buildDateRangeWhere = (filters = {}, dateColumn) => {
  const conditions = [];
  const params = [];

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

const buildAgentPerformanceWhere = (filters = {}) => {
  const conditions = [];
  const params = [];

  if (filters.start_date) {
    conditions.push('p.latest_payment_date >= ?');
    params.push(filters.start_date);
  }

  if (filters.end_date) {
    conditions.push('p.latest_payment_date <= ?');
    params.push(filters.end_date);
  }

  if (filters.content_category_id) {
    conditions.push('a.content_category_id = ?');
    params.push(filters.content_category_id);
  }

  if (filters.agent_id) {
    conditions.push('p.agent_id = ?');
    params.push(filters.agent_id);
  }

  return {
    whereClause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    params
  };
};

const buildAgentDailyPerformanceRollupWhere = (filters = {}) => {
  const conditions = [];
  const params = [];

  if (filters.start_date) {
    conditions.push('adp.latest_payment_date >= ?');
    params.push(filters.start_date);
  }

  if (filters.end_date) {
    conditions.push('adp.latest_payment_date <= ?');
    params.push(filters.end_date);
  }

  if (filters.content_category_id) {
    conditions.push('a.content_category_id = ?');
    params.push(filters.content_category_id);
  }

  if (filters.agent_id) {
    conditions.push('adp.agent_id = ?');
    params.push(filters.agent_id);
  }

  return {
    whereClause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    params
  };
};

const buildMidMonthConsumptionWhere = (filters = {}) => {
  const conditions = ['DAYOFMONTH(report_date) BETWEEN ? AND ?'];
  const params = [MID_MONTH_DAY_START, MID_MONTH_DAY_END];

  if (filters.start_date) {
    conditions.push('report_date >= ?');
    params.push(filters.start_date);
  }

  if (filters.end_date) {
    conditions.push('report_date <= ?');
    params.push(filters.end_date);
  }

  return {
    whereClause: `WHERE ${conditions.join(' AND ')}`,
    params
  };
};

const buildMidMonthAgentPerformanceWhere = (filters = {}) => {
  const conditions = ['DAYOFMONTH(p.latest_payment_date) BETWEEN ? AND ?'];
  const params = [MID_MONTH_DAY_START, MID_MONTH_DAY_END];

  if (filters.start_date) {
    conditions.push('p.latest_payment_date >= ?');
    params.push(filters.start_date);
  }

  if (filters.end_date) {
    conditions.push('p.latest_payment_date <= ?');
    params.push(filters.end_date);
  }

  if (filters.content_category_id) {
    conditions.push('a.content_category_id = ?');
    params.push(filters.content_category_id);
  }

  if (filters.agent_id) {
    conditions.push('p.agent_id = ?');
    params.push(filters.agent_id);
  }

  return {
    whereClause: `WHERE ${conditions.join(' AND ')}`,
    params
  };
};

const formatMonthDayLabel = (date) => {
  if (!date) {
    return null;
  }

  const [, month, day] = date.split('-').map(Number);
  return `${MONTH_LABELS[month - 1]}-${day}`;
};

const formatDisplayDate = (date) => {
  if (!date) {
    return null;
  }

  const [year, month, day] = date.split('-').map(Number);
  return `${MONTH_LABELS[month - 1]} ${day}, ${year}`;
};

const buildDailyPerformanceOrderBy = (sort = {}) => {
  const expression = DAILY_PERFORMANCE_SORT_EXPRESSIONS[sort.sort_by] || 'date';
  const direction = String(sort.sort_direction || 'asc').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  if (expression === 'date') {
    return `date ${direction}`;
  }

  const nullableSort = ['cost_per_registration', 'cost_per_first_deposit'].includes(expression)
    ? `(${expression} IS NULL) ASC, `
    : '';

  return `${nullableSort}${expression} ${direction}, date ASC`;
};

const buildCards = (totals) => [
  {
    key: 'total_ad_spend',
    title: 'Total Ad Spend',
    value: totals.total_ad_spend,
    format: 'currency_compact',
    description: 'Sum of cost - money out the door'
  },
  {
    key: 'total_first_deposits',
    title: 'Total First Deposits',
    value: totals.total_first_deposits,
    format: 'number_compact',
    description: 'Sum of new first-time depositors'
  },
  {
    key: 'overall_conversion_rate',
    title: 'Overall Conversion Rate',
    value: totals.overall_conversion_rate,
    format: 'percentage',
    description: 'FTD / registrations (reg-to-deposit %)'
  },
  {
    key: 'blended_acquisition_cost',
    title: 'Blended Acquisition Cost',
    value: totals.blended_acquisition_cost,
    format: 'currency',
    description: 'Total spend / total first deposits'
  }
];

const buildAgentKpiCards = (totals) => [
  {
    key: 'total_active_agents',
    title: 'Total Active Agents',
    value: totals.total_active_agents,
    format: 'number_compact',
    description: 'Agents with activity in this view'
  },
  {
    key: 'total_ad_spend',
    title: 'Total Ad Spend',
    value: totals.total_ad_spend,
    format: 'currency_compact',
    description: 'Sum of partner media cost'
  },
  {
    key: 'first_time_deposits',
    title: 'First-Time Deposits',
    value: totals.first_time_deposits,
    format: 'number_compact',
    description: 'New first-time depositors acquired'
  },
  {
    key: 'conversion_efficiency',
    title: 'Conversion Efficiency',
    value: totals.conversion_efficiency,
    format: 'percentage',
    description: 'FTD / registrations'
  }
];

const formatSummary = (row, filters, source) => {
  const totalAdSpend = roundMoney(row.total_ad_spend);
  const totalRegistrations = toCount(row.total_registrations);
  const totalFirstDeposits = toCount(row.total_first_deposits);

  const totals = {
    total_ad_spend: totalAdSpend,
    total_registrations: totalRegistrations,
    total_first_deposits: totalFirstDeposits,
    overall_conversion_rate:
      totalRegistrations > 0
        ? roundNumber((totalFirstDeposits / totalRegistrations) * 100, 2)
        : 0,
    cost_per_registration:
      totalRegistrations > 0 ? roundMoney(totalAdSpend / totalRegistrations) : 0,
    blended_acquisition_cost:
      totalFirstDeposits > 0 ? roundMoney(totalAdSpend / totalFirstDeposits) : 0
  };

  return {
    filters: {
      start_date: filters.start_date || null,
      end_date: filters.end_date || null,
      content_category_id: filters.content_category_id || null,
      agent_id: filters.agent_id || null
    },
    source,
    period: {
      start_date: row.data_start_date || null,
      end_date: row.data_end_date || null,
      days_with_records: Number(row.days_with_records || 0)
    },
    totals,
    cards: buildCards(totals)
  };
};

const formatAgentKpiCards = (row, filters) => {
  const totalActiveAgents = Number(row.total_active_agents || 0);
  const totalAdSpend = roundMoney(row.total_ad_spend);
  const totalRegistrations = toCount(row.total_registrations);
  const firstTimeDeposits = toCount(row.first_time_deposits);

  const totals = {
    total_active_agents: totalActiveAgents,
    total_ad_spend: totalAdSpend,
    total_registrations: totalRegistrations,
    first_time_deposits: firstTimeDeposits,
    conversion_efficiency:
      totalRegistrations > 0
        ? roundNumber((firstTimeDeposits / totalRegistrations) * 100, 2)
        : 0
  };

  return {
    filters: {
      start_date: filters.start_date || null,
      end_date: filters.end_date || null,
      content_category_id: filters.content_category_id || null,
      agent_id: filters.agent_id || null
    },
    source: 'kol_agent_daily_performance',
    period: {
      start_date: row.data_start_date || null,
      end_date: row.data_end_date || null,
      days_with_records: Number(row.days_with_records || 0)
    },
    totals,
    cards: buildAgentKpiCards(totals)
  };
};

const getConsumptionSummary = async (filters = {}) => {
  const { whereClause, params } = buildDateRangeWhere(filters, 'report_date');
  const [rows] = await pool.execute(
    `
      SELECT
        COALESCE(SUM(total_cost), 0) AS total_ad_spend,
        COALESCE(SUM(new_registrations), 0) AS total_registrations,
        COALESCE(SUM(new_first_deposits), 0) AS total_first_deposits,
        MIN(report_date) AS data_start_date,
        MAX(report_date) AS data_end_date,
        COUNT(DISTINCT report_date) AS days_with_records
      FROM kol_daily_consumption_summary
      ${whereClause}
    `,
    params
  );

  return formatSummary(rows[0], filters, 'kol_daily_consumption_summary');
};

const getAgentPerformanceSummary = async (filters = {}) => {
  const { whereClause, params } = buildAgentPerformanceWhere(filters);
  const [rows] = await pool.execute(
    `
      SELECT
        COALESCE(SUM(p.cost), 0) AS total_ad_spend,
        COALESCE(SUM(p.registrations), 0) AS total_registrations,
        COALESCE(SUM(p.first_deposits), 0) AS total_first_deposits,
        MIN(p.latest_payment_date) AS data_start_date,
        MAX(p.latest_payment_date) AS data_end_date,
        COUNT(DISTINCT p.latest_payment_date) AS days_with_records,
        COUNT(DISTINCT p.agent_id) AS agents_with_records
      FROM kol_agent_daily_performance p
      INNER JOIN kol_agents a ON a.id = p.agent_id
      ${whereClause}
    `,
    params
  );

  return {
    ...formatSummary(rows[0], filters, 'kol_agent_daily_performance'),
    agents_with_records: Number(rows[0].agents_with_records || 0)
  };
};

const getAgentKpiCards = async (filters = {}) => {
  const normalizedFilters = normalizeFilters(filters);
  const { whereClause, params } = buildAgentDailyPerformanceRollupWhere(normalizedFilters);
  const [rows] = await pool.execute(
    `
      SELECT
        COUNT(DISTINCT adp.agent_id) AS total_active_agents,
        COALESCE(SUM(adp.cost), 0) AS total_ad_spend,
        COALESCE(SUM(adp.registrations), 0) AS total_registrations,
        COALESCE(SUM(adp.first_deposits), 0) AS first_time_deposits,
        MIN(adp.latest_payment_date) AS data_start_date,
        MAX(adp.latest_payment_date) AS data_end_date,
        COUNT(DISTINCT adp.latest_payment_date) AS days_with_records
      FROM kol_agent_daily_performance adp
      INNER JOIN kol_agents a ON adp.agent_id = a.id
      ${whereClause}
    `,
    params
  );

  return formatAgentKpiCards(rows[0], normalizedFilters);
};

const formatSpendAcquisitionVolume = (rows, filters, source) => {
  const dailyPoints = rows.map((row) => ({
    date: row.date,
    ad_spend: roundMoney(row.ad_spend),
    new_first_depositors: toCount(row.new_first_depositors),
    registrations: toCount(row.registrations)
  }));

  const totals = dailyPoints.reduce(
    (accumulator, row) => ({
      ad_spend: accumulator.ad_spend + row.ad_spend,
      new_first_depositors: accumulator.new_first_depositors + row.new_first_depositors,
      registrations: accumulator.registrations + row.registrations
    }),
    {
      ad_spend: 0,
      new_first_depositors: 0,
      registrations: 0
    }
  );

  const totalAdSpend = roundMoney(totals.ad_spend);
  const totalFirstDepositors = totals.new_first_depositors;

  return {
    filters: {
      start_date: filters.start_date || null,
      end_date: filters.end_date || null,
      content_category_id: filters.content_category_id || null,
      agent_id: filters.agent_id || null
    },
    source,
    chart: {
      key: 'spend_acquisition_volume',
      title: 'Spend vs. acquisition volume',
      description:
        'Daily cost (bars) vs. new first depositors (line). Conversions should scale when spend rises.',
      series: [
        {
          key: 'ad_spend',
          label: 'Ad spend',
          type: 'bar',
          value_format: 'currency'
        },
        {
          key: 'new_first_depositors',
          label: 'New first depositors',
          type: 'line',
          value_format: 'number'
        }
      ]
    },
    period: {
      start_date: dailyPoints[0]?.date || null,
      end_date: dailyPoints[dailyPoints.length - 1]?.date || null,
      days_with_records: dailyPoints.length
    },
    totals: {
      ad_spend: totalAdSpend,
      new_first_depositors: totalFirstDepositors,
      registrations: totals.registrations,
      blended_acquisition_cost:
        totalFirstDepositors > 0 ? roundMoney(totalAdSpend / totalFirstDepositors) : 0
    },
    daily_points: dailyPoints
  };
};

const getConsumptionSpendAcquisitionVolume = async (filters = {}) => {
  const { whereClause, params } = buildDateRangeWhere(filters, 'report_date');
  const [rows] = await pool.execute(
    `
      SELECT
        report_date AS date,
        COALESCE(SUM(total_cost), 0) AS ad_spend,
        COALESCE(SUM(new_first_deposits), 0) AS new_first_depositors,
        COALESCE(SUM(new_registrations), 0) AS registrations
      FROM kol_daily_consumption_summary
      ${whereClause}
      GROUP BY report_date
      ORDER BY report_date ASC
    `,
    params
  );

  return formatSpendAcquisitionVolume(rows, filters, 'kol_daily_consumption_summary');
};

const getAgentPerformanceSpendAcquisitionVolume = async (filters = {}) => {
  const { whereClause, params } = buildAgentPerformanceWhere(filters);
  const [rows] = await pool.execute(
    `
      SELECT
        p.latest_payment_date AS date,
        COALESCE(SUM(p.cost), 0) AS ad_spend,
        COALESCE(SUM(p.first_deposits), 0) AS new_first_depositors,
        COALESCE(SUM(p.registrations), 0) AS registrations
      FROM kol_agent_daily_performance p
      INNER JOIN kol_agents a ON a.id = p.agent_id
      ${whereClause}
      GROUP BY p.latest_payment_date
      ORDER BY p.latest_payment_date ASC
    `,
    params
  );

  return formatSpendAcquisitionVolume(rows, filters, 'kol_agent_daily_performance');
};

const formatConversionRateTracking = (rows, filters, source, qualityThreshold) => {
  let previousRate = null;
  const dailyPoints = rows.map((row) => {
    const registrations = toCount(row.registrations);
    const firstDeposits = toCount(row.first_deposits);
    const conversionRate =
      registrations > 0 ? roundNumber((firstDeposits / registrations) * 100, 2) : 0;
    const changeFromPreviousDay =
      previousRate === null ? null : roundNumber(conversionRate - previousRate, 2);
    const trendDirection =
      changeFromPreviousDay === null
        ? 'baseline'
        : changeFromPreviousDay > 0
          ? 'up'
          : changeFromPreviousDay < 0
            ? 'down'
            : 'flat';
    previousRate = conversionRate;

    return {
      date: row.date,
      registrations,
      first_deposits: firstDeposits,
      conversion_rate: conversionRate,
      quality_threshold: qualityThreshold,
      below_quality_threshold: conversionRate < qualityThreshold,
      change_from_previous_day: changeFromPreviousDay,
      trend_direction: trendDirection,
      status: conversionRate < qualityThreshold ? 'below_quality' : 'within_quality'
    };
  });

  const totals = dailyPoints.reduce(
    (accumulator, row) => ({
      registrations: accumulator.registrations + row.registrations,
      first_deposits: accumulator.first_deposits + row.first_deposits,
      conversion_rate_sum: accumulator.conversion_rate_sum + row.conversion_rate
    }),
    {
      registrations: 0,
      first_deposits: 0,
      conversion_rate_sum: 0
    }
  );
  const belowQualityDays = dailyPoints.filter((row) => row.below_quality_threshold).length;
  const latestPoint = dailyPoints[dailyPoints.length - 1] || null;
  const firstPoint = dailyPoints[0] || null;
  const highestDay = dailyPoints.reduce(
    (highest, row) => (!highest || row.conversion_rate > highest.conversion_rate ? row : highest),
    null
  );
  const lowestDay = dailyPoints.reduce(
    (lowest, row) => (!lowest || row.conversion_rate < lowest.conversion_rate ? row : lowest),
    null
  );
  const periodChange =
    firstPoint && latestPoint
      ? roundNumber(latestPoint.conversion_rate - firstPoint.conversion_rate, 2)
      : 0;

  return {
    filters: {
      start_date: filters.start_date || null,
      end_date: filters.end_date || null,
      content_category_id: filters.content_category_id || null,
      agent_id: filters.agent_id || null
    },
    source,
    chart: {
      key: 'conversion_rate_tracking',
      title: 'Conversion Rate Tracking',
      description: 'Registration-to-deposit rate by day. Downward trends signal low-intent traffic.',
      series: [
        {
          key: 'conversion_rate',
          label: 'Conversion',
          type: 'line',
          value_format: 'percentage'
        }
      ],
      reference_lines: [
        {
          key: 'quality_threshold',
          label: `${qualityThreshold}% quality`,
          value: qualityThreshold,
          value_format: 'percentage'
        }
      ]
    },
    period: {
      start_date: dailyPoints[0]?.date || null,
      end_date: dailyPoints[dailyPoints.length - 1]?.date || null,
      days_with_records: dailyPoints.length
    },
    threshold: {
      quality: qualityThreshold
    },
    summary: {
      registrations: totals.registrations,
      first_deposits: totals.first_deposits,
      blended_conversion_rate:
        totals.registrations > 0
          ? roundNumber((totals.first_deposits / totals.registrations) * 100, 2)
          : 0,
      average_daily_conversion_rate:
        dailyPoints.length > 0 ? roundNumber(totals.conversion_rate_sum / dailyPoints.length, 2) : 0,
      latest_conversion_rate: latestPoint?.conversion_rate ?? null,
      period_change: periodChange,
      trend_direction: periodChange > 0 ? 'up' : periodChange < 0 ? 'down' : 'flat',
      below_quality_days: belowQualityDays,
      within_quality_days: dailyPoints.length - belowQualityDays,
      highest_day: highestDay,
      lowest_day: lowestDay
    },
    daily_points: dailyPoints
  };
};

const getConsumptionConversionRateTracking = async (filters = {}, qualityThreshold) => {
  const { whereClause, params } = buildDateRangeWhere(filters, 'report_date');
  const [rows] = await pool.execute(
    `
      SELECT
        report_date AS date,
        COALESCE(SUM(new_registrations), 0) AS registrations,
        COALESCE(SUM(new_first_deposits), 0) AS first_deposits
      FROM kol_daily_consumption_summary
      ${whereClause}
      GROUP BY report_date
      ORDER BY report_date ASC
    `,
    params
  );

  return formatConversionRateTracking(
    rows,
    filters,
    'kol_daily_consumption_summary',
    qualityThreshold
  );
};

const getAgentPerformanceConversionRateTracking = async (filters = {}, qualityThreshold) => {
  const { whereClause, params } = buildAgentPerformanceWhere(filters);
  const [rows] = await pool.execute(
    `
      SELECT
        p.latest_payment_date AS date,
        COALESCE(SUM(p.registrations), 0) AS registrations,
        COALESCE(SUM(p.first_deposits), 0) AS first_deposits
      FROM kol_agent_daily_performance p
      INNER JOIN kol_agents a ON a.id = p.agent_id
      ${whereClause}
      GROUP BY p.latest_payment_date
      ORDER BY p.latest_payment_date ASC
    `,
    params
  );

  return formatConversionRateTracking(
    rows,
    filters,
    'kol_agent_daily_performance',
    qualityThreshold
  );
};

const formatDailyPerformanceTrendChart = (rows, filters) => {
  const dailyPoints = rows.map((row) => ({
    report_date: row.report_date,
    total_cost: roundMoney(row.total_cost),
    total_registrations: toCount(row.total_registrations),
    total_first_deposits: toCount(row.total_first_deposits),
    conversion_rate:
      row.conversion_rate === null || row.conversion_rate === undefined
        ? null
        : roundNumber(row.conversion_rate, 2)
  }));

  const totals = dailyPoints.reduce(
    (accumulator, row) => ({
      total_cost: accumulator.total_cost + row.total_cost,
      total_registrations: accumulator.total_registrations + row.total_registrations,
      total_first_deposits: accumulator.total_first_deposits + row.total_first_deposits
    }),
    {
      total_cost: 0,
      total_registrations: 0,
      total_first_deposits: 0
    }
  );

  return {
    filters: {
      start_date: filters.start_date || null,
      end_date: filters.end_date || null,
      content_category_id: filters.content_category_id || null,
      agent_id: filters.agent_id || null
    },
    source: 'kol_agent_daily_performance',
    chart: {
      key: 'daily_performance_trend_chart',
      title: 'Daily Performance Trend Chart',
      description:
        'Daily KOL agent performance trend grouped by latest payment date.',
      series: [
        {
          key: 'total_cost',
          label: 'Total cost',
          type: 'bar',
          value_format: 'currency'
        },
        {
          key: 'total_registrations',
          label: 'Total registrations',
          type: 'line',
          value_format: 'number'
        },
        {
          key: 'total_first_deposits',
          label: 'Total first deposits',
          type: 'line',
          value_format: 'number'
        },
        {
          key: 'conversion_rate',
          label: 'Conversion rate',
          type: 'line',
          value_format: 'percentage'
        }
      ]
    },
    period: {
      start_date: dailyPoints[0]?.report_date || null,
      end_date: dailyPoints[dailyPoints.length - 1]?.report_date || null,
      days_with_records: dailyPoints.length
    },
    summary: {
      total_cost: roundMoney(totals.total_cost),
      total_registrations: totals.total_registrations,
      total_first_deposits: totals.total_first_deposits,
      blended_conversion_rate:
        totals.total_registrations > 0
          ? roundNumber((totals.total_first_deposits / totals.total_registrations) * 100, 2)
          : null
    },
    daily_points: dailyPoints
  };
};

const getDailyPerformanceTrendChart = async (filters = {}) => {
  const normalizedFilters = normalizeFilters(filters);
  const { whereClause, params } = buildAgentPerformanceWhere(normalizedFilters);
  const [rows] = await pool.execute(
    `
      SELECT
        p.latest_payment_date AS report_date,
        COALESCE(SUM(p.cost), 0) AS total_cost,
        COALESCE(SUM(p.registrations), 0) AS total_registrations,
        COALESCE(SUM(p.first_deposits), 0) AS total_first_deposits,
        ROUND(
          (SUM(p.first_deposits) / NULLIF(SUM(p.registrations), 0)) * 100,
          2
        ) AS conversion_rate
      FROM kol_agent_daily_performance p
      INNER JOIN kol_agents a ON a.id = p.agent_id
      ${whereClause}
      GROUP BY p.latest_payment_date
      ORDER BY p.latest_payment_date ASC
    `,
    params
  );

  return formatDailyPerformanceTrendChart(rows, normalizedFilters);
};

const formatTopPerformingKol = (rows, filters) => {
  const records = rows.map((row, index) => ({
    rank: index + 1,
    agent_code: row.agent_code,
    category_name: row.category_name,
    total_cost: roundMoney(row.total_cost),
    total_registrations: toCount(row.total_registrations),
    total_first_deposits: toCount(row.total_first_deposits),
    cost_per_registration:
      row.cost_per_registration === null || row.cost_per_registration === undefined
        ? null
        : roundMoney(row.cost_per_registration),
    cost_per_first_deposit:
      row.cost_per_first_deposit === null || row.cost_per_first_deposit === undefined
        ? null
        : roundMoney(row.cost_per_first_deposit),
    conversion_rate:
      row.conversion_rate === null || row.conversion_rate === undefined
        ? null
        : roundNumber(row.conversion_rate, 2)
  }));

  const totals = records.reduce(
    (accumulator, row) => ({
      total_cost: accumulator.total_cost + row.total_cost,
      total_registrations: accumulator.total_registrations + row.total_registrations,
      total_first_deposits: accumulator.total_first_deposits + row.total_first_deposits
    }),
    {
      total_cost: 0,
      total_registrations: 0,
      total_first_deposits: 0
    }
  );

  return {
    filters: {
      start_date: filters.start_date || null,
      end_date: filters.end_date || null,
      content_category_id: filters.content_category_id || null,
      agent_id: filters.agent_id || null
    },
    source: 'kol_agent_daily_performance',
    table: {
      key: 'top_performing_kol',
      title: 'Top Performing KOL',
      description:
        'Ranked by conversion rate descending, then cost per first deposit ascending.',
      rank_order: [
        {
          key: 'conversion_rate',
          direction: 'desc'
        },
        {
          key: 'cost_per_first_deposit',
          direction: 'asc'
        }
      ],
      columns: [
        {
          key: 'rank',
          label: 'Rank',
          value_format: 'number'
        },
        {
          key: 'agent_code',
          label: 'Agent code',
          value_format: 'text'
        },
        {
          key: 'category_name',
          label: 'Category',
          value_format: 'text'
        },
        {
          key: 'total_cost',
          label: 'Total cost',
          value_format: 'currency'
        },
        {
          key: 'total_registrations',
          label: 'Total registrations',
          value_format: 'number'
        },
        {
          key: 'total_first_deposits',
          label: 'Total first deposits',
          value_format: 'number'
        },
        {
          key: 'cost_per_registration',
          label: 'Cost per registration',
          value_format: 'currency'
        },
        {
          key: 'cost_per_first_deposit',
          label: 'Cost per first deposit',
          value_format: 'currency'
        },
        {
          key: 'conversion_rate',
          label: 'Conversion rate',
          value_format: 'percentage'
        }
      ]
    },
    summary: {
      total_kols: records.length,
      total_cost: roundMoney(totals.total_cost),
      total_registrations: totals.total_registrations,
      total_first_deposits: totals.total_first_deposits,
      blended_conversion_rate:
        totals.total_registrations > 0
          ? roundNumber((totals.total_first_deposits / totals.total_registrations) * 100, 2)
          : null
    },
    records
  };
};

const getTopPerformingKol = async (filters = {}) => {
  const normalizedFilters = normalizeFilters(filters);
  const { whereClause, params } = buildAgentDailyPerformanceRollupWhere(normalizedFilters);
  const [rows] = await pool.execute(
    `
      SELECT
        a.agent_code,
        cc.category_name,
        SUM(adp.cost) AS total_cost,
        SUM(adp.registrations) AS total_registrations,
        SUM(adp.first_deposits) AS total_first_deposits,
        ROUND(SUM(adp.cost) / NULLIF(SUM(adp.registrations), 0), 2) AS cost_per_registration,
        ROUND(SUM(adp.cost) / NULLIF(SUM(adp.first_deposits), 0), 2) AS cost_per_first_deposit,
        ROUND((SUM(adp.first_deposits) / NULLIF(SUM(adp.registrations), 0)) * 100, 2) AS conversion_rate
      FROM kol_agent_daily_performance adp
      INNER JOIN kol_agents a ON adp.agent_id = a.id
      LEFT JOIN kol_content_categories cc ON a.content_category_id = cc.id
      ${whereClause}
      GROUP BY a.agent_code, cc.category_name
      HAVING SUM(adp.first_deposits) > 0
      ORDER BY conversion_rate DESC, cost_per_first_deposit ASC
    `,
    params
  );

  return formatTopPerformingKol(rows, normalizedFilters);
};

const formatCategoryPerformance = (rows, filters) => {
  const totals = rows.reduce(
    (accumulator, row) => ({
      total_cost: accumulator.total_cost + Number(row.total_cost || 0),
      total_registrations:
        accumulator.total_registrations + Number(row.total_registrations || 0),
      total_first_deposits:
        accumulator.total_first_deposits + Number(row.total_first_deposits || 0)
    }),
    {
      total_cost: 0,
      total_registrations: 0,
      total_first_deposits: 0
    }
  );

  const records = rows.map((row) => {
    const totalCost = roundMoney(row.total_cost);
    const totalRegistrations = toCount(row.total_registrations);
    const totalFirstDeposits = toCount(row.total_first_deposits);

    return {
      category_name: row.category_name,
      total_cost: totalCost,
      total_registrations: totalRegistrations,
      total_first_deposits: totalFirstDeposits,
      cost_per_registration:
        row.cost_per_registration === null || row.cost_per_registration === undefined
          ? null
          : roundMoney(row.cost_per_registration),
      cost_per_first_deposit:
        row.cost_per_first_deposit === null || row.cost_per_first_deposit === undefined
          ? null
          : roundMoney(row.cost_per_first_deposit),
      conversion_rate:
        row.conversion_rate === null || row.conversion_rate === undefined
          ? null
          : roundNumber(row.conversion_rate, 2),
      cost_share:
        totals.total_cost > 0 ? roundNumber((totalCost / totals.total_cost) * 100, 2) : 0,
      registration_share:
        totals.total_registrations > 0
          ? roundNumber((totalRegistrations / totals.total_registrations) * 100, 2)
          : 0,
      first_deposit_share:
        totals.total_first_deposits > 0
          ? roundNumber((totalFirstDeposits / totals.total_first_deposits) * 100, 2)
          : 0
    };
  });

  return {
    filters: {
      start_date: filters.start_date || null,
      end_date: filters.end_date || null,
      content_category_id: filters.content_category_id || null,
      agent_id: filters.agent_id || null
    },
    source: 'kol_agent_daily_performance',
    comparison: {
      key: 'category_performance',
      title: 'Category Performance',
      description:
        'Brand Content vs Influencer Content performance grouped by content category.',
      order_by: [
        {
          key: 'total_cost',
          direction: 'desc'
        }
      ],
      dimensions: [
        {
          key: 'category_name',
          label: 'Category'
        }
      ],
      metrics: [
        {
          key: 'total_cost',
          label: 'Total cost',
          value_format: 'currency'
        },
        {
          key: 'total_registrations',
          label: 'Total registrations',
          value_format: 'number'
        },
        {
          key: 'total_first_deposits',
          label: 'Total first deposits',
          value_format: 'number'
        },
        {
          key: 'cost_per_registration',
          label: 'Cost per registration',
          value_format: 'currency'
        },
        {
          key: 'cost_per_first_deposit',
          label: 'Cost per first deposit',
          value_format: 'currency'
        },
        {
          key: 'conversion_rate',
          label: 'Conversion rate',
          value_format: 'percentage'
        },
        {
          key: 'cost_share',
          label: 'Cost share',
          value_format: 'percentage'
        }
      ]
    },
    summary: {
      total_categories: records.length,
      total_cost: roundMoney(totals.total_cost),
      total_registrations: totals.total_registrations,
      total_first_deposits: totals.total_first_deposits,
      blended_cost_per_registration:
        totals.total_registrations > 0
          ? roundMoney(totals.total_cost / totals.total_registrations)
          : null,
      blended_cost_per_first_deposit:
        totals.total_first_deposits > 0
          ? roundMoney(totals.total_cost / totals.total_first_deposits)
          : null,
      blended_conversion_rate:
        totals.total_registrations > 0
          ? roundNumber((totals.total_first_deposits / totals.total_registrations) * 100, 2)
          : null,
      leading_category_by_cost: records[0]?.category_name || null
    },
    records
  };
};

const getCategoryPerformance = async (filters = {}) => {
  const normalizedFilters = normalizeFilters(filters);
  const { whereClause, params } = buildAgentDailyPerformanceRollupWhere(normalizedFilters);
  const [rows] = await pool.execute(
    `
      SELECT
        COALESCE(cc.category_name, 'Uncategorized') AS category_name,
        COALESCE(SUM(adp.cost), 0) AS total_cost,
        COALESCE(SUM(adp.registrations), 0) AS total_registrations,
        COALESCE(SUM(adp.first_deposits), 0) AS total_first_deposits,
        ROUND(SUM(adp.cost) / NULLIF(SUM(adp.registrations), 0), 2) AS cost_per_registration,
        ROUND(SUM(adp.cost) / NULLIF(SUM(adp.first_deposits), 0), 2) AS cost_per_first_deposit,
        ROUND((SUM(adp.first_deposits) / NULLIF(SUM(adp.registrations), 0)) * 100, 2) AS conversion_rate
      FROM kol_agent_daily_performance adp
      INNER JOIN kol_agents a ON adp.agent_id = a.id
      LEFT JOIN kol_content_categories cc ON a.content_category_id = cc.id
      ${whereClause}
      GROUP BY COALESCE(cc.category_name, 'Uncategorized')
      ORDER BY total_cost DESC
    `,
    params
  );

  return formatCategoryPerformance(rows, normalizedFilters);
};

const getContentAnalysisTitle = (categoryName) =>
  categoryName === 'Influencer Content' ? 'KOL / Influencer Content' : categoryName;

const formatContentAnalysisSummary = (totals) => ({
  total_agents: totals.total_agents,
  total_top_ups: totals.total_top_ups,
  total_cost: roundMoney(totals.total_cost),
  total_registrations: totals.total_registrations,
  total_deposits: totals.total_deposits,
  cost_per_registration:
    totals.total_registrations > 0
      ? roundMoney(totals.total_cost / totals.total_registrations)
      : null,
  cost_per_first_deposit:
    totals.total_deposits > 0 ? roundMoney(totals.total_cost / totals.total_deposits) : null,
  conversion_rate:
    totals.total_registrations > 0
      ? roundNumber((totals.total_deposits / totals.total_registrations) * 100, 2)
      : 0,
  alert_rows: totals.alert_rows
});

const formatContentAnalysis = (rows, filters) => {
  const sectionsByCategory = new Map();
  const overallTotals = {
    total_agents: 0,
    total_top_ups: 0,
    total_cost: 0,
    total_registrations: 0,
    total_deposits: 0,
    alert_rows: 0
  };

  rows.forEach((row) => {
    const categoryName = row.category_name || 'Uncategorized';

    if (!sectionsByCategory.has(categoryName)) {
      sectionsByCategory.set(categoryName, {
        category_name: categoryName,
        title: getContentAnalysisTitle(categoryName),
        agent_count: 0,
        summary: null,
        records: [],
        totals: {
          total_agents: 0,
          total_top_ups: 0,
          total_cost: 0,
          total_registrations: 0,
          total_deposits: 0,
          alert_rows: 0
        }
      });
    }

    const section = sectionsByCategory.get(categoryName);
    const cost = roundMoney(row.cost);
    const registrations = toCount(row.registrations);
    const deposits = toCount(row.deposits);
    const topUps = toCount(row.top_ups);
    const hasSpendWithoutDeposit = cost > 0 && deposits === 0;

    section.records.push({
      agent_code: row.agent_code,
      latest_payment_date: row.latest_payment_date,
      latest_payment_display: formatDisplayDate(row.latest_payment_date),
      top_ups: topUps,
      cost,
      registrations,
      deposits,
      cost_per_registration:
        row.cost_per_registration === null || row.cost_per_registration === undefined
          ? null
          : roundMoney(row.cost_per_registration),
      cost_per_first_deposit:
        row.cost_per_first_deposit === null || row.cost_per_first_deposit === undefined
          ? null
          : roundMoney(row.cost_per_first_deposit),
      conversion_rate:
        row.conversion_rate === null || row.conversion_rate === undefined
          ? null
          : roundNumber(row.conversion_rate, 2),
      has_spend_without_deposit: hasSpendWithoutDeposit,
      status: hasSpendWithoutDeposit ? 'spend_without_deposit' : 'normal'
    });

    section.totals.total_agents += 1;
    section.totals.total_top_ups += topUps;
    section.totals.total_cost += cost;
    section.totals.total_registrations += registrations;
    section.totals.total_deposits += deposits;
    section.totals.alert_rows += hasSpendWithoutDeposit ? 1 : 0;

    overallTotals.total_agents += 1;
    overallTotals.total_top_ups += topUps;
    overallTotals.total_cost += cost;
    overallTotals.total_registrations += registrations;
    overallTotals.total_deposits += deposits;
    overallTotals.alert_rows += hasSpendWithoutDeposit ? 1 : 0;
  });

  const sections = Array.from(sectionsByCategory.values()).map((section) => {
    const { totals, ...publicSection } = section;

    return {
      ...publicSection,
      agent_count: section.records.length,
      summary: formatContentAnalysisSummary(totals)
    };
  });

  return {
    filters: {
      start_date: filters.start_date || null,
      end_date: filters.end_date || null,
      content_category_id: filters.content_category_id || null,
      agent_id: filters.agent_id || null
    },
    source: 'kol_agent_daily_performance',
    table: {
      key: 'content_analysis',
      title: 'Content Analysis',
      description: 'Agent performance grouped by content category.',
      row_alert: {
        key: 'has_spend_without_deposit',
        description: 'Rows with spend and zero deposits should be highlighted.'
      },
      columns: [
        {
          key: 'agent_code',
          label: 'Agent ID',
          value_format: 'text'
        },
        {
          key: 'latest_payment_display',
          label: 'Latest Payment',
          value_format: 'date'
        },
        {
          key: 'top_ups',
          label: 'Top-ups',
          value_format: 'number'
        },
        {
          key: 'cost',
          label: 'Cost',
          value_format: 'currency'
        },
        {
          key: 'registrations',
          label: 'Reg.',
          value_format: 'number'
        },
        {
          key: 'deposits',
          label: 'Deposits',
          value_format: 'number'
        },
        {
          key: 'cost_per_registration',
          label: 'CPR',
          value_format: 'currency'
        },
        {
          key: 'cost_per_first_deposit',
          label: 'CPFD',
          value_format: 'currency'
        },
        {
          key: 'conversion_rate',
          label: 'Conv %',
          value_format: 'percentage'
        }
      ]
    },
    summary: {
      total_categories: sections.length,
      ...formatContentAnalysisSummary(overallTotals)
    },
    sections
  };
};

const getContentAnalysis = async (filters = {}) => {
  const normalizedFilters = normalizeFilters(filters);
  const { whereClause, params } = buildAgentDailyPerformanceRollupWhere(normalizedFilters);
  const [rows] = await pool.execute(
    `
      SELECT
        COALESCE(cc.category_name, 'Uncategorized') AS category_name,
        CASE
          WHEN cc.category_name = 'Brand Content' THEN 0
          WHEN cc.category_name = 'Influencer Content' THEN 1
          ELSE 2
        END AS category_sort,
        a.agent_code,
        DATE_FORMAT(MAX(adp.latest_payment_date), '%Y-%m-%d') AS latest_payment_date,
        COALESCE(SUM(adp.deposit_count), 0) AS top_ups,
        COALESCE(SUM(adp.cost), 0) AS cost,
        COALESCE(SUM(adp.registrations), 0) AS registrations,
        COALESCE(SUM(adp.first_deposits), 0) AS deposits,
        ROUND(SUM(adp.cost) / NULLIF(SUM(adp.registrations), 0), 2) AS cost_per_registration,
        ROUND(SUM(adp.cost) / NULLIF(SUM(adp.first_deposits), 0), 2) AS cost_per_first_deposit,
        ROUND((SUM(adp.first_deposits) / NULLIF(SUM(adp.registrations), 0)) * 100, 2) AS conversion_rate
      FROM kol_agent_daily_performance adp
      INNER JOIN kol_agents a ON adp.agent_id = a.id
      LEFT JOIN kol_content_categories cc ON a.content_category_id = cc.id
      ${whereClause}
      GROUP BY category_sort, COALESCE(cc.category_name, 'Uncategorized'), a.agent_code
      ORDER BY category_sort ASC, category_name ASC, latest_payment_date DESC, cost DESC
    `,
    params
  );

  return formatContentAnalysis(rows, normalizedFilters);
};

const formatCostEfficiencyPanel = (rows, filters) => {
  const records = rows.map((row) => ({
    agent_code: row.agent_code,
    total_cost: roundMoney(row.total_cost),
    total_registrations: toCount(row.total_registrations),
    total_first_deposits: toCount(row.total_first_deposits),
    cost_per_registration:
      row.cost_per_registration === null || row.cost_per_registration === undefined
        ? null
        : roundMoney(row.cost_per_registration),
    cost_per_first_deposit:
      row.cost_per_first_deposit === null || row.cost_per_first_deposit === undefined
        ? null
        : roundMoney(row.cost_per_first_deposit),
    conversion_rate:
      row.conversion_rate === null || row.conversion_rate === undefined
        ? null
        : roundNumber(row.conversion_rate, 2),
    performance_status: row.performance_status
  }));

  const totals = records.reduce(
    (accumulator, row) => {
      accumulator.total_cost += row.total_cost;
      accumulator.total_registrations += row.total_registrations;
      accumulator.total_first_deposits += row.total_first_deposits;
      accumulator.status_counts[row.performance_status] =
        (accumulator.status_counts[row.performance_status] || 0) + 1;

      return accumulator;
    },
    {
      total_cost: 0,
      total_registrations: 0,
      total_first_deposits: 0,
      status_counts: {}
    }
  );

  return {
    filters: {
      start_date: filters.start_date || null,
      end_date: filters.end_date || null,
      content_category_id: filters.content_category_id || null,
      agent_id: filters.agent_id || null
    },
    source: 'kol_agent_daily_performance',
    panel: {
      key: 'cost_efficiency_panel',
      title: 'Cost Efficiency Panel',
      question: 'Are we spending efficiently?',
      order_by: [
        {
          key: 'cost_per_first_deposit',
          direction: 'asc'
        }
      ],
      indicators: [
        {
          key: 'high_cost_low_first_deposits',
          label: 'High cost + low first deposits',
          meaning: 'Poor performance'
        },
        {
          key: 'low_cost_high_first_deposits',
          label: 'Low cost + high first deposits',
          meaning: 'Strong performance'
        },
        {
          key: 'high_registrations_low_deposits',
          label: 'High registrations + low deposits',
          meaning: 'Weak user quality'
        },
        {
          key: 'low_registration_cost_high_conversion',
          label: 'Low registration cost + high conversion',
          meaning: 'Best KOL traffic'
        }
      ],
      status_rules: [
        {
          status: 'Critical: Spend with no deposit',
          rule: 'first_deposits = 0 and cost > 0'
        },
        {
          status: 'Excellent',
          rule: 'cost_per_first_deposit <= 10'
        },
        {
          status: 'Good',
          rule: 'cost_per_first_deposit <= 20'
        },
        {
          status: 'Needs Review',
          rule: 'cost_per_first_deposit <= 50'
        },
        {
          status: 'High Cost',
          rule: 'cost_per_first_deposit > 50 or no efficiency threshold matched'
        }
      ],
      columns: [
        {
          key: 'agent_code',
          label: 'Agent code',
          value_format: 'text'
        },
        {
          key: 'total_cost',
          label: 'Total cost',
          value_format: 'currency'
        },
        {
          key: 'total_registrations',
          label: 'Total registrations',
          value_format: 'number'
        },
        {
          key: 'total_first_deposits',
          label: 'Total first deposits',
          value_format: 'number'
        },
        {
          key: 'cost_per_registration',
          label: 'Cost per registration',
          value_format: 'currency'
        },
        {
          key: 'cost_per_first_deposit',
          label: 'Cost per first deposit',
          value_format: 'currency'
        },
        {
          key: 'conversion_rate',
          label: 'Conversion rate',
          value_format: 'percentage'
        },
        {
          key: 'performance_status',
          label: 'Performance status',
          value_format: 'text'
        }
      ]
    },
    summary: {
      total_agents: records.length,
      total_cost: roundMoney(totals.total_cost),
      total_registrations: totals.total_registrations,
      total_first_deposits: totals.total_first_deposits,
      blended_cost_per_registration:
        totals.total_registrations > 0
          ? roundMoney(totals.total_cost / totals.total_registrations)
          : null,
      blended_cost_per_first_deposit:
        totals.total_first_deposits > 0
          ? roundMoney(totals.total_cost / totals.total_first_deposits)
          : null,
      blended_conversion_rate:
        totals.total_registrations > 0
          ? roundNumber((totals.total_first_deposits / totals.total_registrations) * 100, 2)
          : null,
      status_counts: totals.status_counts
    },
    records
  };
};

const getCostEfficiencyPanel = async (filters = {}) => {
  const normalizedFilters = normalizeFilters(filters);
  const { whereClause, params } = buildAgentDailyPerformanceRollupWhere(normalizedFilters);
  const [rows] = await pool.execute(
    `
      SELECT
        a.agent_code,
        SUM(adp.cost) AS total_cost,
        SUM(adp.registrations) AS total_registrations,
        SUM(adp.first_deposits) AS total_first_deposits,
        ROUND(SUM(adp.cost) / NULLIF(SUM(adp.registrations), 0), 2) AS cost_per_registration,
        ROUND(SUM(adp.cost) / NULLIF(SUM(adp.first_deposits), 0), 2) AS cost_per_first_deposit,
        ROUND((SUM(adp.first_deposits) / NULLIF(SUM(adp.registrations), 0)) * 100, 2) AS conversion_rate,
        CASE
          WHEN SUM(adp.first_deposits) = 0 AND SUM(adp.cost) > 0 THEN 'Critical: Spend with no deposit'
          WHEN SUM(adp.cost) / NULLIF(SUM(adp.first_deposits), 0) <= 10 THEN 'Excellent'
          WHEN SUM(adp.cost) / NULLIF(SUM(adp.first_deposits), 0) <= 20 THEN 'Good'
          WHEN SUM(adp.cost) / NULLIF(SUM(adp.first_deposits), 0) <= 50 THEN 'Needs Review'
          ELSE 'High Cost'
        END AS performance_status
      FROM kol_agent_daily_performance adp
      INNER JOIN kol_agents a ON adp.agent_id = a.id
      ${whereClause}
      GROUP BY a.agent_code
      ORDER BY cost_per_first_deposit ASC
    `,
    params
  );

  return formatCostEfficiencyPanel(rows, normalizedFilters);
};

const formatUnderperformingKolWatchlist = (rows, filters) => {
  const records = rows.map((row) => {
    const totalFirstDeposits = toCount(row.total_first_deposits);
    const conversionRate =
      row.conversion_rate === null || row.conversion_rate === undefined
        ? null
        : roundNumber(row.conversion_rate, 2);
    const hasNoFirstDeposits = totalFirstDeposits === 0;

    return {
      agent_code: row.agent_code,
      total_cost: roundMoney(row.total_cost),
      total_registrations: toCount(row.total_registrations),
      total_first_deposits: totalFirstDeposits,
      cost_per_registration:
        row.cost_per_registration === null || row.cost_per_registration === undefined
          ? null
          : roundMoney(row.cost_per_registration),
      cost_per_first_deposit:
        row.cost_per_first_deposit === null || row.cost_per_first_deposit === undefined
          ? null
          : roundMoney(row.cost_per_first_deposit),
      conversion_rate: conversionRate,
      watchlist_reason: hasNoFirstDeposits
        ? 'Spend with no first deposits'
        : 'Conversion below 20%',
      recommended_action: hasNoFirstDeposits
        ? 'Pause or review budget'
        : 'Review traffic quality'
    };
  });

  const totals = records.reduce(
    (accumulator, row) => {
      accumulator.total_cost += row.total_cost;
      accumulator.total_registrations += row.total_registrations;
      accumulator.total_first_deposits += row.total_first_deposits;

      if (row.total_first_deposits === 0) {
        accumulator.zero_deposit_kols += 1;
      } else if (row.conversion_rate !== null && row.conversion_rate < 20) {
        accumulator.low_conversion_kols += 1;
      }

      return accumulator;
    },
    {
      total_cost: 0,
      total_registrations: 0,
      total_first_deposits: 0,
      zero_deposit_kols: 0,
      low_conversion_kols: 0
    }
  );

  return {
    filters: {
      start_date: filters.start_date || null,
      end_date: filters.end_date || null,
      content_category_id: filters.content_category_id || null,
      agent_id: filters.agent_id || null
    },
    source: 'kol_agent_daily_performance',
    watchlist: {
      key: 'underperforming_kol_watchlist',
      title: 'Underperforming KOL Watchlist',
      description:
        'KOL agents with spend and either zero first deposits or conversion below 20%.',
      management_use:
        'Supports pause, review, or budget reduction decisions for inefficient KOL traffic.',
      criteria: [
        {
          key: 'has_spend',
          rule: 'total_cost > 0'
        },
        {
          key: 'no_first_deposits',
          rule: 'total_first_deposits = 0'
        },
        {
          key: 'low_conversion',
          rule: 'conversion_rate < 20'
        }
      ],
      order_by: [
        {
          key: 'total_cost',
          direction: 'desc'
        }
      ],
      columns: [
        {
          key: 'agent_code',
          label: 'Agent code',
          value_format: 'text'
        },
        {
          key: 'total_cost',
          label: 'Total cost',
          value_format: 'currency'
        },
        {
          key: 'total_registrations',
          label: 'Total registrations',
          value_format: 'number'
        },
        {
          key: 'total_first_deposits',
          label: 'Total first deposits',
          value_format: 'number'
        },
        {
          key: 'cost_per_registration',
          label: 'Cost per registration',
          value_format: 'currency'
        },
        {
          key: 'cost_per_first_deposit',
          label: 'Cost per first deposit',
          value_format: 'currency'
        },
        {
          key: 'conversion_rate',
          label: 'Conversion rate',
          value_format: 'percentage'
        },
        {
          key: 'watchlist_reason',
          label: 'Watchlist reason',
          value_format: 'text'
        },
        {
          key: 'recommended_action',
          label: 'Recommended action',
          value_format: 'text'
        }
      ]
    },
    summary: {
      total_kols: records.length,
      total_cost_at_risk: roundMoney(totals.total_cost),
      total_registrations: totals.total_registrations,
      total_first_deposits: totals.total_first_deposits,
      zero_deposit_kols: totals.zero_deposit_kols,
      low_conversion_kols: totals.low_conversion_kols,
      blended_cost_per_registration:
        totals.total_registrations > 0
          ? roundMoney(totals.total_cost / totals.total_registrations)
          : null,
      blended_cost_per_first_deposit:
        totals.total_first_deposits > 0
          ? roundMoney(totals.total_cost / totals.total_first_deposits)
          : null,
      blended_conversion_rate:
        totals.total_registrations > 0
          ? roundNumber((totals.total_first_deposits / totals.total_registrations) * 100, 2)
          : null,
      highest_cost_agent: records[0]?.agent_code || null
    },
    records
  };
};

const getUnderperformingKolWatchlist = async (filters = {}) => {
  const normalizedFilters = normalizeFilters(filters);
  const { whereClause, params } = buildAgentDailyPerformanceRollupWhere(normalizedFilters);
  const [rows] = await pool.execute(
    `
      SELECT
        a.agent_code,
        SUM(adp.cost) AS total_cost,
        SUM(adp.registrations) AS total_registrations,
        SUM(adp.first_deposits) AS total_first_deposits,
        ROUND(SUM(adp.cost) / NULLIF(SUM(adp.registrations), 0), 2) AS cost_per_registration,
        ROUND(SUM(adp.cost) / NULLIF(SUM(adp.first_deposits), 0), 2) AS cost_per_first_deposit,
        ROUND((SUM(adp.first_deposits) / NULLIF(SUM(adp.registrations), 0)) * 100, 2) AS conversion_rate
      FROM kol_agent_daily_performance adp
      INNER JOIN kol_agents a ON adp.agent_id = a.id
      ${whereClause}
      GROUP BY a.agent_code
      HAVING
        SUM(adp.cost) > 0
        AND (
          SUM(adp.first_deposits) = 0
          OR ROUND((SUM(adp.first_deposits) / NULLIF(SUM(adp.registrations), 0)) * 100, 2) < 20
        )
      ORDER BY total_cost DESC
    `,
    params
  );

  return formatUnderperformingKolWatchlist(rows, normalizedFilters);
};

const formatDailyPerformanceSummary = (row) => {
  const cost = roundMoney(row.cost);
  const registrations = toCount(row.registrations);
  const firstDeposits = toCount(row.first_deposits);

  return {
    cost,
    registrations,
    first_deposits: firstDeposits,
    cost_per_registration:
      cost > 0 && registrations > 0 ? roundMoney(cost / registrations) : null,
    cost_per_first_deposit:
      cost > 0 && firstDeposits > 0 ? roundMoney(cost / firstDeposits) : null,
    conversion:
      registrations > 0 ? roundNumber((firstDeposits / registrations) * 100, 2) : 0
  };
};

const formatDailyPerformanceRow = (row) => {
  const summary = formatDailyPerformanceSummary(row);
  const hasSpendWithoutFirstDeposit = summary.cost > 0 && summary.first_deposits === 0;

  return {
    date: row.date,
    display_date: formatDisplayDate(row.date),
    ...summary,
    has_spend_without_first_deposit: hasSpendWithoutFirstDeposit,
    status: hasSpendWithoutFirstDeposit ? 'spend_without_first_deposit' : 'normal'
  };
};

const formatKolDailyPerformance = ({
  rows,
  summaryRow,
  totalRecords,
  filters,
  source,
  pagination,
  sort
}) => {
  const records = rows.map(formatDailyPerformanceRow);
  const totalPages = totalRecords > 0 ? Math.ceil(totalRecords / pagination.per_page) : 0;
  const fromRecord =
    totalRecords === 0 || records.length === 0 ? 0 : pagination.offset + 1;
  const toRecord = records.length === 0 ? 0 : pagination.offset + records.length;

  return {
    filters: {
      start_date: filters.start_date || null,
      end_date: filters.end_date || null,
      content_category_id: filters.content_category_id || null,
      agent_id: filters.agent_id || null
    },
    source,
    table: {
      key: 'kol_daily_performance',
      title: 'KOL daily performance',
      description: 'Source of truth - sort any column. Rows in red had spend with zero first deposits.',
      columns: [
        {
          key: 'date',
          label: 'Date',
          value_format: 'date',
          sortable: true
        },
        {
          key: 'cost',
          label: 'Cost',
          value_format: 'currency',
          sortable: true
        },
        {
          key: 'registrations',
          label: 'Registrations',
          value_format: 'number',
          sortable: true
        },
        {
          key: 'first_deposits',
          label: 'First deposits',
          value_format: 'number',
          sortable: true
        },
        {
          key: 'cost_per_registration',
          label: 'Cost per registration',
          value_format: 'currency',
          sortable: true,
          null_display: '-'
        },
        {
          key: 'cost_per_first_deposit',
          label: 'Cost per first deposit',
          value_format: 'currency',
          sortable: true,
          null_display: '-'
        },
        {
          key: 'conversion',
          label: 'Conversion',
          value_format: 'percentage',
          sortable: true
        }
      ]
    },
    period: {
      start_date: summaryRow.data_start_date || null,
      end_date: summaryRow.data_end_date || null,
      days_with_records: Number(summaryRow.days_with_records || 0)
    },
    totals: formatDailyPerformanceSummary(summaryRow),
    sort,
    pagination: {
      page: pagination.page,
      per_page: pagination.per_page,
      total_records: totalRecords,
      total_pages: totalPages,
      from_record: fromRecord,
      to_record: toRecord,
      showing_label:
        records.length === 0
          ? `Showing 0-0 of ${totalRecords}`
          : `Showing ${fromRecord}-${toRecord} of ${totalRecords}`
    },
    records
  };
};

const getConsumptionKolDailyPerformance = async (filters = {}, pagination, sort) => {
  const { whereClause, params } = buildDateRangeWhere(filters, 'report_date');
  const orderBy = buildDailyPerformanceOrderBy(sort);
  const [rows] = await pool.execute(
    `
      SELECT
        date,
        cost,
        registrations,
        first_deposits,
        CASE
          WHEN cost > 0 AND registrations > 0 THEN cost / registrations
          ELSE NULL
        END AS cost_per_registration,
        CASE
          WHEN cost > 0 AND first_deposits > 0 THEN cost / first_deposits
          ELSE NULL
        END AS cost_per_first_deposit,
        CASE
          WHEN registrations > 0 THEN (first_deposits / registrations) * 100
          ELSE 0
        END AS conversion
      FROM (
        SELECT
          report_date AS date,
          COALESCE(SUM(total_cost), 0) AS cost,
          COALESCE(SUM(new_registrations), 0) AS registrations,
          COALESCE(SUM(new_first_deposits), 0) AS first_deposits
        FROM kol_daily_consumption_summary
        ${whereClause}
        GROUP BY report_date
      ) daily
      ORDER BY ${orderBy}
      LIMIT ${pagination.per_page}
      OFFSET ${pagination.offset}
    `,
    params
  );

  const [summaryRows] = await pool.execute(
    `
      SELECT
        COALESCE(SUM(total_cost), 0) AS cost,
        COALESCE(SUM(new_registrations), 0) AS registrations,
        COALESCE(SUM(new_first_deposits), 0) AS first_deposits,
        MIN(report_date) AS data_start_date,
        MAX(report_date) AS data_end_date,
        COUNT(DISTINCT report_date) AS days_with_records
      FROM kol_daily_consumption_summary
      ${whereClause}
    `,
    params
  );

  return formatKolDailyPerformance({
    rows,
    summaryRow: summaryRows[0],
    totalRecords: Number(summaryRows[0].days_with_records || 0),
    filters,
    source: 'kol_daily_consumption_summary',
    pagination,
    sort
  });
};

const getAgentPerformanceKolDailyPerformance = async (filters = {}, pagination, sort) => {
  const { whereClause, params } = buildAgentPerformanceWhere(filters);
  const orderBy = buildDailyPerformanceOrderBy(sort);
  const [rows] = await pool.execute(
    `
      SELECT
        date,
        cost,
        registrations,
        first_deposits,
        CASE
          WHEN cost > 0 AND registrations > 0 THEN cost / registrations
          ELSE NULL
        END AS cost_per_registration,
        CASE
          WHEN cost > 0 AND first_deposits > 0 THEN cost / first_deposits
          ELSE NULL
        END AS cost_per_first_deposit,
        CASE
          WHEN registrations > 0 THEN (first_deposits / registrations) * 100
          ELSE 0
        END AS conversion
      FROM (
        SELECT
          p.latest_payment_date AS date,
          COALESCE(SUM(p.cost), 0) AS cost,
          COALESCE(SUM(p.registrations), 0) AS registrations,
          COALESCE(SUM(p.first_deposits), 0) AS first_deposits
        FROM kol_agent_daily_performance p
        INNER JOIN kol_agents a ON a.id = p.agent_id
        ${whereClause}
        GROUP BY p.latest_payment_date
      ) daily
      ORDER BY ${orderBy}
      LIMIT ${pagination.per_page}
      OFFSET ${pagination.offset}
    `,
    params
  );

  const [summaryRows] = await pool.execute(
    `
      SELECT
        COALESCE(SUM(p.cost), 0) AS cost,
        COALESCE(SUM(p.registrations), 0) AS registrations,
        COALESCE(SUM(p.first_deposits), 0) AS first_deposits,
        MIN(p.latest_payment_date) AS data_start_date,
        MAX(p.latest_payment_date) AS data_end_date,
        COUNT(DISTINCT p.latest_payment_date) AS days_with_records
      FROM kol_agent_daily_performance p
      INNER JOIN kol_agents a ON a.id = p.agent_id
      ${whereClause}
    `,
    params
  );

  return formatKolDailyPerformance({
    rows,
    summaryRow: summaryRows[0],
    totalRecords: Number(summaryRows[0].days_with_records || 0),
    filters,
    source: 'kol_agent_daily_performance',
    pagination,
    sort
  });
};

const formatAcquisitionUnitCosts = (rows, filters, source, targets) => {
  const monthlyPoints = rows.map((row) => {
    const totalCost = roundMoney(row.total_cost);
    const registrations = toCount(row.registrations);
    const firstDeposits = toCount(row.first_deposits);
    const costPerRegistration =
      registrations > 0 ? roundMoney(totalCost / registrations) : null;
    const costPerFirstDeposit =
      firstDeposits > 0 ? roundMoney(totalCost / firstDeposits) : null;
    const exceedsRegistrationTarget =
      costPerRegistration === null
        ? totalCost > 0
        : costPerRegistration > targets.cost_per_registration;
    const exceedsFirstDepositTarget =
      costPerFirstDeposit === null
        ? totalCost > 0
        : costPerFirstDeposit > targets.cost_per_first_deposit;
    const hasElevatedUnitCosts = exceedsRegistrationTarget || exceedsFirstDepositTarget;

    return {
      month: row.month_key,
      label: formatMonthDayLabel(row.period_end_date),
      period_start_date: row.period_start_date,
      period_end_date: row.period_end_date,
      data_end_date: row.data_end_date,
      days_with_records: Number(row.days_with_records || 0),
      total_cost: totalCost,
      registrations,
      first_deposits: firstDeposits,
      cost_per_registration: costPerRegistration,
      cost_per_first_deposit: costPerFirstDeposit,
      exceeds_cost_per_registration_target: exceedsRegistrationTarget,
      exceeds_cost_per_first_deposit_target: exceedsFirstDepositTarget,
      has_elevated_unit_costs: hasElevatedUnitCosts,
      status: hasElevatedUnitCosts ? 'elevated' : 'within_target'
    };
  });
  const elevatedMonthCount = monthlyPoints.filter((row) => row.has_elevated_unit_costs).length;

  return {
    filters: {
      start_date: filters.start_date || null,
      end_date: filters.end_date || null,
      content_category_id: filters.content_category_id || null,
      agent_id: filters.agent_id || null
    },
    source,
    chart: {
      key: 'acquisition_unit_costs',
      title: 'Acquisition unit costs',
      description:
        'Mid-month basis (days 1-15): blended CPR and CPFD by calendar month. Lower is better; red bars exceed targets.',
      basis: {
        period: 'calendar_month',
        day_start: MID_MONTH_DAY_START,
        day_end: MID_MONTH_DAY_END
      },
      series: [
        {
          key: 'cost_per_first_deposit',
          label: 'Cost per first deposit',
          type: 'bar',
          value_format: 'currency',
          target: targets.cost_per_first_deposit
        },
        {
          key: 'cost_per_registration',
          label: 'Cost per registration',
          type: 'bar',
          value_format: 'currency',
          target: targets.cost_per_registration
        }
      ]
    },
    targets,
    period: {
      start_month: monthlyPoints[0]?.month || null,
      end_month: monthlyPoints[monthlyPoints.length - 1]?.month || null,
      months_with_records: monthlyPoints.length
    },
    alert: {
      elevated_month_count: elevatedMonthCount,
      message: `${elevatedMonthCount} month(s) with elevated unit costs in this window.`
    },
    monthly_points: monthlyPoints
  };
};

const getConsumptionAcquisitionUnitCosts = async (filters = {}, targets) => {
  const { whereClause, params } = buildMidMonthConsumptionWhere(filters);
  const [rows] = await pool.execute(
    `
      SELECT
        month_key,
        CONCAT(month_key, '-15') AS period_end_date,
        MIN(report_date) AS period_start_date,
        MAX(report_date) AS data_end_date,
        COUNT(DISTINCT report_date) AS days_with_records,
        COALESCE(SUM(total_cost), 0) AS total_cost,
        COALESCE(SUM(new_registrations), 0) AS registrations,
        COALESCE(SUM(new_first_deposits), 0) AS first_deposits
      FROM (
        SELECT
          DATE_FORMAT(report_date, '%Y-%m') AS month_key,
          report_date,
          total_cost,
          new_registrations,
          new_first_deposits
        FROM kol_daily_consumption_summary
        ${whereClause}
      ) monthly
      GROUP BY month_key
      ORDER BY month_key ASC
    `,
    params
  );

  return formatAcquisitionUnitCosts(
    rows,
    filters,
    'kol_daily_consumption_summary',
    targets
  );
};

const getAgentPerformanceAcquisitionUnitCosts = async (filters = {}, targets) => {
  const { whereClause, params } = buildMidMonthAgentPerformanceWhere(filters);
  const [rows] = await pool.execute(
    `
      SELECT
        month_key,
        CONCAT(month_key, '-15') AS period_end_date,
        MIN(report_date) AS period_start_date,
        MAX(report_date) AS data_end_date,
        COUNT(DISTINCT report_date) AS days_with_records,
        COALESCE(SUM(total_cost), 0) AS total_cost,
        COALESCE(SUM(registrations), 0) AS registrations,
        COALESCE(SUM(first_deposits), 0) AS first_deposits
      FROM (
        SELECT
          DATE_FORMAT(p.latest_payment_date, '%Y-%m') AS month_key,
          p.latest_payment_date AS report_date,
          p.cost AS total_cost,
          p.registrations,
          p.first_deposits
        FROM kol_agent_daily_performance p
        INNER JOIN kol_agents a ON a.id = p.agent_id
        ${whereClause}
      ) monthly
      GROUP BY month_key
      ORDER BY month_key ASC
    `,
    params
  );

  return formatAcquisitionUnitCosts(
    rows,
    filters,
    'kol_agent_daily_performance',
    targets
  );
};

const getSummary = async (filters = {}) => {
  const normalizedFilters = normalizeFilters(filters);

  if (hasAgentScope(normalizedFilters)) {
    return getAgentPerformanceSummary(normalizedFilters);
  }

  return getConsumptionSummary(normalizedFilters);
};

const getSpendAcquisitionVolume = async (filters = {}) => {
  const normalizedFilters = normalizeFilters(filters);

  if (hasAgentScope(normalizedFilters)) {
    return getAgentPerformanceSpendAcquisitionVolume(normalizedFilters);
  }

  return getConsumptionSpendAcquisitionVolume(normalizedFilters);
};

const getConversionRateTracking = async (filters = {}) => {
  const normalizedFilters = normalizeFilters(filters);
  const qualityThreshold = normalizeConversionQualityThreshold(filters);

  if (hasAgentScope(normalizedFilters)) {
    return getAgentPerformanceConversionRateTracking(normalizedFilters, qualityThreshold);
  }

  return getConsumptionConversionRateTracking(normalizedFilters, qualityThreshold);
};

const getKolDailyPerformance = async (filters = {}) => {
  const normalizedFilters = normalizeFilters(filters);
  const pagination = normalizeDailyPerformancePagination(filters);
  const sort = normalizeDailyPerformanceSort(filters);

  if (hasAgentScope(normalizedFilters)) {
    return getAgentPerformanceKolDailyPerformance(normalizedFilters, pagination, sort);
  }

  return getConsumptionKolDailyPerformance(normalizedFilters, pagination, sort);
};

const getAcquisitionUnitCosts = async (filters = {}) => {
  const normalizedFilters = normalizeFilters(filters);
  const targets = normalizeUnitCostTargets(filters);

  if (hasAgentScope(normalizedFilters)) {
    return getAgentPerformanceAcquisitionUnitCosts(normalizedFilters, targets);
  }

  return getConsumptionAcquisitionUnitCosts(normalizedFilters, targets);
};

const getKpiCards = async (filters = {}) => {
  const summary = await getSummary(filters);

  return {
    filters: summary.filters,
    source: summary.source,
    period: summary.period,
    totals: summary.totals,
    cards: summary.cards
  };
};

const getDashboardData = async (filters = {}) => {
  const [
    summary,
    agentKpiCards,
    spendAcquisitionVolume,
    conversionRateTracking,
    dailyPerformanceTrendChart,
    topPerformingKol,
    categoryPerformance,
    contentAnalysis,
    costEfficiencyPanel,
    underperformingKolWatchlist,
    kolDailyPerformance,
    acquisitionUnitCosts
  ] = await Promise.all([
    getSummary(filters),
    getAgentKpiCards(filters),
    getSpendAcquisitionVolume(filters),
    getConversionRateTracking(filters),
    getDailyPerformanceTrendChart(filters),
    getTopPerformingKol(filters),
    getCategoryPerformance(filters),
    getContentAnalysis(filters),
    getCostEfficiencyPanel(filters),
    getUnderperformingKolWatchlist(filters),
    getKolDailyPerformance(filters),
    getAcquisitionUnitCosts(filters)
  ]);

  return {
    summary,
    agent_kpi_cards: agentKpiCards,
    spend_acquisition_volume: spendAcquisitionVolume,
    conversion_rate_tracking: conversionRateTracking,
    daily_performance_trend_chart: dailyPerformanceTrendChart,
    top_performing_kol: topPerformingKol,
    category_performance: categoryPerformance,
    content_analysis: contentAnalysis,
    cost_efficiency_panel: costEfficiencyPanel,
    underperforming_kol_watchlist: underperformingKolWatchlist,
    kol_daily_performance: kolDailyPerformance,
    acquisition_unit_costs: acquisitionUnitCosts
  };
};

module.exports = {
  getSummary,
  getSpendAcquisitionVolume,
  getConversionRateTracking,
  getDailyPerformanceTrendChart,
  getTopPerformingKol,
  getCategoryPerformance,
  getContentAnalysis,
  getCostEfficiencyPanel,
  getUnderperformingKolWatchlist,
  getKolDailyPerformance,
  getAcquisitionUnitCosts,
  getKpiCards,
  getAgentKpiCards,
  getDashboardData
};
