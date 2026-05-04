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
  console.log('🔍 Checking PRODUCT table...');

  const tableExists = db
    .prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='PRODUCT'`
    )
    .get();

  if (tableExists) {
    console.log('🗑️ Dropping existing PRODUCT table...');
    db.exec(`DROP TABLE IF EXISTS PRODUCT`);
    console.log('✓ Old PRODUCT table dropped');
  }

  console.log('➕ Creating PRODUCT table...');

  db.exec(`
 CREATE TABLE IF NOT EXISTS PRODUCT (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    PID INTEGER NOT NULL,
    NAME TEXT NOT NULL,
    
    -- 0 = Non-Fuel, 1 = Fuel
    TYPE INTEGER NOT NULL CHECK (TYPE IN (0,1)),

    PRICE REAL DEFAULT 0,

    -- If 1 = Stock managed via inventory ledger
    -- If 0 = Ignore stock (services, etc.)
    MANAGE_STOCK INTEGER DEFAULT 1 CHECK (MANAGE_STOCK IN (0,1)),

    ACTIVE INTEGER DEFAULT 1 CHECK (ACTIVE IN (0,1)),

    CREATED_AT DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (PID) REFERENCES PETROLPUMP(ID)
)
  `);

  console.log('✓ PRODUCT table created successfully');
  console.log('✅ PRODUCT migration completed');

} catch (err) {
  console.error('❌ PRODUCT  migration failed:', err.message);
} finally {
  db.close();
  console.log('🔒 Database connection closed');
}
