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
    console.log('📋 Checking notifications table structure...\n');
    
    const [columns] = await connection.query('DESCRIBE notifications');
    
    console.log('Table: notifications');
    console.log('─'.repeat(100));
    
    columns.forEach(col => {
      console.log(`${col.Field.padEnd(20)} | ${col.Type.padEnd(40)} | ${col.Null.padEnd(5)} | ${col.Default || 'NULL'}`);
    });
    
    console.log('─'.repeat(100));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTable();
