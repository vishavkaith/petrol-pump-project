const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// ------------------
// Resolve DB path (SAME as app)
// ------------------
const dbDir = path.join(
  process.env.APPDATA || __dirname,
  'PetrolApp'
);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'petrol.db');
console.log('📂 Using DB:', dbPath);

// ------------------
// Open DB
// ------------------
const db = new Database(dbPath);

try {
  console.log('🔍 Checking FUEL_RECEIPT table...');

  const tableExists = db
    .prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='FUEL_RECEIPT'`
    )
    .get();

  if (tableExists) {
    console.log('🗑️ Dropping existing FUEL_RECEIPT table...');
    db.exec(`DROP TABLE IF EXISTS FUEL_RECEIPT`);
    console.log('✓ Old FUEL_RECEIPT table dropped');
  }

  console.log('➕ Creating FUEL_RECEIPT table...');

  db.exec(`
    CREATE TABLE FUEL_RECEIPT (
      ID INTEGER PRIMARY KEY AUTOINCREMENT,
      PID INTEGER,
      TT TEXT,
      TID INTEGER,
      PRO_ID INTEGER,
      INVOICE_NO TEXT,
      INVOICE_DATE TEXT,
      INVOICE_AMOUNT REAL,
      INVOICE_QTY REAL,
      INVOICE_TEMP REAL,
      RO_TEMP REAL,
      INVOICE_DENSITY REAL,
      RO_COMPOSITE_DENSITY REAL,
      TVA REAL,
      SHORT_REPORT TEXT,
      FREIGHT_INVOICE_NO TEXT,
      FREIGHT_INVOICE_AMOUNT REAL,
      CREATED_AT DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✓ FUEL_RECEIPT table created successfully');
  console.log('✅ FUEL_RECEIPT migration completed');

} catch (err) {
  console.error('❌ FUEL_RECEIPT migration failed:', err.message);
} finally {
  db.close();
  console.log('🔒 Database connection closed');
}
