const { query } = require('../config/db');

async function checkAndGenerateAlerts() {
  try {
    // Find low stock products
    const lowStockResult = await query(`
      SELECT p.id, p.name, p.sku, p.current_stock, p.min_stock_level
      FROM products p
      WHERE p.status = 'active'
        AND p.current_stock <= p.min_stock_level
    `);

    for (const product of lowStockResult.rows) {
      const isOutOfStock = product.current_stock === 0;
      const type = isOutOfStock ? 'out_of_stock' : 'low_stock';
      const severity = isOutOfStock ? 'critical' : 'warning';
      const message = isOutOfStock
        ? `${product.name} (${product.sku}) is OUT OF STOCK`
        : `${product.name} (${product.sku}) stock is low: ${product.current_stock} units remaining (min: ${product.min_stock_level})`;

      // Check if a similar alert already exists and is not dismissed
      const existing = await query(`
        SELECT id FROM alerts 
        WHERE product_id = $1 AND type = $2 AND is_dismissed = FALSE
        AND created_at > NOW() - INTERVAL '24 hours'
      `, [product.id, type]);

      if (existing.rows.length === 0) {
        await query(`
          INSERT INTO alerts (type, product_id, message, severity)
          VALUES ($1, $2, $3, $4)
        `, [type, product.id, message, severity]);

        console.log(`🔔 Alert created: ${message}`);
      }
    }

    return lowStockResult.rows.length;
  } catch (err) {
    console.error('Alert generation error:', err);
    return 0;
  }
}

async function getAlertSummary() {
  const result = await query(`
    SELECT 
      COUNT(*) FILTER (WHERE NOT is_dismissed) as total_active,
      COUNT(*) FILTER (WHERE severity = 'critical' AND NOT is_dismissed) as critical,
      COUNT(*) FILTER (WHERE severity = 'warning' AND NOT is_dismissed) as warning,
      COUNT(*) FILTER (WHERE NOT is_read AND NOT is_dismissed) as unread
    FROM alerts
  `);
  return result.rows[0];
}

module.exports = { checkAndGenerateAlerts, getAlertSummary };
