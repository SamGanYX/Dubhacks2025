// src/database.js
import knex from 'knex';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use a file in the root, e.g., 'db.sqlite'
const dbPath = path.resolve(__dirname, '..', 'db.sqlite');

const db = knex({
  client: 'sqlite3',
  connection: {
    filename: dbPath,
  },
  useNullAsDefault: true,
});

export default db;