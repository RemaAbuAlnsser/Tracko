import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function runUpdate() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'tracko',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connected to database');

    // Read SQL file
    const sqlFile = path.join(__dirname, 'update_notifications_enum.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Execute the update
    await connection.query(sql);
    
    console.log('✅ Updated notifications table type ENUM');
    console.log('   Added: task_submission, task_review, training_completion');
    console.log('✅ Update completed successfully!');

  } catch (error) {
    console.error('❌ Update error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runUpdate();
