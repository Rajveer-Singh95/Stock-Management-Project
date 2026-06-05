const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const { initDb } = require('./config/db');
const { connectRedis } = require('./config/redis');
const { startCronJobs } = require('./services/cronService');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const productRoutes = require('./routes/products.routes');
const supplierRoutes = require('./routes/suppliers.routes');
const orderRoutes = require('./routes/orders.routes');
const alertRoutes = require('./routes/alerts.routes');
const reportRoutes = require('./routes/reports.routes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Smart Inventory API running', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

async function start() {
  try {
    await initDb();
    await connectRedis();
    startCronJobs();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📦 Smart Inventory & Supply Chain API ready`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

start();
