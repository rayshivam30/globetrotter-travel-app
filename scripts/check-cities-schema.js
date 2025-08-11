const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function checkCitiesSchema() {
  try {
    // Check if cities table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'cities'
      )
    `);

    if (!tableExists.rows[0].exists) {
      console.log('Cities table does not exist');
      return;
    }

    // Get columns in cities table
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'cities'
      ORDER BY ordinal_position
    `);

    console.log('Cities table columns:');
    console.table(columns.rows);

    // Get a sample row to see the data
    const sample = await pool.query('SELECT * FROM cities LIMIT 1');
    console.log('\nSample city data:');
    console.log(sample.rows[0]);

  } catch (error) {
    console.error('Error checking cities schema:');
    console.error(error);
  } finally {
    await pool.end();
  }
}

checkCitiesSchema();
