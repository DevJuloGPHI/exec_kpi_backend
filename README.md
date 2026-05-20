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
    dailySummaryOperation.controller.js
  routes/
    dailySummaryOperation.routes.js
  services/
    dailySummaryOperation.service.js
  validators/
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

## Validation Rules

- `summary_date` is required and must be a valid `YYYY-MM-DD` date.
- `deposit` is required and must be numeric and greater than or equal to `0`.
- `withdrawal` is required and must be numeric and greater than or equal to `0`.
- `registered` is required and must be an integer greater than or equal to `0`.
- `promotion` is required and must be numeric and greater than or equal to `0`.
- `start_date` and `end_date` must be valid `YYYY-MM-DD` dates when provided.
- When both range dates are provided, `start_date` must not be greater than `end_date`.

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
