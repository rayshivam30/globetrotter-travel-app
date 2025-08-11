const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Read the SQL setup file
const sqlPath = path.join(__dirname, 'setup-database.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf8');

// Create database file
const dbPath = path.join(process.cwd(), 'globetrotter.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Execute the SQL setup
const statements = sqlContent.split(';').filter(stmt => stmt.trim());
statements.forEach(statement => {
  if (statement.trim()) {
    try {
      db.exec(statement);
      console.log('Executed:', statement.substring(0, 50) + '...');
    } catch (error) {
      console.error('Error executing statement:', error.message);
    }
  }
});

console.log('Database initialized successfully!');
db.close();
