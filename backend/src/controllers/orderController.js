const { query } = require('../config/db');
const { cacheDelPattern } = require('../services/cacheService');

function generatePONumber() {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `PO-${dateStr}-${rand}`;
}

async function getOrders(req, res, next) {
  try {
    const { status, supplier, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let conditions = ['1=1'];
    let params = [];
    let idx = 1;

    if (status) { conditions.push(`po.status = $${idx++}`); params.push(status); }
    if (supplier) { conditions.push(`po.supplier_id = $${idx++}`); params.push(supplier); }

    const whereClause = conditions.join(' AND ');

    const [countRes, ordersRes] = await Promise.all([
      query(`SELECT COUNT(*) FROM purchase_orders po WHERE ${whereClause}`, params),
      query(`
        SELECT po.*, s.name as supplier_name,
               u.name as created_by_name,
               COUNT(poi.id) as item_count
        FROM purchase_orders po
        LEFT JOIN suppliers s ON s.id = po.supplier_id
        LEFT JOIN users u ON u.id = po.created_by
        LEFT JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
        WHERE ${whereClause}
        GROUP BY po.id, s.name, u.name
        ORDER BY po.created_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}
      `, [...params, limit, offset]),
    ]);

    res.json({
      orders: ordersRes.rows,
      total: parseInt(countRes.rows[0].count),
      totalPages: Math.ceil(countRes.rows[0].count / limit),
    });
  } catch (err) {
    next(err);
  }
}

async function getOrder(req, res, next) {
  try {
    const [orderRes, itemsRes] = await Promise.all([
      query(`
        SELECT po.*, s.name as supplier_name, u.name as created_by_name
        FROM purchase_orders po
        LEFT JOIN suppliers s ON s.id = po.supplier_id
        LEFT JOIN users u ON u.id = po.created_by
        WHERE po.id = $1
      `, [req.params.id]),
      query(`
        SELECT poi.*, p.name as product_name, p.sku, p.unit
        FROM purchase_order_items poi
        JOIN products p ON p.id = poi.product_id
        WHERE poi.purchase_order_id = $1
      `, [req.params.id]),
    ]);

    if (orderRes.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json({ order: orderRes.rows[0], items: itemsRes.rows });
  } catch (err) {
    next(err);
  }
}

async function createOrder(req, res, next) {
  try {
    const { supplier_id, expected_date, notes, items } = req.body;

    if (!supplier_id || !items?.length) {
      return res.status(400).json({ error: 'Supplier and at least one item required' });
    }

    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
    const poNumber = generatePONumber();

    const orderRes = await query(`
      INSERT INTO purchase_orders (po_number, supplier_id, total_amount, expected_date, notes, created_by)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [poNumber, supplier_id, totalAmount, expected_date, notes, req.user.id]);

    const order = orderRes.rows[0];

    for (const item of items) {
      await query(`
        INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_cost)
        VALUES ($1, $2, $3, $4)
      `, [order.id, item.product_id, item.quantity, item.unit_cost]);
    }

    await cacheDelPattern('dashboard:*');
    res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
}

async function updateOrderStatus(req, res, next) {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'ordered', 'received', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const orderRes = await query('SELECT * FROM purchase_orders WHERE id = $1', [req.params.id]);
    if (orderRes.rows.length === 0) return res.status(404).json({ error: 'Order not found' });

    const updateFields = ['status = $1', 'updated_at = NOW()'];
    const params = [status];
    if (status === 'received') {
      updateFields.push('received_date = NOW()');
    }

    const updated = await query(
      `UPDATE purchase_orders SET ${updateFields.join(', ')} WHERE id = $${params.length + 1} RETURNING *`,
      [...params, req.params.id]
    );

    // If received, add stock movements for all items
    if (status === 'received') {
      const itemsRes = await query('SELECT * FROM purchase_order_items WHERE purchase_order_id = $1', [req.params.id]);
      
      for (const item of itemsRes.rows) {
        await query('UPDATE products SET current_stock = current_stock + $1, updated_at = NOW() WHERE id = $2', [item.quantity, item.product_id]);
        await query(`
          INSERT INTO stock_movements (product_id, type, quantity, reference, notes, performed_by)
          VALUES ($1, 'in', $2, $3, 'PO received', $4)
        `, [item.product_id, item.quantity, updated.rows[0].po_number, req.user.id]);
        
        await query('UPDATE purchase_order_items SET received_quantity = quantity WHERE id = $1', [item.id]);
      }
    }

    await cacheDelPattern('dashboard:*');
    res.json({ order: updated.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function deleteOrder(req, res, next) {
  try {
    const result = await query('SELECT status FROM purchase_orders WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    if (result.rows[0].status === 'received') {
      return res.status(400).json({ error: 'Cannot delete a received order' });
    }
    await query('UPDATE purchase_orders SET status = $1 WHERE id = $2', ['cancelled', req.params.id]);
    res.json({ message: 'Order cancelled' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getOrders, getOrder, createOrder, updateOrderStatus, deleteOrder };
