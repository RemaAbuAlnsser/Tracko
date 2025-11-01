import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function checkTypes() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'tracko',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connected to database');

    // Get distinct types
    const [rows] = await connection.query('SELECT DISTINCT type FROM notifications');
    
    console.log('📊 Current notification types in database:');
    rows.forEach(row => {
      console.log(`   - ${row.type}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTypes();
