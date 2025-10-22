import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function renameTable() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'tracko'
    });

    console.log('✅ Connected to database\n');
    
    // Check if old table exists
    console.log('🔍 Checking if Notifications table exists...');
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'Notifications'"
    );
    
    if (tables.length === 0) {
      console.log('⚠️  Table "Notifications" does not exist');
      console.log('✅ Checking if "notifications" already exists...');
      
      const [newTables] = await connection.query(
        "SHOW TABLES LIKE 'notifications'"
      );
      
      if (newTables.length > 0) {
        console.log('✅ Table "notifications" already exists. No action needed.');
      } else {
        console.log('❌ Neither "Notifications" nor "notifications" table exists!');
      }
      return;
    }
    
    console.log('✅ Found "Notifications" table\n');
    
    // Read and execute migration
    const sqlFilePath = path.join(__dirname, '../migrations/006_rename_notifications_table.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📝 Executing SQL migration:');
    console.log(sql);
    
    await connection.query(sql);
    
    console.log('✅ Table renamed successfully!');
    console.log('   Notifications → notifications');
    
    // Verify the change
    console.log('\n🔍 Verifying the change...');
    const [verifyTables] = await connection.query(
      "SHOW TABLES LIKE 'notifications'"
    );
    
    if (verifyTables.length > 0) {
      console.log('✅ Verification successful! Table "notifications" exists.');
    } else {
      console.log('❌ Verification failed! Table "notifications" not found.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

renameTable()
  .then(() => {
    console.log('\n✅ Operation completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Operation failed:', error);
    process.exit(1);
  });
