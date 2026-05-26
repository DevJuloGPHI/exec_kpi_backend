const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const customerServiceDashboardRoutes = require('./routes/customerServiceDashboard.routes');
const dailySummaryOperationRoutes = require('./routes/dailySummaryOperation.routes');
const kolDashboardRoutes = require('./routes/kolDashboard.routes');
const adDashboardRoutes = require('./routes/adDashboard.routes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy'
  });
});

app.use('/api/daily-summary-operation', dailySummaryOperationRoutes);
app.use('/api/customer-service/dashboard', customerServiceDashboardRoutes);
app.use('/api/kol/dashboard', kolDashboardRoutes);
app.use('/api/ad-dashboard', adDashboardRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
