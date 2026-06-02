require("dotenv").config();
const db = require("../db");

async function migrateBuilderIdToTables() {
  try {
    console.log("Starting migration to add builder_id to data tables...");

    const tablesToMigrate = [
      { name: 'bills', hasSocietyId: true },
      { name: 'complaints', hasSocietyId: false },
      { name: 'documents', hasSocietyId: false },
      { name: 'chats', hasSocietyId: false },
      { name: 'notices', hasSocietyId: false },
      { name: 'visitors', hasSocietyId: false },
      { name: 'notifications', hasSocietyId: false },
      { name: 'products', hasSocietyId: false }
    ];

    for (const table of tablesToMigrate) {
      try {
        // Check if table exists
        const [tableExists] = await db.query(`
          SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_NAME='${table.name}'
        `);

        if (tableExists.length === 0) {
          console.log(`Table ${table.name} does not exist, skipping...`);
          continue;
        }

        // Check if builder_id column already exists
        const [columns] = await db.query(`
          SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_NAME='${table.name}' AND COLUMN_NAME='builder_id'
        `);

        if (columns.length > 0) {
          console.log(`✓ ${table.name} already has builder_id column`);
          continue;
        }

        console.log(`Adding builder_id to ${table.name} table...`);
        
        let alterSql;
        if (table.hasSocietyId) {
          alterSql = `
            ALTER TABLE ${table.name} 
            ADD COLUMN builder_id INT NULL AFTER society_id,
            ADD CONSTRAINT fk_${table.name}_builder FOREIGN KEY (builder_id) REFERENCES builders(id) ON DELETE RESTRICT
          `;
        } else {
          alterSql = `
            ALTER TABLE ${table.name} 
            ADD COLUMN builder_id INT NULL AFTER id,
            ADD CONSTRAINT fk_${table.name}_builder FOREIGN KEY (builder_id) REFERENCES builders(id) ON DELETE RESTRICT
          `;
        }

        await db.query(alterSql);
        console.log(`✓ Added builder_id to ${table.name} table`);
      } catch (error) {
        console.log(`Error migrating ${table.name}: ${error.message}`);
        // Continue with other tables
      }
    }

    console.log("Migration completed!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateBuilderIdToTables()
    .then(() => {
      console.log("All migrations completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

module.exports = migrateBuilderIdToTables;
