import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function addApplicationType() {
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
    
    const sqlFilePath = path.join(__dirname, '../migrations/005_add_application_type.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📝 Executing SQL migration...');
    console.log(sql);
    
    await connection.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('Updated Notifications.type ENUM to include:');
    console.log("  - 'appointment'");
    console.log("  - 'submission'");
    console.log("  - 'meeting'");
    console.log("  - 'general'");
    console.log("  - 'application' ⭐ NEW");
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

addApplicationType()
  .then(() => {
    console.log('\n✅ Operation completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Operation failed:', error);
    process.exit(1);
  });
