const { query } = require('../config/db');
const { cacheDelPattern } = require('../services/cacheService');

async function getProducts(req, res, next) {
  try {
    const { search, category, status, stockStatus, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    let conditions = ['1=1'];
    let params = [];
    let idx = 1;

    if (search) {
      conditions.push(`(p.name ILIKE $${idx} OR p.sku ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }
    if (category) {
      conditions.push(`p.category_id = $${idx++}`);
      params.push(category);
    }
    if (status) {
      conditions.push(`p.status = $${idx++}`);
      params.push(status);
    }
    if (stockStatus === 'low') {
      conditions.push('p.current_stock <= p.min_stock_level AND p.current_stock > 0');
    } else if (stockStatus === 'out') {
      conditions.push('p.current_stock = 0');
    } else if (stockStatus === 'healthy') {
      conditions.push('p.current_stock > p.min_stock_level');
    }

    const whereClause = conditions.join(' AND ');

    const [countResult, productsResult] = await Promise.all([
      query(`SELECT COUNT(*) FROM products p WHERE ${whereClause}`, params),
      query(`
        SELECT p.*, 
               c.name as category_name, c.color as category_color,
               s.name as supplier_name
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN suppliers s ON s.id = p.supplier_id
        WHERE ${whereClause}
        ORDER BY p.updated_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}
      `, [...params, limit, offset]),
    ]);

    res.json({
      products: productsResult.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(countResult.rows[0].count / limit),
    });
  } catch (err) {
    next(err);
  }
}

async function getProduct(req, res, next) {
  try {
    const result = await query(`
      SELECT p.*, c.name as category_name, s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN suppliers s ON s.id = p.supplier_id
      WHERE p.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function createProduct(req, res, next) {
  try {
    const { sku, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, reorder_quantity, unit, location } = req.body;

    if (!sku || !name) return res.status(400).json({ error: 'SKU and name are required' });

    const result = await query(`
      INSERT INTO products (sku, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, reorder_quantity, unit, location)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *
    `, [sku, name, description, category_id, supplier_id, unit_price || 0, cost_price || 0, current_stock || 0, min_stock_level || 10, max_stock_level || 1000, reorder_quantity || 100, unit || 'units', location]);

    // Log initial stock if any
    if (current_stock > 0) {
      await query(`
        INSERT INTO stock_movements (product_id, type, quantity, reference, notes, performed_by)
        VALUES ($1, 'in', $2, 'INITIAL', 'Initial stock entry', $3)
      `, [result.rows[0].id, current_stock, req.user.id]);
    }

    await cacheDelPattern('dashboard:*');
    res.status(201).json({ product: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function updateProduct(req, res, next) {
  try {
    const { name, description, category_id, supplier_id, unit_price, cost_price, min_stock_level, max_stock_level, reorder_quantity, unit, location, status } = req.body;

    const result = await query(`
      UPDATE products SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        category_id = COALESCE($3, category_id),
        supplier_id = COALESCE($4, supplier_id),
        unit_price = COALESCE($5, unit_price),
        cost_price = COALESCE($6, cost_price),
        min_stock_level = COALESCE($7, min_stock_level),
        max_stock_level = COALESCE($8, max_stock_level),
        reorder_quantity = COALESCE($9, reorder_quantity),
        unit = COALESCE($10, unit),
        location = COALESCE($11, location),
        status = COALESCE($12, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13 RETURNING *
    `, [name, description, category_id, supplier_id, unit_price, cost_price, min_stock_level, max_stock_level, reorder_quantity, unit, location, status, req.params.id]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    await cacheDelPattern('dashboard:*');
    res.json({ product: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function adjustStock(req, res, next) {
  try {
    const { type, quantity, reference, notes } = req.body;
    const productId = req.params.id;

    if (!type || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Valid type and quantity required' });
    }
    if (!['in', 'out', 'adjustment'].includes(type)) {
      return res.status(400).json({ error: 'Type must be in, out, or adjustment' });
    }

    const productResult = await query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [productId]);
    if (productResult.rows.length === 0) return res.status(404).json({ error: 'Product not found' });

    const product = productResult.rows[0];

    let newStock;
    if (type === 'in') newStock = product.current_stock + parseInt(quantity);
    else if (type === 'out') {
      if (product.current_stock < quantity) {
        return res.status(400).json({ error: `Insufficient stock. Available: ${product.current_stock}` });
      }
      newStock = product.current_stock - parseInt(quantity);
    } else {
      newStock = parseInt(quantity); // direct adjustment
    }

    await query('UPDATE products SET current_stock = $1, updated_at = NOW() WHERE id = $2', [newStock, productId]);
    
    await query(`
      INSERT INTO stock_movements (product_id, type, quantity, reference, notes, performed_by)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [productId, type, quantity, reference, notes, req.user.id]);

    await cacheDelPattern('dashboard:*');
    await cacheDelPattern(`forecast:${productId}*`);

    res.json({ product: { ...product, current_stock: newStock }, newStock });
  } catch (err) {
    next(err);
  }
}

async function getStockMovements(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const productId = req.params.id;
    const offset = (page - 1) * limit;

    const result = await query(`
      SELECT sm.*, u.name as performed_by_name
      FROM stock_movements sm
      LEFT JOIN users u ON u.id = sm.performed_by
      WHERE sm.product_id = $1
      ORDER BY sm.created_at DESC
      LIMIT $2 OFFSET $3
    `, [productId, limit, offset]);

    res.json({ movements: result.rows });
  } catch (err) {
    next(err);
  }
}

async function getCategories(req, res, next) {
  try {
    const result = await query('SELECT * FROM categories ORDER BY name ASC');
    res.json({ categories: result.rows });
  } catch (err) {
    next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const { name, description, color } = req.body;
    const result = await query(
      'INSERT INTO categories (name, description, color) VALUES ($1, $2, $3) RETURNING *',
      [name, description, color || '#6366f1']
    );
    res.status(201).json({ category: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function deleteProduct(req, res, next) {
  try {
    await query('UPDATE products SET status = $1 WHERE id = $2', ['archived', req.params.id]);
    await cacheDelPattern('dashboard:*');
    res.json({ message: 'Product archived successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProducts, getProduct, createProduct, updateProduct, adjustStock, getStockMovements, getCategories, createCategory, deleteProduct };
