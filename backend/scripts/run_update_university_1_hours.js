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
    const sqlFile = path.join(__dirname, 'update_university_1_training_hours.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Execute the update
    const [result] = await connection.query(sql);
    
    console.log(`✅ Updated ${result.affectedRows} partnership(s) for university_id = 1`);
    console.log(`   Set training_hours = 50`);
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
