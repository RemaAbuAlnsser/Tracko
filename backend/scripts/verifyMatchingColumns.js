import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function verifyColumns() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'tracko'
    });

    console.log('✅ Connected to database');
    console.log('📋 Checking Internship_Matches table structure...\n');
    
    const [columns] = await connection.query(
      'DESCRIBE Internship_Matches'
    );
    
    console.log('Table: Internship_Matches');
    console.log('─'.repeat(80));
    
    columns.forEach(col => {
      console.log(`${col.Field.padEnd(25)} | ${col.Type.padEnd(20)} | ${col.Null.padEnd(5)} | ${col.Key.padEnd(5)} | ${col.Default}`);
    });
    
    console.log('─'.repeat(80));
    
    // Check for the new columns
    const newColumns = ['gpa_match', 'gpa_message', 'work_mode_match', 'work_mode_message'];
    const existingColumns = columns.map(col => col.Field);
    
    console.log('\n✅ New columns status:');
    newColumns.forEach(colName => {
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

verifyColumns();
