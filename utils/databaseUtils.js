const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const logger = require('./../logger');

// ------------------
// Database location
// ------------------
const dbDir = path.join(
  process.env.APPDATA || __dirname,
  'PetrolApp'
);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'petrol.db');

// ------------------
// Open SQLite DB
// ------------------
const db = new Database(dbPath);

// ------------------
// Initialize database schema
// ------------------
function initializeDatabase() {
  try {
    const schemaPath = path.join(__dirname, '../DBScripts/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      db.exec(schema);
      console.log('Database schema initialized successfully');
    } else {
      console.warn('Database schema file not found at:', schemaPath);
    }
  } catch (err) {
    console.error('Error initializing database schema:', err);
    logger.logError(err);
  }
}

// Initialize database on module load
initializeDatabase();

// ------------------
// Basic error-safe wrapper
// ------------------
function executeQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    try {
      console.log('Executing query:', query);
      console.log('With parameters:', params);

      let result;

      // Detect SELECT vs others
      if (/^\s*select/i.test(query)) {
        result = db.prepare(query).all(params);
      } else {
        result = db.prepare(query).run(params);
      }

      console.log('Query result:', result ? (Array.isArray(result) ? result.length + ' rows' : 'success') : 'null');
      resolve(result);

    } catch (err) {
      err.sqliteQuery = query;
      err.sqliteParams = params;
      console.error('SQLITE_ERROR in query:', query);
      console.error('Parameters:', params);
      console.error('Error details:', err.message);
      logger.logError(err);

      resolve(null); // Resolve with null instead of rejecting to prevent crashes
    }
  });
}

module.exports = {
  executeQuery,
  executePlainQuery: executeQuery,
  db   // exported in case you need direct access later
};