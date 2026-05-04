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
  console.log('🔍 Checking SHIFT_NOZZLE_DSM table...');

  const columns = db
    .prepare(`PRAGMA table_info(SHIFT_NOZZLE_DSM)`)
    .all()
    .map(c => c.name);

  if (!columns.includes('PID')) {
    console.log('➕ Adding PID column to SHIFT_NOZZLE_DSM...');
    db.exec(`ALTER TABLE SHIFT_NOZZLE_DSM ADD COLUMN PID INTEGER;`);

    // Optional: backfill PID from SHIFT table
    db.exec(`
      UPDATE SHIFT_NOZZLE_DSM
      SET PID = (
        SELECT PID FROM SHIFT
        WHERE SHIFT.ID = SHIFT_NOZZLE_DSM.SHIFT_ID
      )
      WHERE PID IS NULL
    `);

    console.log('✅ PID column added and backfilled');
  } else {
    console.log('✓ PID column already exists');
  }

  console.log('✅ Migration completed successfully');

} catch (err) {
  console.error('❌ Migration failed:', err.message);
} finally {
  db.close();
  console.log('🔒 Database connection closed');
}
