const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected to database');
    client.release();

    const migrationPath = path.join(__dirname, 'migrations', '001_seed_modules_and_questions.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('🔄 Running migration...');
    await pool.query(sql);
    console.log('✅ Migration completed successfully!');

    // Verify results
    const { rows: modules } = await pool.query('SELECT COUNT(*) FROM modules');
    const { rows: questions } = await pool.query('SELECT COUNT(*) FROM questions');
    const { rows: options } = await pool.query('SELECT COUNT(*) FROM question_options');

    console.log('\n📊 Migration Results:');
    console.log('   Modules: ' + modules[0].count);
    console.log('   Questions: ' + questions[0].count);
    console.log('   Options: ' + options[0].count);
    console.log('   Expected: 8 modules, 40 questions, 160 options\n');

    if (modules[0].count !== '8' || questions[0].count !== '40' || options[0].count !== '160') {
      console.warn('⚠️  Warning: Counts do not match expected values. Please check the migration file.');
    } else {
      console.log('✅ All data migrated successfully!');
    }
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
