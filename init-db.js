const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'petrolpump.db');
const schemaPath = path.join(__dirname, 'DBScripts', 'schema.sql');

const db = new Database(dbPath);

try {
    // Read and execute schema file
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    statements.forEach(stmt => {
        try {
            db.exec(stmt + ';');
        } catch (err) {
            if (!err.message.includes('already exists')) {
                console.error('Error executing statement:', err.message);
            }
        }
    });

    console.log('✓ Database schema initialized successfully!');
} catch (err) {
    console.error('Error reading or executing schema:', err.message);
} finally {
    db.close();
}
