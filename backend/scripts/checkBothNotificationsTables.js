import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkTables() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'tracko'
    });

    console.log('✅ Connected to database\n');
    
    // Check for Notifications (uppercase)
    console.log('🔍 Checking for "Notifications" table...');
    const [upperTables] = await connection.query(
      "SHOW TABLES LIKE 'Notifications'"
    );
    
    if (upperTables.length > 0) {
      console.log('✅ Found "Notifications" table');
      const [upperCount] = await connection.query('SELECT COUNT(*) as count FROM Notifications');
      console.log(`   Records: ${upperCount[0].count}\n`);
    } else {
      console.log('❌ "Notifications" table does not exist\n');
    }
    
    // Check for notifications (lowercase)
    console.log('🔍 Checking for "notifications" table...');
    const [lowerTables] = await connection.query(
      "SHOW TABLES LIKE 'notifications'"
    );
    
    if (lowerTables.length > 0) {
      console.log('✅ Found "notifications" table');
      const [lowerCount] = await connection.query('SELECT COUNT(*) as count FROM notifications');
      console.log(`   Records: ${lowerCount[0].count}\n`);
    } else {
      console.log('❌ "notifications" table does not exist\n');
    }
    
    // Show all tables
    console.log('📋 All tables in database:');
    const [allTables] = await connection.query('SHOW TABLES');
    allTables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`   - ${tableName}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTables();
