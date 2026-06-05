const { query } = require('../config/db');

async function getSuppliers(req, res, next) {
  try {
    const { search, status } = req.query;
    let conditions = ['1=1'];
    let params = [];
    let idx = 1;

    if (search) {
      conditions.push(`(name ILIKE $${idx} OR contact_person ILIKE $${idx} OR email ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }
    if (status) {
      conditions.push(`status = $${idx++}`);
      params.push(status);
    }

    const result = await query(`
      SELECT s.*, 
             COUNT(p.id) as product_count,
             COUNT(po.id) FILTER (WHERE po.status IN ('pending','ordered')) as open_orders
      FROM suppliers s
      LEFT JOIN products p ON p.supplier_id = s.id AND p.status = 'active'
      LEFT JOIN purchase_orders po ON po.supplier_id = s.id
      WHERE ${conditions.join(' AND ')}
      GROUP BY s.id
      ORDER BY s.name ASC
    `, params);

    res.json({ suppliers: result.rows });
  } catch (err) {
    next(err);
  }
}

async function getSupplier(req, res, next) {
  try {
    const [supplierRes, productsRes, ordersRes] = await Promise.all([
      query('SELECT * FROM suppliers WHERE id = $1', [req.params.id]),
      query('SELECT id, sku, name, current_stock FROM products WHERE supplier_id = $1 AND status = $2', [req.params.id, 'active']),
      query('SELECT * FROM purchase_orders WHERE supplier_id = $1 ORDER BY created_at DESC LIMIT 10', [req.params.id]),
    ]);

    if (supplierRes.rows.length === 0) return res.status(404).json({ error: 'Supplier not found' });
    res.json({ supplier: supplierRes.rows[0], products: productsRes.rows, recentOrders: ordersRes.rows });
  } catch (err) {
    next(err);
  }
}

async function createSupplier(req, res, next) {
  try {
    const { name, contact_person, email, phone, address, lead_time_days, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Supplier name is required' });

    const result = await query(`
      INSERT INTO suppliers (name, contact_person, email, phone, address, lead_time_days, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [name, contact_person, email, phone, address, lead_time_days || 7, notes]);

    res.status(201).json({ supplier: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function updateSupplier(req, res, next) {
  try {
    const { name, contact_person, email, phone, address, lead_time_days, rating, status, notes } = req.body;

    const result = await query(`
      UPDATE suppliers SET
        name = COALESCE($1, name),
        contact_person = COALESCE($2, contact_person),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        address = COALESCE($5, address),
        lead_time_days = COALESCE($6, lead_time_days),
        rating = COALESCE($7, rating),
        status = COALESCE($8, status),
        notes = COALESCE($9, notes),
        updated_at = NOW()
      WHERE id = $10 RETURNING *
    `, [name, contact_person, email, phone, address, lead_time_days, rating, status, notes, req.params.id]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Supplier not found' });
    res.json({ supplier: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function deleteSupplier(req, res, next) {
  try {
    await query('UPDATE suppliers SET status = $1 WHERE id = $2', ['inactive', req.params.id]);
    res.json({ message: 'Supplier deactivated' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier };
