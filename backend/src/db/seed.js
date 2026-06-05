const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Starting database seed...');

    // Users
    const adminHash = await bcrypt.hash('admin123', 12);
    const staffHash = await bcrypt.hash('staff123', 12);

    await client.query(`
      INSERT INTO users (name, email, password_hash, role, avatar_color) VALUES
        ('Admin User', 'admin@inventory.com', $1, 'admin', '#6366f1'),
        ('Sarah Chen', 'sarah@inventory.com', $2, 'staff', '#22d3ee'),
        ('Mike Johnson', 'mike@inventory.com', $2, 'staff', '#f59e0b')
      ON CONFLICT (email) DO NOTHING
    `, [adminHash, staffHash]);
    console.log('✅ Users seeded');

    // Categories
    await client.query(`
      INSERT INTO categories (name, description, color) VALUES
        ('Electronics', 'Electronic components and devices', '#6366f1'),
        ('Office Supplies', 'Stationery and office materials', '#22d3ee'),
        ('Raw Materials', 'Manufacturing raw materials', '#f59e0b'),
        ('Packaging', 'Boxes, bags, and packaging materials', '#10b981'),
        ('Machinery Parts', 'Spare parts and components', '#f43f5e'),
        ('Safety Equipment', 'PPE and safety gear', '#8b5cf6')
      ON CONFLICT (name) DO NOTHING
    `);
    console.log('✅ Categories seeded');

    // Suppliers
    await client.query(`
      INSERT INTO suppliers (name, contact_person, email, phone, address, lead_time_days, rating, status) VALUES
        ('TechSupply Co.', 'James Wong', 'james@techsupply.com', '+1-555-0101', '123 Tech Park, Silicon Valley, CA', 5, 4.8, 'active'),
        ('Global Parts Ltd.', 'Maria Santos', 'maria@globalparts.com', '+1-555-0102', '456 Commerce St, Chicago, IL', 10, 4.2, 'active'),
        ('Swift Logistics', 'David Kumar', 'david@swiftlog.com', '+1-555-0103', '789 Logistics Ave, Dallas, TX', 3, 4.6, 'active'),
        ('Prime Materials Inc.', 'Emma Wilson', 'emma@primemats.com', '+1-555-0104', '321 Industrial Blvd, Detroit, MI', 14, 3.9, 'active'),
        ('SafeGear Pro', 'Robert Lee', 'robert@safegear.com', '+1-555-0105', '555 Safety Lane, Houston, TX', 7, 4.5, 'active')
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Suppliers seeded');

    const categoryRes = await client.query('SELECT id, name FROM categories');
    const cats = {};
    categoryRes.rows.forEach(r => cats[r.name] = r.id);

    const supplierRes = await client.query('SELECT id, name FROM suppliers');
    const supps = {};
    supplierRes.rows.forEach(r => supps[r.name] = r.id);

    // Products
    const products = [
      { sku: 'ELEC-001', name: 'Raspberry Pi 4 (4GB)', cat: 'Electronics', supp: 'TechSupply Co.', cost: 45, price: 69.99, stock: 85, min: 20, max: 200, reorder: 50, unit: 'units', location: 'A-01' },
      { sku: 'ELEC-002', name: 'Arduino Mega 2560', cat: 'Electronics', supp: 'TechSupply Co.', cost: 18, price: 34.99, stock: 8, min: 15, max: 150, reorder: 40, unit: 'units', location: 'A-02' },
      { sku: 'ELEC-003', name: 'USB-C Power Adapter 65W', cat: 'Electronics', supp: 'TechSupply Co.', cost: 12, price: 24.99, stock: 0, min: 25, max: 300, reorder: 75, unit: 'units', location: 'A-03' },
      { sku: 'ELEC-004', name: 'HDMI Cable 2.0 (2m)', cat: 'Electronics', supp: 'Global Parts Ltd.', cost: 4.5, price: 12.99, stock: 142, min: 30, max: 400, reorder: 100, unit: 'units', location: 'A-04' },
      { sku: 'ELEC-005', name: 'LED Driver Module 12V', cat: 'Electronics', supp: 'TechSupply Co.', cost: 8.5, price: 18.99, stock: 12, min: 20, max: 200, reorder: 50, unit: 'units', location: 'A-05' },
      { sku: 'OFF-001', name: 'A4 Copy Paper (500 sheets)', cat: 'Office Supplies', supp: 'Swift Logistics', cost: 4, price: 8.99, stock: 320, min: 50, max: 1000, reorder: 200, unit: 'reams', location: 'B-01' },
      { sku: 'OFF-002', name: 'Ballpoint Pens (Box of 50)', cat: 'Office Supplies', supp: 'Swift Logistics', cost: 6, price: 12.99, stock: 45, min: 10, max: 200, reorder: 50, unit: 'boxes', location: 'B-02' },
      { sku: 'OFF-003', name: 'Stapler Heavy Duty', cat: 'Office Supplies', supp: 'Global Parts Ltd.', cost: 8, price: 15.99, stock: 5, min: 8, max: 50, reorder: 15, unit: 'units', location: 'B-03' },
      { sku: 'RAW-001', name: 'Aluminum Sheet 2mm (1m x 2m)', cat: 'Raw Materials', supp: 'Prime Materials Inc.', cost: 24, price: 45.00, stock: 78, min: 20, max: 200, reorder: 40, unit: 'sheets', location: 'C-01' },
      { sku: 'RAW-002', name: 'Copper Wire 1.5mm (100m)', cat: 'Raw Materials', supp: 'Prime Materials Inc.', cost: 35, price: 65.00, stock: 3, min: 10, max: 100, reorder: 25, unit: 'rolls', location: 'C-02' },
      { sku: 'RAW-003', name: 'Steel Bolts M8 (Box 100)', cat: 'Raw Materials', supp: 'Global Parts Ltd.', cost: 12, price: 22.00, stock: 210, min: 50, max: 500, reorder: 100, unit: 'boxes', location: 'C-03' },
      { sku: 'PKG-001', name: 'Cardboard Boxes 30x20x15cm', cat: 'Packaging', supp: 'Swift Logistics', cost: 0.8, price: 1.99, stock: 650, min: 100, max: 2000, reorder: 500, unit: 'units', location: 'D-01' },
      { sku: 'PKG-002', name: 'Bubble Wrap Roll 50m', cat: 'Packaging', supp: 'Swift Logistics', cost: 14, price: 28.00, stock: 22, min: 10, max: 100, reorder: 20, unit: 'rolls', location: 'D-02' },
      { sku: 'PKG-003', name: 'Packing Tape 48mm (6 rolls)', cat: 'Packaging', supp: 'Swift Logistics', cost: 5, price: 9.99, stock: 0, min: 15, max: 200, reorder: 50, unit: 'packs', location: 'D-03' },
      { sku: 'MACH-001', name: 'Conveyor Belt Motor 1HP', cat: 'Machinery Parts', supp: 'Global Parts Ltd.', cost: 185, price: 320.00, stock: 6, min: 3, max: 20, reorder: 5, unit: 'units', location: 'E-01' },
      { sku: 'MACH-002', name: 'Bearing 6205-2RS (Pack 10)', cat: 'Machinery Parts', supp: 'Global Parts Ltd.', cost: 28, price: 55.00, stock: 34, min: 10, max: 100, reorder: 20, unit: 'packs', location: 'E-02' },
      { sku: 'SAFE-001', name: 'Hard Hat EN397 Class A', cat: 'Safety Equipment', supp: 'SafeGear Pro', cost: 14, price: 28.00, stock: 47, min: 15, max: 150, reorder: 30, unit: 'units', location: 'F-01' },
      { sku: 'SAFE-002', name: 'Safety Gloves Cut Level 5', cat: 'Safety Equipment', supp: 'SafeGear Pro', cost: 8, price: 16.00, stock: 9, min: 20, max: 200, reorder: 50, unit: 'pairs', location: 'F-02' },
      { sku: 'SAFE-003', name: 'Safety Goggles ANSI Z87.1', cat: 'Safety Equipment', supp: 'SafeGear Pro', cost: 7, price: 14.99, stock: 28, min: 10, max: 100, reorder: 20, unit: 'units', location: 'F-03' },
      { sku: 'ELEC-006', name: 'ESP32 Development Board', cat: 'Electronics', supp: 'TechSupply Co.', cost: 7.5, price: 15.99, stock: 62, min: 20, max: 200, reorder: 50, unit: 'units', location: 'A-06' },
    ];

    const productIds = [];
    const adminRes = await client.query("SELECT id FROM users WHERE email = 'admin@inventory.com'");
    const adminId = adminRes.rows[0].id;

    for (const p of products) {
      const res = await client.query(`
        INSERT INTO products (sku, name, category_id, supplier_id, cost_price, unit_price, current_stock, min_stock_level, max_stock_level, reorder_quantity, unit, location)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        ON CONFLICT (sku) DO NOTHING
        RETURNING id
      `, [p.sku, p.name, cats[p.cat], supps[p.supp], p.cost, p.price, p.stock, p.min, p.max, p.reorder, p.unit, p.location]);

      if (res.rows.length > 0) {
        productIds.push({ id: res.rows[0].id, stock: p.stock });
        if (p.stock > 0) {
          await client.query(`
            INSERT INTO stock_movements (product_id, type, quantity, reference, notes, performed_by)
            VALUES ($1, 'in', $2, 'SEED-INIT', 'Initial stock', $3)
          `, [res.rows[0].id, p.stock, adminId]);
        }
      }
    }
    console.log('✅ Products seeded');

    // Generate 30 days of historical movements
    const allProducts = await client.query('SELECT id, current_stock FROM products');
    const now = new Date();

    for (let day = 30; day >= 1; day--) {
      const date = new Date(now);
      date.setDate(date.getDate() - day);
      const dateStr = date.toISOString();

      const productsToMove = allProducts.rows.filter(() => Math.random() > 0.5);
      for (const prod of productsToMove) {
        const qty = Math.floor(Math.random() * 15) + 1;
        await client.query(`
          INSERT INTO stock_movements (product_id, type, quantity, reference, notes, performed_by, created_at)
          VALUES ($1, 'out', $2, 'SALE', 'Historical demand', $3, $4)
        `, [prod.id, qty, adminId, dateStr]);
      }
    }
    console.log('✅ Historical movements seeded');

    // Purchase orders
    const productsList = await client.query('SELECT id, cost_price, supplier_id FROM products LIMIT 10');
    const supplierList = await client.query('SELECT id FROM suppliers LIMIT 3');

    const orderData = [
      { supp: supplierList.rows[0].id, status: 'received', days: 20 },
      { supp: supplierList.rows[1].id, status: 'ordered', days: 3 },
      { supp: supplierList.rows[2].id, status: 'pending', days: 1 },
    ];

    for (const [i, od] of orderData.entries()) {
      const poNum = `PO-SEED-00${i + 1}`;
      const orderRes = await client.query(`
        INSERT INTO purchase_orders (po_number, supplier_id, status, total_amount, created_by, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '${od.days} days')
        ON CONFLICT (po_number) DO NOTHING
        RETURNING id
      `, [poNum, od.supp, od.status, Math.floor(Math.random() * 5000) + 1000, adminId]);

      if (orderRes.rows.length > 0) {
        const orderId = orderRes.rows[0].id;
        for (const prod of productsList.rows.slice(i * 3, i * 3 + 3)) {
          await client.query(`
            INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_cost)
            VALUES ($1, $2, $3, $4)
          `, [orderId, prod.id, Math.floor(Math.random() * 50) + 10, prod.cost_price]);
        }
      }
    }
    console.log('✅ Purchase orders seeded');

    console.log('\n🎉 Seed complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Login Credentials:');
    console.log('  Admin: admin@inventory.com / admin123');
    console.log('  Staff: sarah@inventory.com / staff123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (err) {
    console.error('❌ Seed error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
