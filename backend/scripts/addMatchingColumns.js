import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function addMatchingColumns() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'tracko'
    });

    console.log('✅ Connected to database');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '../migrations/003_add_matching_columns.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📝 Executing SQL migration...');
    console.log(sql);
    
    // Execute the SQL
    await connection.query(sql);
    
    console.log('✅ Columns added successfully!');
    console.log('');
    console.log('Added columns:');
    console.log('  - gpa_match (BOOLEAN)');
    console.log('  - gpa_message (TEXT)');
    console.log('  - work_mode_match (BOOLEAN)');
    console.log('  - work_mode_message (TEXT)');
    
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️  Columns already exist in the table');
    } else {
      console.error('❌ Error:', error.message);
      throw error;
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the script
addMatchingColumns()
  .then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
