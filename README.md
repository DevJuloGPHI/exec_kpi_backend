# exec-dashboard-backend

Node.js, Express.js, and MySQL backend API for an Executive Dashboard daily summary operation dataset.

## Tech Stack

- Node.js
- Express.js
- MySQL2 promise pool
- dotenv
- cors
- helmet
- morgan
- express-validator

## Project Structure

```text
src/
  config/
    db.js
  controllers/
    customerServiceDashboard.controller.js
    dailySummaryOperation.controller.js
    kolDashboard.controller.js
  routes/
    customerServiceDashboard.routes.js
    dailySummaryOperation.routes.js
    kolDashboard.routes.js
  services/
    customerServiceDashboard.service.js
    dailySummaryOperation.service.js
    kolDashboard.service.js
  validators/
    customerServiceDashboard.validator.js
    dailySummaryOperation.validator.js
    kolDashboard.validator.js
  middlewares/
    errorHandler.js
  app.js
  server.js
database/
  seed_daily_summary_operation.sql
```

## Installation

```bash
npm install
```

## Environment

Create or update `.env`:

```env
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=exec_dashboard_db
```

## Database Setup

Create the local database:

```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS exec_dashboard_db;"
```

Run the seed file. It creates the table and inserts or updates the seed records:

```bash
mysql -u root exec_dashboard_db < database/seed_daily_summary_operation.sql
```

## Run

```bash
npm run dev
```

Production:

```bash
npm start
```

Health check:

```http
GET http://localhost:5000/health
```

## API Base URL

```text
http://localhost:5000/api/daily-summary-operation
http://localhost:5000/api/customer-service/dashboard
http://localhost:5000/api/kol/dashboard
```

## Endpoints

### Get All Records

```http
GET /api/daily-summary-operation
```

Response:

```json
{
  "success": true,
  "message": "Daily summary records fetched successfully",
  "data": []
}
```

### Get Records By Date Range

```http
GET /api/daily-summary-operation?start_date=2026-04-01&end_date=2026-05-17
```

### Daily ROI Analysis

Returns the chart-ready daily series for promotional ROI analysis.

```http
GET /api/daily-summary-operation/dailyroiAnalysis?start_date=2026-04-01&end_date=2026-05-09
```

Response shape:

```json
{
  "success": true,
  "message": "Daily promo ROI analysis data fetched successfully",
  "data": [
    {
      "date": "2026-04-01",
      "promotion": 0,
      "registered": 42,
      "ggr": 340
    }
  ]
}
```

### GGR Summary Report

Returns dashboard card data from `ggr_daily_platform_metrics`, including weekly net GGR, total bets, total payouts, and best/worst platform by GGR.

```http
GET /api/daily-summary-operation/ggr-summary-report?start_date=2026-05-03&end_date=2026-05-09
```

Response shape:

```json
{
  "success": true,
  "message": "GGR summary report fetched successfully",
  "data": {
    "period": {
      "start_date": "2026-05-03",
      "end_date": "2026-05-09",
      "total_days": 7
    },
    "weekly_net_ggr": -4878033.59,
    "total_bets": 31561262.24,
    "total_payouts": 36439295.83,
    "total_pagcor_share": -731705.0385,
    "total_audit_fee": -73170.5037,
    "best_performing_platform": {
      "platform_id": 3,
      "platform_code": "EGAMES",
      "platform_name": "E-Games",
      "ggr": 176010.21,
      "total_bets": 5705699.16,
      "total_payouts": 5529688.95,
      "pagcor_share": 26401.5315,
      "audit_fee": 2640.1533
    },
    "worst_performing_platform": {
      "platform_id": 1,
      "platform_code": "SPORTSBOOK",
      "platform_name": "Sportsbook",
      "ggr": -5054114.8,
      "total_bets": 25855466.08,
      "total_payouts": 30909580.88,
      "pagcor_share": -758117.22,
      "audit_fee": -75811.722
    },
    "platform_breakdown": []
  }
}
```

### Cumulative GGR Waterfall Report

Returns chart-ready daily GGR steps and cumulative GGR for the net position waterfall dashboard.

```http
GET /api/daily-summary-operation/cumulative-ggr-waterfall-report?start_date=2026-05-03&end_date=2026-05-09
```

Response shape:

```json
{
  "success": true,
  "message": "Cumulative GGR waterfall report fetched successfully",
  "data": {
    "period": {
      "start_date": "2026-05-03",
      "end_date": "2026-05-09",
      "total_days": 7
    },
    "weekly_net_ggr": -4878033.59,
    "total_bets": 31561262.24,
    "total_payouts": 36439295.83,
    "best_day": {
      "date": "2026-05-03",
      "daily_ggr": -163162.92,
      "cumulative_ggr": -163162.92,
      "total_bets": 1261147.83,
      "total_payouts": 1424310.75,
      "waterfall_start": 0,
      "waterfall_end": -163162.92,
      "direction": "negative"
    },
    "worst_day": {
      "date": "2026-05-05",
      "daily_ggr": -1904264.68,
      "cumulative_ggr": -2684530.2,
      "total_bets": 6026346.21,
      "total_payouts": 7930610.89,
      "waterfall_start": -780265.52,
      "waterfall_end": -2684530.2,
      "direction": "negative"
    },
    "waterfall_points": [
      {
        "label": "Week start",
        "date": null,
        "daily_ggr": 0,
        "cumulative_ggr": 0,
        "total_bets": 0,
        "total_payouts": 0,
        "waterfall_start": 0,
        "waterfall_end": 0,
        "direction": "baseline"
      }
    ]
  }
}
```

### Regulatory Charges By Platform

Returns weekly aggregates for total GGR with PAGCOR share and audit fee components by platform.

```http
GET /api/daily-summary-operation/regulatory-charges-by-platform?start_date=2026-05-03&end_date=2026-05-09
```

Response shape:

```json
{
  "success": true,
  "message": "Regulatory charges by platform fetched successfully",
  "data": {
    "period": {
      "start_date": "2026-05-03",
      "end_date": "2026-05-09",
      "total_days": 7
    },
    "platform_rows": [
      {
        "platform_id": 1,
        "platform_code": "SPORTSBOOK",
        "platform_name": "Sportsbook",
        "total_ggr": -5054114.8,
        "pagcor_share": -758117.22,
        "audit_fee": -75811.72
      },
      {
        "platform_id": 3,
        "platform_code": "EGAMES",
        "platform_name": "E-Games",
        "total_ggr": 176010.21,
        "pagcor_share": 26401.53,
        "audit_fee": 2640.15
      },
      {
        "platform_id": 2,
        "platform_code": "EBINGO",
        "platform_name": "E-Bingo",
        "total_ggr": 71,
        "pagcor_share": 10.65,
        "audit_fee": 1.07
      }
    ],
    "daily_total": {
      "label": "Daily Total",
      "total_ggr": -4878033.59,
      "pagcor_share": -731705.04,
      "audit_fee": -73170.5
    }
  }
}
```

### Get One Record By Date

```http
GET /api/daily-summary-operation/2026-04-01
```

### Insert Or Update One Record

`net_deposit` and `ggr` are computed by the service layer and should not be sent by clients.

```http
POST /api/daily-summary-operation
Content-Type: application/json
```

```json
{
  "summary_date": "2026-04-01",
  "deposit": 500,
  "withdrawal": 160,
  "registered": 42,
  "promotion": 0
}
```

### Bulk Insert Or Update

```http
POST /api/daily-summary-operation/bulk
Content-Type: application/json
```

```json
{
  "records": [
    {
      "summary_date": "2026-04-01",
      "deposit": 500,
      "withdrawal": 160,
      "registered": 42,
      "promotion": 0
    },
    {
      "summary_date": "2026-04-02",
      "deposit": 500,
      "withdrawal": 1000,
      "registered": 64,
      "promotion": 0
    }
  ]
}
```

### Dashboard Data

```http
GET /api/daily-summary-operation/dashboard?start_date=2026-04-01&end_date=2026-05-17
```

Response shape:

```json
{
  "success": true,
  "message": "Dashboard data fetched successfully",
  "data": {
    "records": [
      {
        "summary_date": "2026-04-01",
        "deposit": 500,
        "withdrawal": 160,
        "net_deposit": 340,
        "registered": 42,
        "promotion": 0,
        "ggr": 340
      }
    ],
    "summary": {
      "total_deposit": 123456,
      "total_withdrawal": 100000,
      "total_net_deposit": 23456,
      "total_registered": 5000,
      "total_promotion": 15000,
      "total_ggr": 8456,
      "average_daily_deposit": 5000,
      "average_daily_withdrawal": 4000,
      "average_daily_ggr": 800,
      "total_days": 47,
      "best_ggr_day": {
        "summary_date": "2026-05-06",
        "ggr": 271153.26
      },
      "worst_ggr_day": {
        "summary_date": "2026-05-08",
        "ggr": -2077179.25
      }
    }
  }
}
```

### Dashboard Summary

```http
GET /api/daily-summary-operation/dashboard/summary?start_date=2026-04-01&end_date=2026-05-17
```

Response shape:

```json
{
  "success": true,
  "message": "Dashboard summary fetched successfully",
  "data": {
    "total_deposit": 123456,
    "total_withdrawal": 100000,
    "total_net_deposit": 23456,
    "total_registered": 5000,
    "total_promotion": 15000,
    "total_ggr": 8456,
    "average_daily_deposit": 5000,
    "average_daily_withdrawal": 4000,
    "average_daily_ggr": 800,
    "total_days": 47,
    "best_ggr_day": {
      "summary_date": "2026-05-06",
      "ggr": 271153.26
    },
    "worst_ggr_day": {
      "summary_date": "2026-05-08",
      "ggr": -2077179.25
    }
  }
}
```

### Player Behaviour And Liquidity

Returns chart-ready daily liquidity records with withdrawal ratio as a percentage:

```text
withdrawal_ratio = withdrawal / deposit * 100
```

When `deposit` is `0`, `withdrawal_ratio` is returned as `0`.

```http
GET /api/daily-summary-operation/player-behaviour-liquidity?start_date=2026-04-01&end_date=2026-05-17
```

Response shape:

```json
{
  "success": true,
  "message": "Player behaviour and liquidity data fetched successfully",
  "data": [
    {
      "date": "2026-04-26",
      "deposit": 436627,
      "withdrawal": 727856,
      "withdrawal_ratio": 166.7
    }
  ]
}
```

### Cumulative Monthly Trajectory

Returns chart-ready running totals over the requested date range. Cumulative net revenue after promotions uses `ggr`, which is computed as `net_deposit - promotion`.

```http
GET /api/daily-summary-operation/cumulative-monthly-trajectory?start_date=2026-04-01&end_date=2026-05-17
```

Response shape:

```json
{
  "success": true,
  "message": "Cumulative monthly trajectory data fetched successfully",
  "data": [
    {
      "date": "2026-04-01",
      "cumulative_net_revenue_after_promotions": 340,
      "cumulative_net_deposit": 340
    },
    {
      "date": "2026-04-02",
      "cumulative_net_revenue_after_promotions": -160,
      "cumulative_net_deposit": -160
    }
  ]
}
```

## Customer Service Dashboard API

Base URL:

```text
http://localhost:5000/api/customer-service/dashboard
```

Default report filters:

```text
start_date=2026-04-01
end_date=2026-04-30
category_id=10
```

Shift mapping:

```text
1 = Morning
2 = Afternoon / MID
3 = Evening / Night
```

Category mapping:

```text
1 = Registration
2 = Promotion
3 = Verification Code / OTP
4 = KYC
5 = Account
6 = Withdrawal
7 = Deposit
8 = Game Related
9 = Other
10 = Unlabeled / No Tag
```

All customer-service dashboard endpoints are read-only `SELECT` reports backed by the `cs_*` tables.

### Composite Dashboard

Returns summary cards, daily and hourly volume, category breakdown, selected-category shift breakdown, shift/category matrix, monthly category summary, and lookup metadata.

```http
GET /api/customer-service/dashboard?start_date=2026-04-01&end_date=2026-04-30&category_id=10
```

### Report Endpoints

```http
GET /api/customer-service/dashboard/summary
GET /api/customer-service/dashboard/daily-volume
GET /api/customer-service/dashboard/hourly-volume
GET /api/customer-service/dashboard/category-breakdown
GET /api/customer-service/dashboard/shift-breakdown?category_id=10
GET /api/customer-service/dashboard/shift-category-volume?category_id=10
GET /api/customer-service/dashboard/shift-category-matrix
GET /api/customer-service/dashboard/monthly-category-summary
```

`shift-breakdown` and `shift-category-volume` use `category_id=10` by default. `shift-category-volume` also accepts `shift_id=1`, `2`, or `3`.

### Metadata Endpoints

```http
GET /api/customer-service/dashboard/categories
GET /api/customer-service/dashboard/shifts
GET /api/customer-service/dashboard/time-slots
GET /api/customer-service/dashboard/import-batches?status=COMPLETED&limit=20
```

## KOL Dashboard API

Base URL:

```text
http://localhost:5000/api/kol/dashboard
```

### KPI Cards

Returns the four KPI cards for KOL acquisition: total ad spend, total first deposits, overall conversion rate, and blended acquisition cost.

```http
GET /api/kol/dashboard/kpi-cards?start_date=2026-05-01&end_date=2026-05-31
```

Optional filters:

```text
start_date=YYYY-MM-DD
end_date=YYYY-MM-DD
content_category_id=1
agent_id=1
```

Without `content_category_id` or `agent_id`, totals come from `kol_daily_consumption_summary`. With either filter, totals come from `kol_agent_daily_performance` joined to `kol_agents`.

Response shape:

```json
{
  "success": true,
  "message": "KOL KPI cards fetched successfully",
  "data": {
    "filters": {
      "start_date": "2026-05-01",
      "end_date": "2026-05-31",
      "content_category_id": null,
      "agent_id": null
    },
    "source": "kol_daily_consumption_summary",
    "period": {
      "start_date": "2026-05-01",
      "end_date": "2026-05-31",
      "days_with_records": 31
    },
    "totals": {
      "total_ad_spend": 320000,
      "total_registrations": 3065,
      "total_first_deposits": 1900,
      "overall_conversion_rate": 61.99,
      "cost_per_registration": 104.4,
      "blended_acquisition_cost": 168.42
    },
    "cards": [
      {
        "key": "total_ad_spend",
        "title": "Total Ad Spend",
        "value": 320000,
        "format": "currency_compact",
        "description": "Sum of cost - money out the door"
      }
    ]
  }
}
```

### Agent KPI Cards

Returns the four KPI cards for the agent view: total active agents, total ad spend, first-time deposits, and conversion efficiency.

```http
GET /api/kol/dashboard/agent-kpi-cards?start_date=2026-04-04&end_date=2026-05-18
```

Response shape:

```json
{
  "success": true,
  "message": "KOL agent KPI cards fetched successfully",
  "data": {
    "filters": {
      "start_date": "2026-04-04",
      "end_date": "2026-05-18",
      "content_category_id": null,
      "agent_id": null
    },
    "source": "kol_agent_daily_performance",
    "period": {
      "start_date": "2026-04-17",
      "end_date": "2026-05-18",
      "days_with_records": 32
    },
    "totals": {
      "total_active_agents": 286,
      "total_ad_spend": 209857.61,
      "total_registrations": 13695,
      "first_time_deposits": 7381,
      "conversion_efficiency": 53.9
    },
    "cards": [
      {
        "key": "total_active_agents",
        "title": "Total Active Agents",
        "value": 286,
        "format": "number_compact",
        "description": "Agents with activity in this view"
      },
      {
        "key": "total_ad_spend",
        "title": "Total Ad Spend",
        "value": 209857.61,
        "format": "currency_compact",
        "description": "Sum of partner media cost"
      },
      {
        "key": "first_time_deposits",
        "title": "First-Time Deposits",
        "value": 7381,
        "format": "number_compact",
        "description": "New first-time depositors acquired"
      },
      {
        "key": "conversion_efficiency",
        "title": "Conversion Efficiency",
        "value": 53.9,
        "format": "percentage",
        "description": "FTD / registrations"
      }
    ]
  }
}
```

The same summary payload is also available at:

```http
GET /api/kol/dashboard/summary
```

The dashboard wrapper is available at:

```http
GET /api/kol/dashboard
```

### Spend Acquisition Volume

Returns chart-ready daily ad spend bars and new first depositor line data.

```http
GET /api/kol/dashboard/spend-acquisition-volume?start_date=2026-04-04&end_date=2026-05-18
```

Response shape:

```json
{
  "success": true,
  "message": "KOL spend acquisition volume fetched successfully",
  "data": {
    "filters": {
      "start_date": "2026-04-04",
      "end_date": "2026-05-18",
      "content_category_id": null,
      "agent_id": null
    },
    "source": "kol_daily_consumption_summary",
    "chart": {
      "key": "spend_acquisition_volume",
      "title": "Spend vs. acquisition volume",
      "description": "Daily cost (bars) vs. new first depositors (line). Conversions should scale when spend rises.",
      "series": [
        {
          "key": "ad_spend",
          "label": "Ad spend",
          "type": "bar",
          "value_format": "currency"
        },
        {
          "key": "new_first_depositors",
          "label": "New first depositors",
          "type": "line",
          "value_format": "number"
        }
      ]
    },
    "period": {
      "start_date": "2026-04-04",
      "end_date": "2026-05-18",
      "days_with_records": 45
    },
    "totals": {
      "ad_spend": 370127.86,
      "new_first_depositors": 27657,
      "registrations": 40755,
      "blended_acquisition_cost": 13.38
    },
    "daily_points": [
      {
        "date": "2026-04-04",
        "ad_spend": 375,
        "new_first_depositors": 12,
        "registrations": 18
      }
    ]
  }
}
```

### Conversion Rate Tracking

Returns chart-ready daily registration-to-first-deposit conversion rates. The rate is recomputed from daily totals:

```text
conversion_rate = first_deposits / registrations * 100
```

```http
GET /api/kol/dashboard/conversion-rate-tracking?start_date=2026-04-04&end_date=2026-05-18
```

Optional quality threshold override:

```text
conversion_quality_threshold=50
```

`quality_threshold=50` is also accepted as a shorter alias.

Response shape:

```json
{
  "success": true,
  "message": "KOL conversion rate tracking fetched successfully",
  "data": {
    "filters": {
      "start_date": "2026-04-04",
      "end_date": "2026-05-18",
      "content_category_id": null,
      "agent_id": null
    },
    "source": "kol_daily_consumption_summary",
    "chart": {
      "key": "conversion_rate_tracking",
      "title": "Conversion Rate Tracking",
      "description": "Registration-to-deposit rate by day. Downward trends signal low-intent traffic.",
      "series": [
        {
          "key": "conversion_rate",
          "label": "Conversion",
          "type": "line",
          "value_format": "percentage"
        }
      ],
      "reference_lines": [
        {
          "key": "quality_threshold",
          "label": "50% quality",
          "value": 50,
          "value_format": "percentage"
        }
      ]
    },
    "period": {
      "start_date": "2026-04-04",
      "end_date": "2026-05-18",
      "days_with_records": 45
    },
    "threshold": {
      "quality": 50
    },
    "summary": {
      "registrations": 31034,
      "first_deposits": 19251,
      "blended_conversion_rate": 62.03,
      "average_daily_conversion_rate": 41.7,
      "latest_conversion_rate": 69.46,
      "period_change": 69.46,
      "trend_direction": "up",
      "below_quality_days": 22,
      "within_quality_days": 23
    },
    "daily_points": [
      {
        "date": "2026-04-18",
        "registrations": 112,
        "first_deposits": 73,
        "conversion_rate": 65.18,
        "quality_threshold": 50,
        "below_quality_threshold": false,
        "change_from_previous_day": 8.39,
        "trend_direction": "up",
        "status": "within_quality"
      }
    ]
  }
}
```

### Daily Performance Trend Chart

Returns daily trend data from `kol_agent_daily_performance`, grouped by `latest_payment_date`.

```http
GET /api/kol/dashboard/daily-performance-trend-chart?start_date=2026-04-04&end_date=2026-05-18
```

Response shape:

```json
{
  "success": true,
  "message": "Daily Performance Trend Chart fetched successfully",
  "data": {
    "filters": {
      "start_date": "2026-04-04",
      "end_date": "2026-05-18",
      "content_category_id": null,
      "agent_id": null
    },
    "source": "kol_agent_daily_performance",
    "chart": {
      "key": "daily_performance_trend_chart",
      "title": "Daily Performance Trend Chart",
      "description": "Daily KOL agent performance trend grouped by latest payment date.",
      "series": [
        {
          "key": "total_cost",
          "label": "Total cost",
          "type": "bar",
          "value_format": "currency"
        },
        {
          "key": "total_registrations",
          "label": "Total registrations",
          "type": "line",
          "value_format": "number"
        },
        {
          "key": "total_first_deposits",
          "label": "Total first deposits",
          "type": "line",
          "value_format": "number"
        },
        {
          "key": "conversion_rate",
          "label": "Conversion rate",
          "type": "line",
          "value_format": "percentage"
        }
      ]
    },
    "period": {
      "start_date": "2026-04-17",
      "end_date": "2026-05-18",
      "days_with_records": 32
    },
    "summary": {
      "total_cost": 209857.61,
      "total_registrations": 13695,
      "total_first_deposits": 7381,
      "blended_conversion_rate": 53.9
    },
    "daily_points": [
      {
        "report_date": "2026-04-17",
        "total_cost": 8.85,
        "total_registrations": 5,
        "total_first_deposits": 1,
        "conversion_rate": 20
      }
    ]
  }
}
```

### Top Performing KOL

Returns KOL agents ranked by conversion rate descending, then cost per first deposit ascending. Agents with zero first deposits are excluded.

```http
GET /api/kol/dashboard/top-performing-kol?start_date=2026-04-04&end_date=2026-05-18
```

Response shape:

```json
{
  "success": true,
  "message": "Top Performing KOL fetched successfully",
  "data": {
    "filters": {
      "start_date": "2026-04-04",
      "end_date": "2026-05-18",
      "content_category_id": null,
      "agent_id": null
    },
    "source": "kol_agent_daily_performance",
    "table": {
      "key": "top_performing_kol",
      "title": "Top Performing KOL",
      "description": "Ranked by conversion rate descending, then cost per first deposit ascending.",
      "rank_order": [
        {
          "key": "conversion_rate",
          "direction": "desc"
        },
        {
          "key": "cost_per_first_deposit",
          "direction": "asc"
        }
      ],
      "columns": [
        {
          "key": "rank",
          "label": "Rank",
          "value_format": "number"
        },
        {
          "key": "agent_code",
          "label": "Agent code",
          "value_format": "text"
        },
        {
          "key": "category_name",
          "label": "Category",
          "value_format": "text"
        },
        {
          "key": "total_cost",
          "label": "Total cost",
          "value_format": "currency"
        },
        {
          "key": "total_registrations",
          "label": "Total registrations",
          "value_format": "number"
        },
        {
          "key": "total_first_deposits",
          "label": "Total first deposits",
          "value_format": "number"
        },
        {
          "key": "cost_per_registration",
          "label": "Cost per registration",
          "value_format": "currency"
        },
        {
          "key": "cost_per_first_deposit",
          "label": "Cost per first deposit",
          "value_format": "currency"
        },
        {
          "key": "conversion_rate",
          "label": "Conversion rate",
          "value_format": "percentage"
        }
      ]
    },
    "summary": {
      "total_kols": 227,
      "total_cost": 202834.65,
      "total_registrations": 13614,
      "total_first_deposits": 7381,
      "blended_conversion_rate": 54.22
    },
    "records": [
      {
        "rank": 1,
        "agent_code": "LOL014",
        "category_name": "Influencer Content",
        "total_cost": 0.84,
        "total_registrations": 2,
        "total_first_deposits": 2,
        "cost_per_registration": 0.42,
        "cost_per_first_deposit": 0.42,
        "conversion_rate": 100
      }
    ]
  }
}
```

### Category Performance

Returns Brand Content vs Influencer Content performance grouped by content category and ordered by total cost descending.

```http
GET /api/kol/dashboard/category-performance?start_date=2026-04-04&end_date=2026-05-18
```

Response shape:

```json
{
  "success": true,
  "message": "KOL category performance fetched successfully",
  "data": {
    "filters": {
      "start_date": "2026-04-04",
      "end_date": "2026-05-18",
      "content_category_id": null,
      "agent_id": null
    },
    "source": "kol_agent_daily_performance",
    "comparison": {
      "key": "category_performance",
      "title": "Category Performance",
      "description": "Brand Content vs Influencer Content performance grouped by content category.",
      "order_by": [
        {
          "key": "total_cost",
          "direction": "desc"
        }
      ],
      "dimensions": [
        {
          "key": "category_name",
          "label": "Category"
        }
      ],
      "metrics": [
        {
          "key": "total_cost",
          "label": "Total cost",
          "value_format": "currency"
        },
        {
          "key": "total_registrations",
          "label": "Total registrations",
          "value_format": "number"
        },
        {
          "key": "total_first_deposits",
          "label": "Total first deposits",
          "value_format": "number"
        },
        {
          "key": "cost_per_registration",
          "label": "Cost per registration",
          "value_format": "currency"
        },
        {
          "key": "cost_per_first_deposit",
          "label": "Cost per first deposit",
          "value_format": "currency"
        },
        {
          "key": "conversion_rate",
          "label": "Conversion rate",
          "value_format": "percentage"
        },
        {
          "key": "cost_share",
          "label": "Cost share",
          "value_format": "percentage"
        }
      ]
    },
    "summary": {
      "total_categories": 2,
      "total_cost": 209857.61,
      "total_registrations": 13695,
      "total_first_deposits": 7381,
      "blended_cost_per_registration": 15.32,
      "blended_cost_per_first_deposit": 28.43,
      "blended_conversion_rate": 53.9,
      "leading_category_by_cost": "Influencer Content"
    },
    "records": [
      {
        "category_name": "Influencer Content",
        "total_cost": 164319.51,
        "total_registrations": 13471,
        "total_first_deposits": 7320,
        "cost_per_registration": 12.2,
        "cost_per_first_deposit": 22.45,
        "conversion_rate": 54.34,
        "cost_share": 78.3,
        "registration_share": 98.36,
        "first_deposit_share": 99.17
      },
      {
        "category_name": "Brand Content",
        "total_cost": 45538.1,
        "total_registrations": 224,
        "total_first_deposits": 61,
        "cost_per_registration": 203.3,
        "cost_per_first_deposit": 746.53,
        "conversion_rate": 27.23,
        "cost_share": 21.7,
        "registration_share": 1.64,
        "first_deposit_share": 0.83
      }
    ]
  }
}
```

### Content Analysis

Returns grouped agent tables by content category, including latest payment, top-ups, cost, registrations, deposits, CPR, CPFD, conversion rate, and alert rows for spend with zero deposits.

```http
GET /api/kol/dashboard/content-analysis?start_date=2026-04-04&end_date=2026-05-18
```

Response shape:

```json
{
  "success": true,
  "message": "KOL content analysis fetched successfully",
  "data": {
    "filters": {
      "start_date": "2026-04-04",
      "end_date": "2026-05-18",
      "content_category_id": null,
      "agent_id": null
    },
    "source": "kol_agent_daily_performance",
    "table": {
      "key": "content_analysis",
      "title": "Content Analysis",
      "description": "Agent performance grouped by content category.",
      "row_alert": {
        "key": "has_spend_without_deposit",
        "description": "Rows with spend and zero deposits should be highlighted."
      },
      "columns": [
        {
          "key": "agent_code",
          "label": "Agent ID",
          "value_format": "text"
        },
        {
          "key": "latest_payment_display",
          "label": "Latest Payment",
          "value_format": "date"
        },
        {
          "key": "top_ups",
          "label": "Top-ups",
          "value_format": "number"
        },
        {
          "key": "cost",
          "label": "Cost",
          "value_format": "currency"
        },
        {
          "key": "registrations",
          "label": "Reg.",
          "value_format": "number"
        },
        {
          "key": "deposits",
          "label": "Deposits",
          "value_format": "number"
        },
        {
          "key": "cost_per_registration",
          "label": "CPR",
          "value_format": "currency"
        },
        {
          "key": "cost_per_first_deposit",
          "label": "CPFD",
          "value_format": "currency"
        },
        {
          "key": "conversion_rate",
          "label": "Conv %",
          "value_format": "percentage"
        }
      ]
    },
    "summary": {
      "total_categories": 2,
      "total_agents": 286,
      "total_top_ups": 1027,
      "total_cost": 209857.61,
      "total_registrations": 13695,
      "total_deposits": 7381,
      "cost_per_registration": 15.32,
      "cost_per_first_deposit": 28.43,
      "conversion_rate": 53.9,
      "alert_rows": 59
    },
    "sections": [
      {
        "category_name": "Brand Content",
        "title": "Brand Content",
        "agent_count": 3,
        "summary": {
          "total_agents": 3,
          "total_top_ups": 66,
          "total_cost": 45538.1,
          "total_registrations": 224,
          "total_deposits": 61,
          "cost_per_registration": 203.3,
          "cost_per_first_deposit": 746.53,
          "conversion_rate": 27.23,
          "alert_rows": 0
        },
        "records": [
          {
            "agent_code": "LOL003",
            "latest_payment_date": "2026-05-01",
            "latest_payment_display": "May 1, 2026",
            "top_ups": 23,
            "cost": 17803.37,
            "registrations": 87,
            "deposits": 13,
            "cost_per_registration": 204.64,
            "cost_per_first_deposit": 1369.49,
            "conversion_rate": 14.94,
            "has_spend_without_deposit": false,
            "status": "normal"
          }
        ]
      }
    ]
  }
}
```

### Cost Efficiency Panel

Returns agent-level cost efficiency with performance status buckets that answer whether KOL spend is efficient.

```http
GET /api/kol/dashboard/cost-efficiency-panel?start_date=2026-04-04&end_date=2026-05-18
```

Response shape:

```json
{
  "success": true,
  "message": "KOL cost efficiency panel fetched successfully",
  "data": {
    "filters": {
      "start_date": "2026-04-04",
      "end_date": "2026-05-18",
      "content_category_id": null,
      "agent_id": null
    },
    "source": "kol_agent_daily_performance",
    "panel": {
      "key": "cost_efficiency_panel",
      "title": "Cost Efficiency Panel",
      "question": "Are we spending efficiently?",
      "order_by": [
        {
          "key": "cost_per_first_deposit",
          "direction": "asc"
        }
      ],
      "indicators": [
        {
          "key": "high_cost_low_first_deposits",
          "label": "High cost + low first deposits",
          "meaning": "Poor performance"
        },
        {
          "key": "low_cost_high_first_deposits",
          "label": "Low cost + high first deposits",
          "meaning": "Strong performance"
        },
        {
          "key": "high_registrations_low_deposits",
          "label": "High registrations + low deposits",
          "meaning": "Weak user quality"
        },
        {
          "key": "low_registration_cost_high_conversion",
          "label": "Low registration cost + high conversion",
          "meaning": "Best KOL traffic"
        }
      ],
      "status_rules": [
        {
          "status": "Critical: Spend with no deposit",
          "rule": "first_deposits = 0 and cost > 0"
        },
        {
          "status": "Excellent",
          "rule": "cost_per_first_deposit <= 10"
        },
        {
          "status": "Good",
          "rule": "cost_per_first_deposit <= 20"
        },
        {
          "status": "Needs Review",
          "rule": "cost_per_first_deposit <= 50"
        },
        {
          "status": "High Cost",
          "rule": "cost_per_first_deposit > 50 or no efficiency threshold matched"
        }
      ]
    },
    "summary": {
      "total_agents": 286,
      "total_cost": 209857.61,
      "total_registrations": 13695,
      "total_first_deposits": 7381,
      "blended_cost_per_registration": 15.32,
      "blended_cost_per_first_deposit": 28.43,
      "blended_conversion_rate": 53.9,
      "status_counts": {
        "Critical: Spend with no deposit": 59,
        "Excellent": 56,
        "Good": 51,
        "Needs Review": 86,
        "High Cost": 34
      }
    },
    "records": [
      {
        "agent_code": "LOL439",
        "total_cost": 57.81,
        "total_registrations": 0,
        "total_first_deposits": 0,
        "cost_per_registration": null,
        "cost_per_first_deposit": null,
        "conversion_rate": null,
        "performance_status": "Critical: Spend with no deposit"
      }
    ]
  }
}
```

### Underperforming KOL Watchlist

Returns KOL agents with spend and either zero first deposits or conversion below 20%, ordered by total cost descending for management review.

```http
GET /api/kol/dashboard/underperforming-kol-watchlist?start_date=2026-04-04&end_date=2026-05-18
```

Response shape:

```json
{
  "success": true,
  "message": "Underperforming KOL watchlist fetched successfully",
  "data": {
    "filters": {
      "start_date": "2026-04-04",
      "end_date": "2026-05-18",
      "content_category_id": null,
      "agent_id": null
    },
    "source": "kol_agent_daily_performance",
    "watchlist": {
      "key": "underperforming_kol_watchlist",
      "title": "Underperforming KOL Watchlist",
      "description": "KOL agents with spend and either zero first deposits or conversion below 20%.",
      "management_use": "Supports pause, review, or budget reduction decisions for inefficient KOL traffic.",
      "criteria": [
        {
          "key": "has_spend",
          "rule": "total_cost > 0"
        },
        {
          "key": "no_first_deposits",
          "rule": "total_first_deposits = 0"
        },
        {
          "key": "low_conversion",
          "rule": "conversion_rate < 20"
        }
      ],
      "order_by": [
        {
          "key": "total_cost",
          "direction": "desc"
        }
      ]
    },
    "summary": {
      "total_kols": 73,
      "total_cost_at_risk": 37374.21,
      "total_registrations": 680,
      "total_first_deposits": 76,
      "zero_deposit_kols": 59,
      "low_conversion_kols": 14,
      "blended_cost_per_registration": 54.96,
      "blended_cost_per_first_deposit": 491.77,
      "blended_conversion_rate": 11.18,
      "highest_cost_agent": "LOL003"
    },
    "records": [
      {
        "agent_code": "LOL003",
        "total_cost": 17803.37,
        "total_registrations": 87,
        "total_first_deposits": 13,
        "cost_per_registration": 204.64,
        "cost_per_first_deposit": 1369.49,
        "conversion_rate": 14.94,
        "watchlist_reason": "Conversion below 20%",
        "recommended_action": "Review traffic quality"
      }
    ]
  }
}
```

### KOL Daily Performance

Returns the source-of-truth daily performance table with pagination, sorting, and row flags for days with spend but zero first deposits.

```http
GET /api/kol/dashboard/kol-daily-performance?start_date=2026-04-04&end_date=2026-05-18&page=1&per_page=10
```

Optional table controls:

```text
page=1
per_page=10
sort_by=date
sort_direction=asc
```

Sortable fields:

```text
date
cost
registrations
first_deposits
cost_per_registration
cost_per_first_deposit
conversion
```

Response shape:

```json
{
  "success": true,
  "message": "KOL daily performance fetched successfully",
  "data": {
    "filters": {
      "start_date": "2026-04-04",
      "end_date": "2026-05-18",
      "content_category_id": null,
      "agent_id": null
    },
    "source": "kol_daily_consumption_summary",
    "table": {
      "key": "kol_daily_performance",
      "title": "KOL daily performance",
      "description": "Source of truth - sort any column. Rows in red had spend with zero first deposits.",
      "columns": [
        {
          "key": "date",
          "label": "Date",
          "value_format": "date",
          "sortable": true
        }
      ]
    },
    "period": {
      "start_date": "2026-04-04",
      "end_date": "2026-05-18",
      "days_with_records": 45
    },
    "totals": {
      "cost": 346008.65,
      "registrations": 31034,
      "first_deposits": 19251,
      "cost_per_registration": 11.15,
      "cost_per_first_deposit": 17.97,
      "conversion": 62.03
    },
    "sort": {
      "sort_by": "date",
      "sort_direction": "asc"
    },
    "pagination": {
      "page": 1,
      "per_page": 10,
      "total_records": 45,
      "total_pages": 5,
      "from_record": 1,
      "to_record": 10,
      "showing_label": "Showing 1-10 of 45"
    },
    "records": [
      {
        "date": "2026-04-04",
        "display_date": "Apr 4, 2026",
        "cost": 911.48,
        "registrations": 5,
        "first_deposits": 0,
        "cost_per_registration": 182.3,
        "cost_per_first_deposit": null,
        "conversion": 0,
        "has_spend_without_first_deposit": true,
        "status": "spend_without_first_deposit"
      }
    ]
  }
}
```

### Acquisition Unit Costs

Returns monthly mid-month acquisition unit costs. Each month aggregates days `1-15`, then recomputes blended cost per registration and cost per first deposit from total cost and acquisition counts.

```http
GET /api/kol/dashboard/acquisition-unit-costs?start_date=2026-04-01&end_date=2026-05-31
```

Optional target overrides:

```text
cost_per_registration_target=30
cost_per_first_deposit_target=60
```

Response shape:

```json
{
  "success": true,
  "message": "KOL acquisition unit costs fetched successfully",
  "data": {
    "filters": {
      "start_date": "2026-04-01",
      "end_date": "2026-05-31",
      "content_category_id": null,
      "agent_id": null
    },
    "source": "kol_daily_consumption_summary",
    "chart": {
      "key": "acquisition_unit_costs",
      "title": "Acquisition unit costs",
      "description": "Mid-month basis (days 1-15): blended CPR and CPFD by calendar month. Lower is better; red bars exceed targets.",
      "basis": {
        "period": "calendar_month",
        "day_start": 1,
        "day_end": 15
      },
      "series": [
        {
          "key": "cost_per_first_deposit",
          "label": "Cost per first deposit",
          "type": "bar",
          "value_format": "currency",
          "target": 60
        },
        {
          "key": "cost_per_registration",
          "label": "Cost per registration",
          "type": "bar",
          "value_format": "currency",
          "target": 30
        }
      ]
    },
    "targets": {
      "cost_per_registration": 30,
      "cost_per_first_deposit": 60
    },
    "period": {
      "start_month": "2026-04",
      "end_month": "2026-05",
      "months_with_records": 2
    },
    "alert": {
      "elevated_month_count": 1,
      "message": "1 month(s) with elevated unit costs in this window."
    },
    "monthly_points": [
      {
        "month": "2026-04",
        "label": "Apr-15",
        "period_start_date": "2026-04-04",
        "period_end_date": "2026-04-15",
        "data_end_date": "2026-04-15",
        "days_with_records": 12,
        "total_cost": 7816.98,
        "registrations": 257,
        "first_deposits": 22,
        "cost_per_registration": 30.42,
        "cost_per_first_deposit": 355.32,
        "exceeds_cost_per_registration_target": true,
        "exceeds_cost_per_first_deposit_target": true,
        "has_elevated_unit_costs": true,
        "status": "elevated"
      }
    ]
  }
}
```

## Validation Rules

- `summary_date` is required and must be a valid `YYYY-MM-DD` date.
- `deposit` is required and must be numeric and greater than or equal to `0`.
- `withdrawal` is required and must be numeric and greater than or equal to `0`.
- `registered` is required and must be an integer greater than or equal to `0`.
- `promotion` is required and must be numeric and greater than or equal to `0`.
- `start_date` and `end_date` must be valid `YYYY-MM-DD` dates when provided.
- When both range dates are provided, `start_date` must not be greater than `end_date`.
- Customer service dashboard `category_id` must be an integer from `1` to `10`.
- Customer service dashboard `shift_id` must be an integer from `1` to `3`.
- KOL dashboard `content_category_id` and `agent_id` must be positive integers when provided.
- KOL dashboard unit-cost targets must be numeric and greater than or equal to `0`.
- KOL dashboard conversion quality thresholds must be numeric and greater than or equal to `0`.
- KOL daily performance `page`, `per_page`, and `limit` must be positive integers; `per_page` and `limit` are capped at `100`.
- KOL daily performance `sort_by` and `sort_direction` must use supported values.

Validation error response:

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "summary_date",
      "message": "summary_date must be a valid date in YYYY-MM-DD format"
    }
  ]
}
```

## Postman Examples

### Insert One Daily Summary

- Method: `POST`
- URL: `http://localhost:5000/api/daily-summary-operation`
- Headers: `Content-Type: application/json`
- Body:

```json
{
  "summary_date": "2026-05-18",
  "deposit": 1200,
  "withdrawal": 250,
  "registered": 80,
  "promotion": 50
}
```

### Bulk Insert Daily Summaries

- Method: `POST`
- URL: `http://localhost:5000/api/daily-summary-operation/bulk`
- Headers: `Content-Type: application/json`
- Body:

```json
{
  "records": [
    {
      "summary_date": "2026-05-18",
      "deposit": 1200,
      "withdrawal": 250,
      "registered": 80,
      "promotion": 50
    },
    {
      "summary_date": "2026-05-19",
      "deposit": 950,
      "withdrawal": 400,
      "registered": 74,
      "promotion": 25
    }
  ]
}
```

### Get All Records

- Method: `GET`
- URL: `http://localhost:5000/api/daily-summary-operation`

### Get Records By Date Range

- Method: `GET`
- URL: `http://localhost:5000/api/daily-summary-operation?start_date=2026-04-01&end_date=2026-05-17`

### Get Dashboard Summary

- Method: `GET`
- URL: `http://localhost:5000/api/daily-summary-operation/dashboard/summary?start_date=2026-04-01&end_date=2026-05-17`

## Implementation Notes

- All database writes use prepared statements through `mysql2/promise`.
- The API uses a reusable MySQL connection pool from `src/config/db.js`.
- `net_deposit` is computed as `deposit - withdrawal`.
- `ggr` is computed as `net_deposit - promotion`.
- Bulk saves run inside a transaction.
- Controllers only handle HTTP request and response concerns.
- SQL access is isolated in the service layer.
- Errors are normalized by centralized error middleware.
# exec_kpi_backend
