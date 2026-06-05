const { query } = require('../config/db');

async function getAlerts(req, res, next) {
  try {
    const { type, severity, unread } = req.query;
    let conditions = ['a.is_dismissed = FALSE'];
    let params = [];
    let idx = 1;

    if (type) { conditions.push(`a.type = $${idx++}`); params.push(type); }
    if (severity) { conditions.push(`a.severity = $${idx++}`); params.push(severity); }
    if (unread === 'true') { conditions.push('a.is_read = FALSE'); }

    const result = await query(`
      SELECT a.*, p.name as product_name, p.sku, p.current_stock, p.min_stock_level
      FROM alerts a
      LEFT JOIN products p ON p.id = a.product_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY 
        CASE a.severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END,
        a.created_at DESC
    `, params);

    res.json({ alerts: result.rows });
  } catch (err) {
    next(err);
  }
}

async function markAsRead(req, res, next) {
  try {
    await query('UPDATE alerts SET is_read = TRUE WHERE id = $1', [req.params.id]);
    res.json({ message: 'Alert marked as read' });
  } catch (err) {
    next(err);
  }
}

async function dismissAlert(req, res, next) {
  try {
    await query('UPDATE alerts SET is_dismissed = TRUE WHERE id = $1', [req.params.id]);
    res.json({ message: 'Alert dismissed' });
  } catch (err) {
    next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    await query('UPDATE alerts SET is_read = TRUE WHERE is_dismissed = FALSE');
    res.json({ message: 'All alerts marked as read' });
  } catch (err) {
    next(err);
  }
}

async function getAlertSummary(req, res, next) {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE NOT is_dismissed) as total,
        COUNT(*) FILTER (WHERE severity = 'critical' AND NOT is_dismissed) as critical,
        COUNT(*) FILTER (WHERE severity = 'warning' AND NOT is_dismissed) as warning,
        COUNT(*) FILTER (WHERE NOT is_read AND NOT is_dismissed) as unread
      FROM alerts
    `);
    res.json({ summary: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAlerts, markAsRead, dismissAlert, markAllRead, getAlertSummary };
