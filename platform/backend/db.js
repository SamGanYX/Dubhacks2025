// db-init.js
import sqlite3Pkg from 'sqlite3';
const sqlite3 = sqlite3Pkg.verbose();
const db = new sqlite3.Database('./db.sqlite');

// Initialize the companies table
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      domain TEXT NOT NULL,
      industry TEXT NOT NULL,
      size TEXT,
      contactEmail TEXT NOT NULL,
      phoneNumber TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      jiraConfig TEXT,
      serviceDeskConfig TEXT,
      subscription TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes
  db.run(`CREATE INDEX IF NOT EXISTS idx_domain ON companies(domain)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_email ON companies(contactEmail)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_status ON companies(status)`);

  console.log("✅ companies table initialized (if not exists)");
});

export default db;
