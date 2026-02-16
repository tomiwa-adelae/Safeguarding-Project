// ═══════════════════════════════════════════════════════════════
// Run Authentication Migration
// ═══════════════════════════════════════════════════════════════

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'false' ? false : (
      process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
    )
  });

  try {
    console.log('🔄 Connecting to database...');
    const client = await pool.connect();

    console.log('✅ Connected successfully');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '002_add_password_authentication.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('🔄 Running authentication migration...');

    // Execute migration
    await client.query(migrationSQL);

    console.log('✅ Migration completed successfully!');

    // Check results
    const { rows } = await client.query(`
      SELECT COUNT(*) as user_count,
             SUM(CASE WHEN password_reset_required = TRUE THEN 1 ELSE 0 END) as needs_password
      FROM users
    `);

    console.log('\n📊 Database Status:');
    console.log(`   - Total users: ${rows[0].user_count}`);
    console.log(`   - Users needing password setup: ${rows[0].needs_password}`);

    client.release();
    await pool.end();

    console.log('\n✅ All done! You can now start your server with: npm start');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error(err);
    process.exit(1);
  }
}

runMigration();
