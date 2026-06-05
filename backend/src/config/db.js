const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('neon')
    ? { rejectUnauthorized: false }
    : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL client error:', err);
});

const query = (text, params) => pool.query(text, params);

async function initDb() {
  const client = await pool.connect();
  try {
    console.log('✅ PostgreSQL connected successfully');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'staff',
        avatar_color VARCHAR(20) DEFAULT '#6366f1',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        color VARCHAR(20) DEFAULT '#6366f1',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        lead_time_days INTEGER DEFAULT 7,
        rating DECIMAL(3,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        sku VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
        unit_price DECIMAL(10,2) DEFAULT 0,
        cost_price DECIMAL(10,2) DEFAULT 0,
        current_stock INTEGER DEFAULT 0,
        min_stock_level INTEGER DEFAULT 10,
        max_stock_level INTEGER DEFAULT 1000,
        reorder_quantity INTEGER DEFAULT 100,
        unit VARCHAR(50) DEFAULT 'units',
        location VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS stock_movements (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        quantity INTEGER NOT NULL,
        reference VARCHAR(255),
        notes TEXT,
        performed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS purchase_orders (
        id SERIAL PRIMARY KEY,
        po_number VARCHAR(100) UNIQUE NOT NULL,
        supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'pending',
        total_amount DECIMAL(10,2) DEFAULT 0,
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expected_date DATE,
        received_date TIMESTAMP,
        notes TEXT,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS purchase_order_items (
        id SERIAL PRIMARY KEY,
        purchase_order_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL,
        unit_cost DECIMAL(10,2) NOT NULL,
        received_quantity INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        severity VARCHAR(50) DEFAULT 'warning',
        is_read BOOLEAN DEFAULT FALSE,
        is_dismissed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Database schema initialized');
  } catch (err) {
    console.error('❌ DB init error:', err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { query, pool, initDb };
