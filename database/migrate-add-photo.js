const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateAddPhotoColumn() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'company_management',
    port: process.env.DB_PORT || 3306
  });

  try {
    console.log('Starting migration: Add Photo column to EMPLOYEE table...');

    // Check if column already exists
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM EMPLOYEE LIKE 'Photo'
    `);

    if (columns.length > 0) {
      console.log('✅ Photo column already exists. No migration needed.');
      return;
    }

    // Add Photo column
    await connection.query(`
      ALTER TABLE EMPLOYEE 
      ADD COLUMN Photo LONGTEXT AFTER Phone
    `);

    console.log('✅ Photo column added successfully!');
    console.log('Migration completed.');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run migration
if (require.main === module) {
  migrateAddPhotoColumn()
    .then(() => {
      console.log('\n✅ All migrations completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = migrateAddPhotoColumn;
