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
  console.log('🔍 Checking TRANSPORT table...');

  const tableExists = db
    .prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='TRANSPORT'`
    )
    .get();

  if (tableExists) {
    console.log('🗑️ Dropping existing TRANSPORT table...');
    db.exec(`DROP TABLE IF EXISTS TRANSPORT`);
    console.log('✓ Old TRANSPORT table dropped');
  }

  console.log('➕ Creating FUEL_RECEIPT table...');

  db.exec(`
   CREATE TABLE TRANSPORT (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    PID INTEGER NOT NULL,

    -- Display / current usage
    NAME TEXT NOT NULL,

    -- Extra fields (future use)
    VEHICLE_NUMBER TEXT,
    DRIVER_NAME TEXT,
    PHONE TEXT,
    ACTIVE INTEGER DEFAULT 1,

    CREATED_AT DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (PID) REFERENCES PETROLPUMP(ID)

    );
  `);

  console.log('✓ TRANSPORT table created successfully');
  console.log('✅ TRANSPORT migration completed');

} catch (err) {
  console.error('❌ TRANSPORT migration failed:', err.message);
} finally {
  db.close();
  console.log('🔒 Database connection closed');
}
