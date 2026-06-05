const { query } = require('../config/db');
const { forecastDemand } = require('../services/forecastService');
const { cacheGet, cacheSet } = require('../services/cacheService');

async function getStockMovementReport(req, res, next) {
  try {
    const { days = 30, productId } = req.query;
    let condition = productId ? 'AND sm.product_id = $2' : '';
    let params = [days];
    if (productId) params.push(productId);

    const result = await query(`
      SELECT 
        DATE(sm.created_at) as date,
        sm.type,
        SUM(sm.quantity) as total_quantity,
        COUNT(*) as transaction_count
      FROM stock_movements sm
      WHERE sm.created_at >= NOW() - INTERVAL '${parseInt(days)} days'
      ${condition}
      GROUP BY DATE(sm.created_at), sm.type
      ORDER BY date ASC
    `, productId ? [productId] : []);

    res.json({ report: result.rows });
  } catch (err) {
    next(err);
  }
}

async function getForecastReport(req, res, next) {
  try {
    const cacheKey = 'reports:forecast';
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const products = await query(`
      SELECT p.id, p.name, p.sku, p.current_stock, p.min_stock_level, 
             p.reorder_quantity, s.lead_time_days, s.name as supplier_name
      FROM products p
      LEFT JOIN suppliers s ON s.id = p.supplier_id
      WHERE p.status = 'active'
      ORDER BY p.name
    `);

    const forecasts = await Promise.all(products.rows.map(async (product) => {
      const forecast = await forecastDemand(product.id, 30);
      const daysUntilStockout = forecast.avgDailyDemand > 0
        ? Math.floor(product.current_stock / forecast.avgDailyDemand)
        : null;

      return {
        ...product,
        forecast,
        daysUntilStockout,
        needsReorder: daysUntilStockout !== null && daysUntilStockout <= (product.lead_time_days || 7),
      };
    }));

    const response = { forecasts, generatedAt: new Date().toISOString() };
    await cacheSet(cacheKey, response, 3600);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

async function getInventoryValueReport(req, res, next) {
  try {
    const result = await query(`
      SELECT 
        c.name as category,
        COUNT(p.id) as product_count,
        SUM(p.current_stock) as total_units,
        SUM(p.current_stock * p.cost_price) as total_cost_value,
        SUM(p.current_stock * p.unit_price) as total_retail_value
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.status = 'active'
      GROUP BY c.name
      ORDER BY total_cost_value DESC
    `);

    const totals = await query(`
      SELECT 
        SUM(current_stock * cost_price) as total_cost,
        SUM(current_stock * unit_price) as total_retail,
        COUNT(*) as total_products
      FROM products WHERE status = 'active'
    `);

    res.json({ byCategory: result.rows, totals: totals.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function getTopMovingProducts(req, res, next) {
  try {
    const { days = 30, type = 'out', limit = 10 } = req.query;

    const result = await query(`
      SELECT 
        p.id, p.name, p.sku,
        SUM(sm.quantity) as total_moved,
        COUNT(*) as transaction_count,
        c.name as category
      FROM stock_movements sm
      JOIN products p ON p.id = sm.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE sm.type = $1
        AND sm.created_at >= NOW() - INTERVAL '${parseInt(days)} days'
      GROUP BY p.id, p.name, p.sku, c.name
      ORDER BY total_moved DESC
      LIMIT $2
    `, [type, parseInt(limit)]);

    res.json({ products: result.rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { getStockMovementReport, getForecastReport, getInventoryValueReport, getTopMovingProducts };
