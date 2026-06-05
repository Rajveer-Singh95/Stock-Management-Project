const { query } = require('../config/db');
const { cacheGet, cacheSet, cacheDelPattern } = require('./cacheService');

/**
 * Simple Moving Average demand forecast
 * Based on stock_movements of type 'out' over the last N days
 */
async function forecastDemand(productId, days = 30) {
  const cacheKey = `forecast:${productId}:${days}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const result = await query(`
    SELECT 
      DATE(created_at) as date,
      SUM(quantity) as daily_demand
    FROM stock_movements
    WHERE product_id = $1
      AND type = 'out'
      AND created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `, [productId]);

  const movements = result.rows;
  if (movements.length === 0) {
    return { avgDailyDemand: 0, forecastedDemand7d: 0, forecastedDemand30d: 0, trend: 'stable', dataPoints: [] };
  }

  const totalDemand = movements.reduce((sum, r) => sum + parseInt(r.daily_demand), 0);
  const avgDailyDemand = totalDemand / days;

  // Calculate trend (compare first half vs second half)
  const half = Math.floor(movements.length / 2);
  let trend = 'stable';
  if (movements.length >= 4) {
    const firstHalfAvg = movements.slice(0, half).reduce((s, r) => s + parseInt(r.daily_demand), 0) / half;
    const secondHalfAvg = movements.slice(half).reduce((s, r) => s + parseInt(r.daily_demand), 0) / (movements.length - half);
    if (secondHalfAvg > firstHalfAvg * 1.1) trend = 'increasing';
    else if (secondHalfAvg < firstHalfAvg * 0.9) trend = 'decreasing';
  }

  const forecast = {
    avgDailyDemand: parseFloat(avgDailyDemand.toFixed(2)),
    forecastedDemand7d: Math.ceil(avgDailyDemand * 7),
    forecastedDemand30d: Math.ceil(avgDailyDemand * 30),
    trend,
    dataPoints: movements.map(m => ({
      date: m.date,
      demand: parseInt(m.daily_demand),
    })),
  };

  await cacheSet(cacheKey, forecast, 3600); // cache 1 hour
  return forecast;
}

async function forecastAllProducts() {
  const result = await query('SELECT id FROM products WHERE status = $1', ['active']);
  const forecasts = {};

  for (const row of result.rows) {
    forecasts[row.id] = await forecastDemand(row.id, 30);
  }

  return forecasts;
}

async function getSuggestedReorderQuantity(productId) {
  const product = await query('SELECT * FROM products WHERE id = $1', [productId]);
  if (product.rows.length === 0) return 0;

  const p = product.rows[0];
  const forecast = await forecastDemand(productId, 30);

  // Reorder qty = forecasted demand for lead time + safety stock
  const supplierResult = await query('SELECT lead_time_days FROM suppliers WHERE id = $1', [p.supplier_id]);
  const leadTime = supplierResult.rows[0]?.lead_time_days || 7;

  const suggested = Math.ceil(forecast.avgDailyDemand * (leadTime + 7)); // lead time + 7 days safety
  return Math.max(suggested, p.reorder_quantity);
}

module.exports = { forecastDemand, forecastAllProducts, getSuggestedReorderQuantity };
