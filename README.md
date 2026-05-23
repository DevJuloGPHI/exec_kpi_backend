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
  routes/
    customerServiceDashboard.routes.js
    dailySummaryOperation.routes.js
  services/
    customerServiceDashboard.service.js
    dailySummaryOperation.service.js
  validators/
    customerServiceDashboard.validator.js
    dailySummaryOperation.validator.js
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
