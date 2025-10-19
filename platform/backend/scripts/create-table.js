// scripts/create-table.js
import db from '../src/database.js'; // Import your new knex connection

const TABLE_NAME = 'companies';

const createTable = async () => {
  console.log(`🚀 Checking for table: ${TABLE_NAME}`);
  
  const exists = await db.schema.hasTable(TABLE_NAME);
  
  if (exists) {
    console.log(`ℹ️ Table ${TABLE_NAME} already exists`);
    return;
  }

  console.log(`✨ Creating table: ${TABLE_NAME}`);
  
  try {
    await db.schema.createTable(TABLE_NAME, (table) => {
      // Main columns
      table.string('id').primary();
      table.string('name').notNullable();
      table.string('domain').notNullable();
      table.string('industry').notNullable();
      table.string('size');
      table.string('contactEmail').notNullable();
      table.string('phoneNumber');
      table.string('status').notNullable().defaultTo('pending');
      
      // Store complex objects as JSON strings
      table.json('jiraConfig');
      table.json('serviceDeskConfig');
      table.json('subscription');
      
      // Timestamps
      table.timestamp('createdAt').defaultTo(db.fn.now());
      table.timestamp('updatedAt').defaultTo(db.fn.now());

      // Indexes (replaces your GSIs)
      table.index('domain', 'idx_domain');
      table.index('contactEmail', 'idx_email');
      table.index('status', 'idx_status');
    });
    
    console.log(`✅ Table ${TABLE_NAME} created successfully`);
    console.log(`   - Primary Key: id`);
    console.log(`   - Indexes on: domain, contactEmail, status`);
    console.log(`   - Billing: N/A (local SQLite file)`);

  } catch (error) {
    console.error('❌ Error creating table:', error);
    process.exit(1);
  }
};

// Run the script
createTable()
  .then(() => {
    console.log('🎉 SQLite table setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to create table:', error);
    process.exit(1);
  });