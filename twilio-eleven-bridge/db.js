import sqlite3Pkg from 'sqlite3';
const sqlite3 = sqlite3Pkg.verbose();
const db = new sqlite3.Database('./userRequests.sqlite3');

// Initialize the table
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS user_requests (
      username TEXT PRIMARY KEY,
      requests TEXT
    )
  `);
});

export default db;
