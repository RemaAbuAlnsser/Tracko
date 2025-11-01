import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function checkUser() {
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

    // Get university user
    const [rows] = await connection.query(`
      SELECT id, email, full_name, user_type 
      FROM Users 
      WHERE email = 'najah@najah.com'
    `);
    
    console.log('\n📊 University User Info:\n');
    if (rows.length > 0) {
      console.log('   ID:', rows[0].id);
      console.log('   Email:', rows[0].email);
      console.log('   Name:', rows[0].full_name);
      console.log('   Type:', rows[0].user_type);
    } else {
      console.log('   ❌ User not found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkUser();
