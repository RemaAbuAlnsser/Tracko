import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function viewMatches() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'tracko'
    });

    console.log('✅ Connected to database\n');
    
    const [rows] = await connection.query('SELECT * FROM Internship_Matches ORDER BY id ASC');
    
    console.log(`📊 Total records: ${rows.length}\n`);
    
    if (rows.length === 0) {
      console.log('⚠️  No records found');
    } else {
      console.log('═'.repeat(100));
      rows.forEach((row, index) => {
        console.log(`Record ${index + 1}:`);
        console.log(`  ID: ${row.id}`);
        console.log(`  Student ID: ${row.student_id}`);
        console.log(`  Internship ID: ${row.internship_id}`);
        console.log(`  Match %: ${row.match_percentage}%`);
        console.log(`  Saved: ${row.saved ? 'Yes' : 'No'}`);
        console.log(`  Applied: ${row.applied ? 'Yes' : 'No'}`);
        console.log(`  Status: ${row.status}`);
        console.log(`  GPA Match: ${row.gpa_match !== null ? (row.gpa_match ? 'Yes' : 'No') : 'N/A'}`);
        console.log(`  Work Mode Match: ${row.work_mode_match !== null ? (row.work_mode_match ? 'Yes' : 'No') : 'N/A'}`);
        console.log('═'.repeat(100));
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

viewMatches();
