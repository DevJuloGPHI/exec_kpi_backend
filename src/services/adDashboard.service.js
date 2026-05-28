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

const MEDIA_PIPELINE_ONBOARDING_DAYS = 14;

const MEDIA_PIPELINE_STAGE_STATUS_CODES = {
  NEGOTIATION: ['NEGOTIATION', 'NEGOTIATING', 'CONTRACT_SENT_TO_LEGAL', 'PENDING'],
  FOR_PAYMENT: [
    'FOR_PAYMENT',
    'PAYMENT_50',
    'PAID',
    'PENDING_BILLING',
    'PENDING_PAYMENT',
    'UNPAID',
    'PARTIAL'
  ],
  ACTIVE: ['ACTIVE', 'ACTIVATED']
};

const MEDIA_PIPELINE_STAGES = [
  {
    stage_code: 'NEGOTIATION',
    stage_name: 'Negotiation',
    sort_order: 1,
    color_hex: '#A3A3AD',
    status_codes: MEDIA_PIPELINE_STAGE_STATUS_CODES.NEGOTIATION
  },
  {
    stage_code: 'FOR_PAYMENT',
    stage_name: 'For payment',
    sort_order: 2,
    color_hex: '#F59E0B',
    status_codes: MEDIA_PIPELINE_STAGE_STATUS_CODES.FOR_PAYMENT
  },
  {
    stage_code: 'ONBOARDING',
    stage_name: 'Onboarding',
    sort_order: 3,
    color_hex: '#3F63D8',
    status_codes: MEDIA_PIPELINE_STAGE_STATUS_CODES.ACTIVE,
    date_rule: `start_date is within the last ${MEDIA_PIPELINE_ONBOARDING_DAYS} days`
  },
  {
    stage_code: 'ACTIVATED',
    stage_name: 'Activated',
    sort_order: 4,
    color_hex: '#19B987',
    status_codes: MEDIA_PIPELINE_STAGE_STATUS_CODES.ACTIVE,
    date_rule: `start_date is older than ${MEDIA_PIPELINE_ONBOARDING_DAYS} days`
  }
];

const MEDIA_PIPELINE_OTHER_STAGE = {
  stage_code: 'OTHER',
  stage_name: 'Other',
  sort_order: 5,
  color_hex: '#6B7280',
  status_codes: []
};

const toNumber = (value) => Number(value || 0);

const calculatePercentage = (value, total) => {
  const numericValue = toNumber(value);
  const numericTotal = toNumber(total);

  if (numericTotal === 0) {
    return 0;
  }

  return Number(((numericValue / numericTotal) * 100).toFixed(2));
};

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

const mapKpiBreakdownBase = (row) => ({
  channel_id: Number(row.channel_id),
  channel_code: row.channel_code,
  channel_name: row.channel_name,
  group_code: row.group_code,
  group_name: row.group_name
});

const mapGroupAdsSummaryRow = (row) => ({
  group_name: row.group_name,
  total_spend: toNumber(row.total_spend),
  total_registrations: Number(row.total_registrations || 0),
  total_first_deposits: Number(row.total_first_deposits || 0),
  cpr: toNumber(row.cpr),
  cpd: toNumber(row.cpd),
  conversion_rate: toNumber(row.conversion_rate)
});

const mapGeneralTotalAdsRow = (row) => ({
  total_type: row.total_type,
  total_spend: toNumber(row.total_spend),
  total_registrations: Number(row.total_registrations || 0),
  total_first_deposits: Number(row.total_first_deposits || 0),
  cpr: toNumber(row.cpr),
  cpd: toNumber(row.cpd),
  conversion_rate: toNumber(row.conversion_rate)
});

const mapVendorCollaborationRow = (row) => ({
  vendor_name: row.vendor_name,
  website_url: row.website_url,
  assignee_name: row.assignee_name,
  status_name: row.status_name,
  campaign_name: row.campaign_name,
  total_amount_raw: row.total_amount_raw,
  amount_value: toNumber(row.amount_value),
  currency_code: row.currency_code,
  start_date: row.start_date,
  end_date: row.end_date,
  days_remaining: row.days_remaining === null ? null : Number(row.days_remaining),
  campaign_health: row.campaign_health
});

const mapMediaProfessionalRow = (row) => ({
  partner_platform: row.partner_platform,
  platform_type: row.platform_type,
  website_app: row.website_app,
  partnership_status: row.partnership_status,
  partnership_name: row.partnership_name,
  partnership_start_date: row.partnership_start_date,
  partnership_end_date: row.partnership_end_date,
  renewal_date: row.renewal_date,
  person_in_charge: row.person_in_charge,
  total_cost: toNumber(row.total_cost),
  ad_placements: row.ad_placements,
  tracking_codes: row.tracking_codes,
  promotion_link: row.promotion_link,
  remarks: row.remarks,
  payment_status: row.payment_status,
  impressions: Number(row.impressions || 0),
  clicks: Number(row.clicks || 0),
  registrations: Number(row.registrations || 0),
  first_deposits: Number(row.first_deposits || 0),
  spend: toNumber(row.spend),
  revenue: toNumber(row.revenue),
  ctr: toNumber(row.ctr),
  roi: toNumber(row.roi),
  partnership_health: row.partnership_health
});

const mapFinancialExposureRow = (row) => ({
  vendor_name: row.vendor_name,
  website_url: row.website_url,
  total_spend_usd: toNumber(row.total_spend_usd),
  original_amounts: row.original_amounts,
  currency_codes: row.currency_codes,
  status_names: row.status_names,
  campaign_count: Number(row.campaign_count || 0),
  latest_start_date: row.latest_start_date,
  latest_end_date: row.latest_end_date,
  days_remaining: row.days_remaining === null ? null : Number(row.days_remaining),
  status: row.campaign_health,
  campaign_health: row.campaign_health
});

const normalizeStatusCode = (statusCode) => String(statusCode || '').toUpperCase();

const getMediaPipelineStageCode = (row, onboardingStartDate) => {
  const statusCode = normalizeStatusCode(row.status_code);

  if (MEDIA_PIPELINE_STAGE_STATUS_CODES.NEGOTIATION.includes(statusCode)) {
    return 'NEGOTIATION';
  }

  if (MEDIA_PIPELINE_STAGE_STATUS_CODES.FOR_PAYMENT.includes(statusCode)) {
    return 'FOR_PAYMENT';
  }

  if (MEDIA_PIPELINE_STAGE_STATUS_CODES.ACTIVE.includes(statusCode)) {
    if (row.start_date && row.start_date >= onboardingStartDate) {
      return 'ONBOARDING';
    }

    return 'ACTIVATED';
  }

  return 'OTHER';
};

const getMediaPipelineStageCodesForStatus = (statusCode) => {
  const normalizedStatusCode = normalizeStatusCode(statusCode);

  if (MEDIA_PIPELINE_STAGE_STATUS_CODES.NEGOTIATION.includes(normalizedStatusCode)) {
    return ['NEGOTIATION'];
  }

  if (MEDIA_PIPELINE_STAGE_STATUS_CODES.FOR_PAYMENT.includes(normalizedStatusCode)) {
    return ['FOR_PAYMENT'];
  }

  if (MEDIA_PIPELINE_STAGE_STATUS_CODES.ACTIVE.includes(normalizedStatusCode)) {
    return ['ONBOARDING', 'ACTIVATED'];
  }

  return ['OTHER'];
};

const mapMediaPipelineItem = (row) => ({
  partnership_id: Number(row.partnership_id),
  platform_id: Number(row.platform_id),
  platform_name: row.platform_name,
  website_url: row.website_url,
  platform_type: row.platform_type,
  partnership_name: row.partnership_name,
  partnership_status: row.status_name,
  status_code: row.status_code,
  start_date: row.start_date,
  end_date: row.end_date,
  renewal_date: row.renewal_date,
  person_in_charge: row.person_in_charge
});

const mapMediaPipelineStage = (stage, rows) => {
  const platformIds = new Set(rows.map((row) => Number(row.platform_id)));

  return {
    ...stage,
    vendor_count: platformIds.size,
    partnership_count: rows.length,
    vendors: rows.map(mapMediaPipelineItem)
  };
};

const mapMediaPipelineStatusBreakdown = (row, stageNameByCode) => {
  const pipelineStageCodes = getMediaPipelineStageCodesForStatus(row.status_code);

  return {
    status_code: row.status_code,
    status_name: row.status_name,
    vendor_count: Number(row.vendor_count || 0),
    partnership_count: Number(row.partnership_count || 0),
    pipeline_stage_codes: pipelineStageCodes,
    pipeline_stage_names: pipelineStageCodes.map((stageCode) => stageNameByCode[stageCode] || stageCode)
  };
};

const mapFxRates = (rows) =>
  rows.reduce((rates, row) => {
    rates[row.currency_code] = toNumber(row.rate_to_usd);
    return rates;
  }, {});

const padDatePart = (value) => String(value).padStart(2, '0');

const toDateOnlyString = (date) =>
  `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;

const parseDateOnly = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const addDays = (date, days) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const getDefaultTimelineDateRange = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const startDate = addDays(today, mondayOffset);
  const endDate = addDays(startDate, 4);

  return {
    start_date: toDateOnlyString(startDate),
    end_date: toDateOnlyString(endDate)
  };
};

const formatDisplayDate = (dateString) => {
  const date = parseDateOnly(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate();
  const suffix = day % 10 === 1 && day !== 11
    ? 'st'
    : day % 10 === 2 && day !== 12
      ? 'nd'
      : day % 10 === 3 && day !== 13
        ? 'rd'
        : 'th';

  return `${months[date.getMonth()]} ${day}${suffix}, ${date.getFullYear()}`;
};

const formatMonthYear = (dateString) => {
  const date = parseDateOnly(dateString);
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];

  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

const formatDateWindow = (startDate, endDate) => {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `${months[start.getMonth()]} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
  }

  return `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
};

const getTimelineBadge = (dateString, startDate, endDate) => {
  const today = toDateOnlyString(new Date());

  if (dateString === today) {
    return 'Today';
  }

  if (dateString >= startDate && dateString <= endDate) {
    return 'This week';
  }

  return dateString < today ? 'Past' : 'Upcoming';
};

const mapMediaTimelineEventRow = (row, startDate, endDate) => ({
  id: row.event_id,
  date: row.event_date,
  source: row.event_source,
  event_type: row.event_type,
  platform_name: row.platform_name,
  partnership_name: row.partnership_name,
  partnership_status: row.partnership_status,
  person_in_charge: row.person_in_charge,
  title: row.title,
  description: row.description,
  amount: row.amount === null ? null : toNumber(row.amount),
  currency_code: row.currency_code,
  badge: getTimelineBadge(row.event_date, startDate, endDate)
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
  const joinConditions = ['dp.channel_id = c.id'];
  const params = [];

  if (filters.start_date) {
    joinConditions.push('dp.report_date >= ?');
    params.push(filters.start_date);
  }

  if (filters.end_date) {
    joinConditions.push('dp.report_date <= ?');
    params.push(filters.end_date);
  }

  const [breakdownRows] = await pool.execute(
    `
      SELECT
        c.id AS channel_id,
        c.channel_code,
        c.channel_name,
        cg.group_code,
        cg.group_name,
        COALESCE(SUM(dp.spend), 0) AS total_spend,
        COALESCE(SUM(dp.registrations), 0) AS total_registrations,
        COALESCE(SUM(dp.first_deposits), 0) AS total_deposits
      FROM ad_channels c
      INNER JOIN ad_channel_groups cg
        ON c.channel_group_id = cg.id
      LEFT JOIN ad_daily_performance dp
        ON ${joinConditions.join(' AND ')}
      WHERE c.is_active = TRUE
      GROUP BY
        c.id,
        c.channel_code,
        c.channel_name,
        cg.group_code,
        cg.group_name
      ORDER BY
        FIELD(cg.group_code, 'SELF_RUN', 'THIRD_PARTY'),
        c.channel_name ASC
    `,
    params
  );

  const totalSpend = breakdownRows.reduce(
    (sum, breakdownRow) => sum + toNumber(breakdownRow.total_spend),
    0
  );
  const totalRegistrations = breakdownRows.reduce(
    (sum, breakdownRow) => sum + Number(breakdownRow.total_registrations || 0),
    0
  );
  const totalDeposits = breakdownRows.reduce(
    (sum, breakdownRow) => sum + Number(breakdownRow.total_deposits || 0),
    0
  );
  const totalNumberOfChannel = breakdownRows.length;

  return {
    total_spend: totalSpend,
    total_registrations: totalRegistrations,
    total_deposits: totalDeposits,
    total_number_of_channel: totalNumberOfChannel,
    breakdown: {
      total_spend: breakdownRows.map((breakdownRow) => ({
        ...mapKpiBreakdownBase(breakdownRow),
        spend: toNumber(breakdownRow.total_spend),
        percentage_of_total: calculatePercentage(breakdownRow.total_spend, totalSpend)
      })),
      total_registrations: breakdownRows.map((breakdownRow) => ({
        ...mapKpiBreakdownBase(breakdownRow),
        registrations: Number(breakdownRow.total_registrations || 0),
        percentage_of_total: calculatePercentage(breakdownRow.total_registrations, totalRegistrations)
      })),
      total_deposits: breakdownRows.map((breakdownRow) => ({
        ...mapKpiBreakdownBase(breakdownRow),
        first_deposits: Number(breakdownRow.total_deposits || 0),
        percentage_of_total: calculatePercentage(breakdownRow.total_deposits, totalDeposits)
      })),
      total_number_of_channel: breakdownRows.map((breakdownRow) => ({
        ...mapKpiBreakdownBase(breakdownRow),
        channel_count: 1,
        spend: toNumber(breakdownRow.total_spend),
        registrations: Number(breakdownRow.total_registrations || 0),
        first_deposits: Number(breakdownRow.total_deposits || 0),
        percentage_of_total: calculatePercentage(1, totalNumberOfChannel)
      }))
    }
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

const getGroupAdsSummary = async (filters = {}, groupCode) => {
  const { whereClause, params } = buildDateRangeWhere(
    filters,
    'dp.report_date',
    ['cg.group_code = ?'],
    [groupCode]
  );

  const [rows] = await pool.execute(
    `
      SELECT
        cg.group_name,
        COALESCE(SUM(dp.spend), 0) AS total_spend,
        COALESCE(SUM(dp.registrations), 0) AS total_registrations,
        COALESCE(SUM(dp.first_deposits), 0) AS total_first_deposits,
        ROUND(
          CASE
            WHEN SUM(dp.registrations) = 0 THEN 0
            ELSE SUM(dp.spend) / SUM(dp.registrations)
          END,
          2
        ) AS cpr,
        ROUND(
          CASE
            WHEN SUM(dp.first_deposits) = 0 THEN 0
            ELSE SUM(dp.spend) / SUM(dp.first_deposits)
          END,
          2
        ) AS cpd,
        ROUND(
          CASE
            WHEN SUM(dp.registrations) = 0 THEN 0
            ELSE SUM(dp.first_deposits) / SUM(dp.registrations) * 100
          END,
          2
        ) AS conversion_rate
      FROM ad_daily_performance dp
      INNER JOIN ad_channels c
        ON dp.channel_id = c.id
      INNER JOIN ad_channel_groups cg
        ON c.channel_group_id = cg.id
      ${whereClause}
      GROUP BY cg.group_name
      ORDER BY cg.group_name ASC
    `,
    params
  );

  return rows.map(mapGroupAdsSummaryRow);
};

const getSelfRunAds = async (filters = {}) =>
  getGroupAdsSummary(filters, GROUP_CODES.SELF_RUN);

const getThirdPartyAds = async (filters = {}) =>
  getGroupAdsSummary(filters, GROUP_CODES.THIRD_PARTY);

const getGeneralTotalAds = async (filters = {}) => {
  const { whereClause, params } = buildDateRangeWhere(
    filters,
    'dp.report_date',
    ["cg.group_code IN ('SELF_RUN', 'THIRD_PARTY')"]
  );

  const [rows] = await pool.execute(
    `
      SELECT
        'General Total' AS total_type,
        COALESCE(SUM(dp.spend), 0) AS total_spend,
        COALESCE(SUM(dp.registrations), 0) AS total_registrations,
        COALESCE(SUM(dp.first_deposits), 0) AS total_first_deposits,
        ROUND(
          CASE
            WHEN SUM(dp.registrations) = 0 THEN 0
            ELSE SUM(dp.spend) / SUM(dp.registrations)
          END,
          2
        ) AS cpr,
        ROUND(
          CASE
            WHEN SUM(dp.first_deposits) = 0 THEN 0
            ELSE SUM(dp.spend) / SUM(dp.first_deposits)
          END,
          2
        ) AS cpd,
        ROUND(
          CASE
            WHEN SUM(dp.registrations) = 0 THEN 0
            ELSE SUM(dp.first_deposits) / SUM(dp.registrations) * 100
          END,
          2
        ) AS conversion_rate
      FROM ad_daily_performance dp
      INNER JOIN ad_channels c
        ON dp.channel_id = c.id
      INNER JOIN ad_channel_groups cg
        ON c.channel_group_id = cg.id
      ${whereClause}
    `,
    params
  );

  return mapGeneralTotalAdsRow(rows[0] || {});
};

const getVendorCollaboration = async () => {
  const [rows] = await pool.execute(
    `
      SELECT
        v.vendor_name,
        v.website_url,
        ma.assignee_name,
        vs.status_name,
        vc.campaign_name,
        vc.total_amount_raw,
        vc.amount_value,
        vc.currency_code,
        vc.start_date,
        vc.end_date,
        DATEDIFF(vc.end_date, CURDATE()) AS days_remaining,
        CASE
          WHEN vc.end_date < CURDATE() THEN 'Expired'
          WHEN DATEDIFF(vc.end_date, CURDATE()) <= 15 THEN 'Ending Soon'
          ELSE 'Active'
        END AS campaign_health
      FROM ad_vendor_campaigns vc
      INNER JOIN ad_vendors v
        ON vc.vendor_id = v.id
      LEFT JOIN ad_marketing_assignees ma
        ON vc.assignee_id = ma.id
      LEFT JOIN ad_vendor_statuses vs
        ON vc.status_id = vs.id
      ORDER BY vc.start_date DESC
    `
  );

  return rows.map(mapVendorCollaborationRow);
};

const getFinancialExposure = async () => {
  const [fxRows] = await pool.execute(
    `
      SELECT
        UPPER(currency_code) AS currency_code,
        rate_to_usd
      FROM ad_currency_fx_rates
      WHERE is_active = 1
      ORDER BY currency_code ASC
    `
  );

  const [rows] = await pool.execute(
    `
      SELECT
        v.vendor_name,
        v.website_url,
        ROUND(
          SUM(
            COALESCE(vc.amount_value, 0) * COALESCE(fx.rate_to_usd, 1)
          ),
          2
        ) AS total_spend_usd,
        GROUP_CONCAT(DISTINCT vc.total_amount_raw ORDER BY vc.amount_value DESC SEPARATOR ' | ') AS original_amounts,
        GROUP_CONCAT(DISTINCT UPPER(vc.currency_code) ORDER BY UPPER(vc.currency_code) SEPARATOR ', ') AS currency_codes,
        GROUP_CONCAT(DISTINCT vs.status_name ORDER BY vs.status_name SEPARATOR ', ') AS status_names,
        COUNT(DISTINCT vc.id) AS campaign_count,
        MAX(vc.start_date) AS latest_start_date,
        MAX(vc.end_date) AS latest_end_date,
        DATEDIFF(MAX(vc.end_date), CURDATE()) AS days_remaining,
        CASE
          WHEN MAX(vc.end_date) < CURDATE() THEN 'Expired'
          WHEN DATEDIFF(MAX(vc.end_date), CURDATE()) <= 15 THEN 'Ending Soon'
          ELSE 'Active'
        END AS campaign_health
      FROM ad_vendor_campaigns vc
      INNER JOIN ad_vendors v
        ON vc.vendor_id = v.id
      LEFT JOIN ad_vendor_statuses vs
        ON vc.status_id = vs.id
      LEFT JOIN ad_currency_fx_rates fx
        ON UPPER(vc.currency_code) = UPPER(fx.currency_code)
        AND fx.is_active = 1
      GROUP BY
        v.id,
        v.vendor_name,
        v.website_url
      ORDER BY total_spend_usd DESC
    `
  );

  const vendors = rows.map(mapFinancialExposureRow);

  return {
    title: 'Financial Exposure: Where is our money going?',
    subtitle: 'Top vendors by total spend converted to USD (mock FX rates).',
    currency_code: 'USD',
    fx_rates_to_usd: mapFxRates(fxRows),
    vendors
  };
};

const getMediaPipeline = async () => {
  const asOfDate = toDateOnlyString(new Date());
  const onboardingStartDate = toDateOnlyString(
    addDays(parseDateOnly(asOfDate), -MEDIA_PIPELINE_ONBOARDING_DAYS)
  );

  const [rows] = await pool.execute(
    `
      SELECT
        p.id AS partnership_id,
        pp.id AS platform_id,
        pp.platform_name,
        pp.website_url,
        pt.type_name AS platform_type,
        ps.status_code,
        ps.status_name,
        p.partnership_name,
        DATE_FORMAT(p.start_date, '%Y-%m-%d') AS start_date,
        DATE_FORMAT(p.end_date, '%Y-%m-%d') AS end_date,
        DATE_FORMAT(p.renewal_date, '%Y-%m-%d') AS renewal_date,
        pic.full_name AS person_in_charge
      FROM ad_partnerships p
      INNER JOIN ad_partner_platforms pp
        ON p.partner_platform_id = pp.id
      LEFT JOIN ad_platform_types pt
        ON pp.platform_type_id = pt.id
      INNER JOIN ad_partnership_statuses ps
        ON p.partnership_status_id = ps.id
      LEFT JOIN ad_persons_in_charge pic
        ON p.person_in_charge_id = pic.id
      ORDER BY
        pp.platform_name ASC,
        p.start_date ASC,
        p.id ASC
    `
  );

  const [statusRows] = await pool.execute(
    `
      SELECT
        ps.status_code,
        ps.status_name,
        COUNT(DISTINCT p.partner_platform_id) AS vendor_count,
        COUNT(DISTINCT p.id) AS partnership_count
      FROM ad_partnership_statuses ps
      LEFT JOIN ad_partnerships p
        ON p.partnership_status_id = ps.id
      GROUP BY
        ps.id,
        ps.status_code,
        ps.status_name
      ORDER BY
        ps.status_name ASC,
        ps.status_code ASC
    `
  );

  const stageRows = MEDIA_PIPELINE_STAGES.reduce((stages, stage) => {
    stages[stage.stage_code] = [];
    return stages;
  }, {});
  const otherRows = [];

  rows.forEach((row) => {
    const stageCode = getMediaPipelineStageCode(row, onboardingStartDate);

    if (stageRows[stageCode]) {
      stageRows[stageCode].push(row);
      return;
    }

    otherRows.push(row);
  });

  const stages = MEDIA_PIPELINE_STAGES.map((stage) =>
    mapMediaPipelineStage(stage, stageRows[stage.stage_code])
  );
  const stageNameByCode = [...MEDIA_PIPELINE_STAGES, MEDIA_PIPELINE_OTHER_STAGE].reduce(
    (stageMap, stage) => {
      stageMap[stage.stage_code] = stage.stage_name;
      return stageMap;
    },
    {}
  );
  const statusBreakdown = statusRows.map((row) =>
    mapMediaPipelineStatusBreakdown(row, stageNameByCode)
  );
  const otherStatusCodes = statusBreakdown
    .filter((status) => status.pipeline_stage_codes.includes('OTHER'))
    .map((status) => status.status_code);
  const otherPlatformIds = new Set(otherRows.map((row) => Number(row.platform_id)));
  const allPlatformIds = new Set(rows.map((row) => Number(row.platform_id)));

  return {
    title: 'Pipeline Health: Are we launching campaigns fast enough?',
    subtitle: 'Vendor count by operational stage from negotiation through activation.',
    as_of_date: asOfDate,
    onboarding_window_days: MEDIA_PIPELINE_ONBOARDING_DAYS,
    total_vendor_count: allPlatformIds.size,
    total_partnership_count: rows.length,
    stages,
    other_stages: {
      ...MEDIA_PIPELINE_OTHER_STAGE,
      status_codes: otherStatusCodes,
      vendor_count: otherPlatformIds.size,
      partnership_count: otherRows.length,
      vendors: otherRows.map(mapMediaPipelineItem)
    },
    status_breakdown: statusBreakdown,
    note: 'Pipeline is spread across stages - monitor onboarding and payment queues for slippage.'
  };
};

const getMediaProfessional = async () => {
  const [rows] = await pool.execute(
    `
      SELECT
        pp.platform_name AS partner_platform,
        pt.type_name AS platform_type,
        pp.website_url AS website_app,
        ps.status_name AS partnership_status,
        p.partnership_name,
        p.start_date AS partnership_start_date,
        p.end_date AS partnership_end_date,
        p.renewal_date,
        pic.full_name AS person_in_charge,
        COALESCE(SUM(DISTINCT pc.amount), 0) AS total_cost,
        GROUP_CONCAT(DISTINCT ap.placement_name ORDER BY ap.placement_name SEPARATOR ', ') AS ad_placements,
        GROUP_CONCAT(DISTINCT tl.tracking_code ORDER BY tl.tracking_code SEPARATOR ', ') AS tracking_codes,
        GROUP_CONCAT(DISTINCT tl.tracking_url ORDER BY tl.tracking_url SEPARATOR ', ') AS promotion_link,
        GROUP_CONCAT(DISTINCT pn.note_text ORDER BY pn.note_date SEPARATOR ' | ') AS remarks,
        latest_payment.payment_status,
        COALESCE(SUM(perf.impressions), 0) AS impressions,
        COALESCE(SUM(perf.clicks), 0) AS clicks,
        COALESCE(SUM(perf.registrations), 0) AS registrations,
        COALESCE(SUM(perf.first_deposits), 0) AS first_deposits,
        COALESCE(SUM(perf.spend), 0) AS spend,
        COALESCE(SUM(perf.revenue), 0) AS revenue,
        CASE
          WHEN COALESCE(SUM(perf.impressions), 0) = 0 THEN 0
          ELSE SUM(perf.clicks) / SUM(perf.impressions) * 100
        END AS ctr,
        CASE
          WHEN COALESCE(SUM(perf.spend), 0) = 0 THEN 0
          ELSE (SUM(perf.revenue) - SUM(perf.spend)) / SUM(perf.spend) * 100
        END AS roi,
        CASE
          WHEN p.end_date < CURDATE() THEN 'Expired'
          WHEN p.renewal_date IS NOT NULL AND DATEDIFF(p.renewal_date, CURDATE()) <= 15 THEN 'Renewal Soon'
          WHEN p.end_date IS NOT NULL AND DATEDIFF(p.end_date, CURDATE()) <= 15 THEN 'Ending Soon'
          ELSE 'Healthy'
        END AS partnership_health
      FROM ad_partnerships p
      INNER JOIN ad_partner_platforms pp
        ON p.partner_platform_id = pp.id
      LEFT JOIN ad_platform_types pt
        ON pp.platform_type_id = pt.id
      INNER JOIN ad_partnership_statuses ps
        ON p.partnership_status_id = ps.id
      LEFT JOIN ad_persons_in_charge pic
        ON p.person_in_charge_id = pic.id
      LEFT JOIN ad_partnership_costs pc
        ON p.id = pc.partnership_id
      LEFT JOIN partnership_ad_placements pap
        ON p.id = pap.partnership_id
      LEFT JOIN ad_placements ap
        ON pap.ad_placement_id = ap.id
      LEFT JOIN tracking_links tl
        ON p.id = tl.partnership_id
      LEFT JOIN ad_partnership_notes pn
        ON p.id = pn.partnership_id
      LEFT JOIN ad_partnership_performance perf
        ON p.id = perf.partnership_id
      LEFT JOIN (
        SELECT
          ppay.partnership_id,
          ps2.status_name AS payment_status
        FROM ad_partnership_payments ppay
        INNER JOIN ad_payment_statuses ps2
          ON ppay.payment_status_id = ps2.id
        WHERE ppay.id IN (
          SELECT MAX(id)
          FROM ad_partnership_payments
          GROUP BY partnership_id
        )
      ) latest_payment
        ON p.id = latest_payment.partnership_id
      GROUP BY
        pp.platform_name,
        pt.type_name,
        pp.website_url,
        ps.status_name,
        p.id,
        p.partnership_name,
        p.start_date,
        p.end_date,
        p.renewal_date,
        pic.full_name,
        latest_payment.payment_status
      ORDER BY p.start_date DESC
      LIMIT 0, 25
    `
  );

  return rows.map(mapMediaProfessionalRow);
};

const getTimelineDateRange = (filters = {}) => {
  const defaultRange = getDefaultTimelineDateRange();

  if (filters.start_date && filters.end_date) {
    return {
      start_date: filters.start_date,
      end_date: filters.end_date
    };
  }

  if (filters.start_date) {
    return {
      start_date: filters.start_date,
      end_date: toDateOnlyString(addDays(parseDateOnly(filters.start_date), 4))
    };
  }

  if (filters.end_date) {
    return {
      start_date: toDateOnlyString(addDays(parseDateOnly(filters.end_date), -4)),
      end_date: filters.end_date
    };
  }

  return defaultRange;
};

const getMediaTimeline = async (filters = {}) => {
  const { start_date: startDate, end_date: endDate } = getTimelineDateRange(filters);
  const [rows] = await pool.execute(
    `
      SELECT *
      FROM (
        SELECT
          DATE_FORMAT(pn.note_date, '%Y-%m-%d') AS event_date,
          CONCAT('note:', pn.id) AS event_id,
          'remark' AS event_source,
          pn.note_type AS event_type,
          pp.platform_name,
          p.partnership_name,
          ps.status_name AS partnership_status,
          pic.full_name AS person_in_charge,
          CONCAT(
            pp.platform_name,
            ' - ',
            CASE pn.note_type
              WHEN 'issue' THEN 'Issue follow-up'
              WHEN 'optimization' THEN 'Optimization action'
              WHEN 'payment' THEN 'Payment note'
              WHEN 'contract' THEN 'Contract note'
              WHEN 'renewal' THEN 'Renewal note'
              WHEN 'performance' THEN 'Performance note'
              ELSE 'Action item'
            END
          ) AS title,
          pn.note_text AS description,
          NULL AS amount,
          NULL AS currency_code
        FROM ad_partnership_notes pn
        INNER JOIN ad_partnerships p
          ON pn.partnership_id = p.id
        INNER JOIN ad_partner_platforms pp
          ON p.partner_platform_id = pp.id
        INNER JOIN ad_partnership_statuses ps
          ON p.partnership_status_id = ps.id
        LEFT JOIN ad_persons_in_charge pic
          ON p.person_in_charge_id = pic.id
        WHERE pn.note_date BETWEEN ? AND ?

        UNION ALL

        SELECT
          DATE_FORMAT(p.start_date, '%Y-%m-%d') AS event_date,
          CONCAT('partnership-start:', p.id) AS event_id,
          'contract_date' AS event_source,
          'start_date' AS event_type,
          pp.platform_name,
          p.partnership_name,
          ps.status_name AS partnership_status,
          pic.full_name AS person_in_charge,
          CONCAT(pp.platform_name, ' - Partnership starts') AS title,
          CONCAT('Partnership start date for ', p.partnership_name) AS description,
          NULL AS amount,
          NULL AS currency_code
        FROM ad_partnerships p
        INNER JOIN ad_partner_platforms pp
          ON p.partner_platform_id = pp.id
        INNER JOIN ad_partnership_statuses ps
          ON p.partnership_status_id = ps.id
        LEFT JOIN ad_persons_in_charge pic
          ON p.person_in_charge_id = pic.id
        WHERE p.start_date BETWEEN ? AND ?

        UNION ALL

        SELECT
          DATE_FORMAT(p.end_date, '%Y-%m-%d') AS event_date,
          CONCAT('partnership-end:', p.id) AS event_id,
          'contract_date' AS event_source,
          'end_date' AS event_type,
          pp.platform_name,
          p.partnership_name,
          ps.status_name AS partnership_status,
          pic.full_name AS person_in_charge,
          CONCAT(pp.platform_name, ' - Partnership ends') AS title,
          CONCAT('Partnership end date for ', p.partnership_name) AS description,
          NULL AS amount,
          NULL AS currency_code
        FROM ad_partnerships p
        INNER JOIN ad_partner_platforms pp
          ON p.partner_platform_id = pp.id
        INNER JOIN ad_partnership_statuses ps
          ON p.partnership_status_id = ps.id
        LEFT JOIN ad_persons_in_charge pic
          ON p.person_in_charge_id = pic.id
        WHERE p.end_date BETWEEN ? AND ?

        UNION ALL

        SELECT
          DATE_FORMAT(p.renewal_date, '%Y-%m-%d') AS event_date,
          CONCAT('partnership-renewal:', p.id) AS event_id,
          'contract_date' AS event_source,
          'renewal_date' AS event_type,
          pp.platform_name,
          p.partnership_name,
          ps.status_name AS partnership_status,
          pic.full_name AS person_in_charge,
          CONCAT(pp.platform_name, ' - Renewal checkpoint') AS title,
          CONCAT('Renewal date for ', p.partnership_name) AS description,
          NULL AS amount,
          NULL AS currency_code
        FROM ad_partnerships p
        INNER JOIN ad_partner_platforms pp
          ON p.partner_platform_id = pp.id
        INNER JOIN ad_partnership_statuses ps
          ON p.partnership_status_id = ps.id
        LEFT JOIN ad_persons_in_charge pic
          ON p.person_in_charge_id = pic.id
        WHERE p.renewal_date BETWEEN ? AND ?

        UNION ALL

        SELECT
          DATE_FORMAT(pay.due_date, '%Y-%m-%d') AS event_date,
          CONCAT('payment-due:', pay.id) AS event_id,
          'payment_milestone' AS event_source,
          'payment_due' AS event_type,
          pp.platform_name,
          p.partnership_name,
          ps.status_name AS partnership_status,
          pic.full_name AS person_in_charge,
          CONCAT(pp.platform_name, ' - Payment due') AS title,
          pay.remarks AS description,
          pay.amount_due AS amount,
          pay.currency_code
        FROM ad_partnership_payments pay
        INNER JOIN ad_partnerships p
          ON pay.partnership_id = p.id
        INNER JOIN ad_partner_platforms pp
          ON p.partner_platform_id = pp.id
        INNER JOIN ad_partnership_statuses ps
          ON p.partnership_status_id = ps.id
        LEFT JOIN ad_persons_in_charge pic
          ON p.person_in_charge_id = pic.id
        WHERE pay.due_date BETWEEN ? AND ?

        UNION ALL

        SELECT
          DATE_FORMAT(pay.paid_date, '%Y-%m-%d') AS event_date,
          CONCAT('payment-paid:', pay.id) AS event_id,
          'payment_milestone' AS event_source,
          'payment_paid' AS event_type,
          pp.platform_name,
          p.partnership_name,
          payment_status.status_name AS partnership_status,
          pic.full_name AS person_in_charge,
          CONCAT(pp.platform_name, ' - Payment paid') AS title,
          pay.remarks AS description,
          pay.amount_paid AS amount,
          pay.currency_code
        FROM ad_partnership_payments pay
        INNER JOIN ad_partnerships p
          ON pay.partnership_id = p.id
        INNER JOIN ad_partner_platforms pp
          ON p.partner_platform_id = pp.id
        INNER JOIN ad_payment_statuses payment_status
          ON pay.payment_status_id = payment_status.id
        LEFT JOIN ad_persons_in_charge pic
          ON p.person_in_charge_id = pic.id
        WHERE pay.paid_date BETWEEN ? AND ?
      ) timeline_events
      WHERE event_date IS NOT NULL
      ORDER BY
        event_date ASC,
        platform_name ASC,
        event_source ASC,
        event_type ASC
    `,
    [
      startDate,
      endDate,
      startDate,
      endDate,
      startDate,
      endDate,
      startDate,
      endDate,
      startDate,
      endDate,
      startDate,
      endDate
    ]
  );

  const eventRows = rows.map((row) => mapMediaTimelineEventRow(row, startDate, endDate));
  const dayMap = new Map();

  eventRows.forEach((event) => {
    if (!dayMap.has(event.date)) {
      dayMap.set(event.date, {
        date: event.date,
        date_label: formatDisplayDate(event.date),
        critical_label: 'Critical week',
        item_count: 0,
        items: []
      });
    }

    const day = dayMap.get(event.date);
    day.items.push(event);
    day.item_count += 1;
  });

  const days = Array.from(dayMap.values());

  return {
    title: 'Executive Timeline: What is happening this week?',
    subtitle: `${formatMonthYear(startDate)} action items from remarks, contract dates, and payment milestones.`,
    window: {
      start_date: startDate,
      end_date: endDate,
      label: formatDateWindow(startDate, endDate)
    },
    alert: {
      severity: 'warning',
      message: `Critical executive action window: ${formatDateWindow(startDate, endDate)}`
    },
    total_action_items: eventRows.length,
    days
  };
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
  getSelfRunAds,
  getThirdPartyAds,
  getGeneralTotalAds,
  getVendorCollaboration,
  getFinancialExposure,
  getMediaPipeline,
  getMediaProfessional,
  getMediaTimeline,
  getGroupTotals,
  getGeneralTotals,
  createImportBatch,
  upsertDailyPerformance
};
