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
  console.log('🚀 Starting Inventory + POS Migration...\n');

  // ==============================
  // DROP TABLES (SAFE RESET)
  // ==============================
  console.log('🗑 Dropping old tables if exist...');

  db.exec(`
    DROP TABLE IF EXISTS POS_BILL_ITEMS;
    DROP TABLE IF EXISTS POS_BILL;
    DROP TABLE IF EXISTS INVENTORY_ADJUSTMENT;
    DROP TABLE IF EXISTS STOCK_SNAPSHOT;
    DROP TABLE IF EXISTS INVENTORY_LEDGER;
    DROP TABLE IF EXISTS FUEL_RATE;
  `);

  console.log('✓ Old tables dropped\n');

  // ==============================
  // FUEL_RATE
  // ==============================
  console.log('➕ Creating FUEL_RATE...');

  db.exec(`
    CREATE TABLE FUEL_RATE (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        PID INTEGER NOT NULL,
        PRODUCT_TYPE TEXT NOT NULL CHECK (PRODUCT_TYPE IN ('HSD','MS','EBMS')),
        RATE REAL NOT NULL,
        EFFECTIVE_FROM DATE NOT NULL,
        UNIQUE (PID, PRODUCT_TYPE, EFFECTIVE_FROM)
    );
  `);

  console.log('✓ FUEL_RATE created');

  // ==============================
  // INVENTORY_LEDGER
  // ==============================
  console.log('➕ Creating INVENTORY_LEDGER...');

  db.exec(`
    CREATE TABLE INVENTORY_LEDGER (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        PID INTEGER NOT NULL,
        PRODUCT_TYPE TEXT NOT NULL,
        TRANSACTION_DATE DATETIME NOT NULL,
        ENTRY_DATE DATETIME DEFAULT CURRENT_TIMESTAMP,
        SOURCE_TYPE TEXT NOT NULL CHECK (
            SOURCE_TYPE IN (
                'OPENING',
                'SHIFT_SALE',
                'PURCHASE',
                'ADJUSTMENT',
                'TRANSFER_IN',
                'TRANSFER_OUT',
                'POS_SALE'
            )
        ),
        SOURCE_ID INTEGER,
        QTY REAL NOT NULL,
        RATE REAL DEFAULT 0,
        AMOUNT REAL DEFAULT 0,
        REMARK TEXT,
        CREATED_BY INTEGER
    );
  `);

  db.exec(`
    CREATE INDEX IDX_LEDGER_PID_PRODUCT_DATE
    ON INVENTORY_LEDGER (PID, PRODUCT_TYPE, TRANSACTION_DATE);
  `);

  console.log('✓ INVENTORY_LEDGER created');

  // ==============================
  // STOCK_SNAPSHOT
  // ==============================
  console.log('➕ Creating STOCK_SNAPSHOT...');

  db.exec(`
    CREATE TABLE STOCK_SNAPSHOT (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        PID INTEGER,
        PRODUCT_TYPE TEXT,
        STOCK REAL,
        LAST_UPDATED DATETIME
    );
  `);

  console.log('✓ STOCK_SNAPSHOT created');

  // ==============================
  // INVENTORY_ADJUSTMENT
  // ==============================
  console.log('➕ Creating INVENTORY_ADJUSTMENT...');

  db.exec(`
    CREATE TABLE INVENTORY_ADJUSTMENT (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        PID INTEGER,
        PRODUCT_TYPE TEXT,
        QTY REAL,
        TRANSACTION_DATE DATETIME,
        REMARK TEXT,
        CREATED_BY INTEGER,
        CREATED_AT DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✓ INVENTORY_ADJUSTMENT created');

  // ==============================
  // POS_BILL
  // ==============================
  console.log('➕ Creating POS_BILL...');

  db.exec(`
    CREATE TABLE POS_BILL (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        PID INTEGER NOT NULL,
        SHIFT_ID INTEGER NOT NULL,
        BILL_NO TEXT NOT NULL,
        CASHIER_ID INTEGER NOT NULL,
        SUBTOTAL REAL DEFAULT 0,
        DISCOUNT REAL DEFAULT 0,
        TOTAL REAL DEFAULT 0,
        CREATED_AT DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✓ POS_BILL created');

  // ==============================
  // POS_BILL_ITEMS
  // ==============================
  console.log('➕ Creating POS_BILL_ITEMS...');

  db.exec(`
    CREATE TABLE POS_BILL_ITEMS (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        BILL_ID INTEGER NOT NULL,
        PRODUCT_ID INTEGER NOT NULL,
        QTY REAL NOT NULL,
        PRICE REAL NOT NULL,
        TOTAL REAL NOT NULL
    );
  `);

  console.log('✓ POS_BILL_ITEMS created');

  console.log('\n✅ INVENTORY + POS Migration Completed Successfully');

} catch (err) {
  console.error('❌ Migration failed:', err.message);
} finally {
  db.close();
  console.log('🔒 Database connection closed');
}
