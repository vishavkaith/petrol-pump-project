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
  console.log('🔍 Checking NOZZLE table...');

  const columns = db
    .prepare(`PRAGMA table_info(NOZZLE)`)
    .all()
    .map(c => c.name);

  // ---- TYPE ----
  if (!columns.includes('TYPE')) {
    db.exec(`ALTER TABLE NOZZLE ADD COLUMN TYPE TEXT;`);
    console.log('✓ TYPE column added');
  } else {
    console.log('✓ TYPE already exists');
  }

  // ---- ACTIVE ----
  if (!columns.includes('ACTIVE')) {
    db.exec(`ALTER TABLE NOZZLE ADD COLUMN ACTIVE INTEGER DEFAULT 1;`);
    console.log('✓ ACTIVE column added');
  } else {
    console.log('✓ ACTIVE already exists');
  }

  // ---- CREATED_AT ----
  if (!columns.includes('CREATED_AT')) {
    db.exec(
      `ALTER TABLE NOZZLE ADD COLUMN CREATED_AT DATETIME DEFAULT CURRENT_TIMESTAMP;`
    );
    console.log('✓ CREATED_AT column added');
  } else {
    console.log('✓ CREATED_AT already exists');
  }

  console.log('✅ NOZZLE table migration completed successfully');

} catch (err) {
  console.error('❌ Migration failed:', err.message);
} finally {
  db.close();
  console.log('🔒 Database connection closed');
}