// db.js
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./userRequests.sqlite3");

// Initialize the table
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS user_requests (
      username TEXT PRIMARY KEY,
      requests TEXT
    )
  `);
});

module.exports = db;
