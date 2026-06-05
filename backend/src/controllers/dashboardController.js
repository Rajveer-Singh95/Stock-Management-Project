const { query } = require('../config/db');
const { cacheGet, cacheSet, cacheDelPattern } = require('../services/cacheService');

async function getDashboardStats(req, res, next) {
  try {
    const cacheKey = 'dashboard:stats';
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const [products, lowStock, outOfStock, totalValue, suppliersRes, pendingOrders, alertsRes, recentMovements] = await Promise.all([
      query('SELECT COUNT(*) as count FROM products WHERE status = $1', ['active']),
      query('SELECT COUNT(*) as count FROM products WHERE current_stock <= min_stock_level AND current_stock > 0 AND status = $1', ['active']),
      query('SELECT COUNT(*) as count FROM products WHERE current_stock = 0 AND status = $1', ['active']),
      query('SELECT COALESCE(SUM(current_stock * cost_price), 0) as total FROM products WHERE status = $1', ['active']),
      query('SELECT COUNT(*) as count FROM suppliers WHERE status = $1', ['active']),
      query('SELECT COUNT(*) as count FROM purchase_orders WHERE status IN ($1, $2)', ['pending', 'ordered']),
      query('SELECT COUNT(*) as count FROM alerts WHERE is_dismissed = FALSE'),
      query(`
        SELECT sm.id, sm.type, sm.quantity, sm.created_at, sm.notes,
               p.name as product_name, p.sku,
               u.name as performed_by_name
        FROM stock_movements sm
        JOIN products p ON p.id = sm.product_id
        LEFT JOIN users u ON u.id = sm.performed_by
        ORDER BY sm.created_at DESC
        LIMIT 10
      `),
    ]);

    // Stock health distribution
    const stockHealth = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE current_stock = 0) as out_of_stock,
        COUNT(*) FILTER (WHERE current_stock > 0 AND current_stock <= min_stock_level) as critical,
        COUNT(*) FILTER (WHERE current_stock > min_stock_level AND current_stock <= min_stock_level * 2) as low,
        COUNT(*) FILTER (WHERE current_stock > min_stock_level * 2) as healthy
      FROM products WHERE status = 'active'
    `);

    // Stock value trend (last 7 days movement value)
    const movementTrend = await query(`
      SELECT 
        DATE(created_at) as date,
        SUM(CASE WHEN type = 'in' THEN quantity ELSE 0 END) as stock_in,
        SUM(CASE WHEN type = 'out' THEN quantity ELSE 0 END) as stock_out
      FROM stock_movements
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Category breakdown
    const categoryBreakdown = await query(`
      SELECT c.name, COUNT(p.id) as product_count, 
             COALESCE(SUM(p.current_stock), 0) as total_stock
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.status = 'active'
      GROUP BY c.id, c.name
      ORDER BY total_stock DESC
    `);

    const data = {
      stats: {
        totalProducts: parseInt(products.rows[0].count),
        lowStockItems: parseInt(lowStock.rows[0].count),
        outOfStockItems: parseInt(outOfStock.rows[0].count),
        totalInventoryValue: parseFloat(totalValue.rows[0].total),
        activeSuppliers: parseInt(suppliersRes.rows[0].count),
        pendingOrders: parseInt(pendingOrders.rows[0].count),
        activeAlerts: parseInt(alertsRes.rows[0].count),
      },
      stockHealth: stockHealth.rows[0],
      movementTrend: movementTrend.rows,
      categoryBreakdown: categoryBreakdown.rows,
      recentActivity: recentMovements.rows,
    };

    await cacheSet(cacheKey, data, 120); // cache 2 minutes
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboardStats };
