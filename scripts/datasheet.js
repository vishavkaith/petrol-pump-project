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
  console.log('🔍 Checking DATASHEET table...');

  const tableExists = db
    .prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='DATASHEET';`
    )
    .get();
 if (tableExists) {
    console.log('🗑️ Dropping existing DATASHEET table...');
    db.exec(`DROP TABLE IF EXISTS DATASHEET`);
    console.log('✓ Old DATASHEET table dropped');
  }

  if (!tableExists) {
    console.log('➕ Creating DATASHEET table...');

    db.exec(`
     CREATE TABLE DATASHEET (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  TANK_METADATA_ID INTEGER NOT NULL,
  HEIGHT INTEGER NOT NULL,
  CMV REAL NOT NULL,
  MMV REAL NOT NULL,
  UNIQUE (TANK_METADATA_ID, HEIGHT),
  FOREIGN KEY (TANK_METADATA_ID) REFERENCES TANK_METADATA(ID)
);
    `);

    console.log('✓ DATASHEET table created');
  } else {
    console.log('✓ DATASHEET table already exists');
  }

  console.log('✅ DATASHEET migration completed successfully');

} catch (err) {
  console.error('❌ DATASHEET migration failed:', err.message);
} finally {
  db.close();
  console.log('🔒 Database connection closed');
}
