import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkTable() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'tracko'
    });

    console.log('✅ Connected to database');
    console.log('📋 Checking Internships table structure...\n');
    
    const [columns] = await connection.query('DESCRIBE Internships');
    
    console.log('Table: Internships');
    console.log('─'.repeat(80));
    
    columns.forEach(col => {
      console.log(`${col.Field.padEnd(30)} | ${col.Type.padEnd(25)} | ${col.Null.padEnd(5)}`);
    });
    
    console.log('─'.repeat(80));
    
    // Check for missing columns
    const requiredColumns = ['min_gpa', 'work_mode'];
    const existingColumns = columns.map(col => col.Field);
    
    console.log('\n🔍 Required columns status:');
    requiredColumns.forEach(colName => {
      const exists = existingColumns.includes(colName);
      console.log(`  ${exists ? '✅' : '❌'} ${colName}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTable();
