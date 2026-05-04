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
  console.log('🔍 Checking SHIFT_COLLECTION table...');

  const columns = db
    .prepare(`PRAGMA table_info(SHIFT_COLLECTION)`)
    .all()
    .map(c => c.name);

  

  // ---- ACTIVE ----
  if (!columns.includes('PID')) {
    db.exec(`ALTER TABLE SHIFT_COLLECTION ADD COLUMN PID  INTEGER DEFAULT 0;`);
    console.log('✓ PID column added');
  } else {
    console.log('✓ PID already exists');
  }


  console.log('✅ SHIFT_COLLECTION table migration completed successfully');

} catch (err) {
  console.error('❌ Migration failed:', err.message);
} finally {
  db.close();
  console.log('🔒 Database connection closed');
}