import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function addInternshipColumns() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'tracko'
    });

    console.log('✅ Connected to database');
    
    const sqlFilePath = path.join(__dirname, '../migrations/004_add_internship_columns.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📝 Executing SQL migration...');
    console.log(sql);
    
    await connection.query(sql);
    
    console.log('✅ Columns added successfully!');
    console.log('');
    console.log('Added columns to Internships table:');
    console.log('  - min_gpa (DECIMAL(3,2)) - Minimum GPA requirement');
    console.log('  - work_mode (ENUM) - remote, on-site, or hybrid');
    
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

addInternshipColumns()
  .then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
