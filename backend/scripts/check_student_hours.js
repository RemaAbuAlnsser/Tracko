import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function checkHours() {
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

    // Get student internship matches with hours info
    const query = `
      SELECT 
        im.id as match_id,
        im.student_id,
        im.hours_per_week,
        im.completed_hours,
        im.status,
        s.university_id,
        i.company_id,
        u.full_name as student_name,
        ucp.training_hours as required_hours
      FROM Internship_Matches im
      JOIN Students s ON im.student_id = s.id
      JOIN Users u ON s.user_id = u.id
      JOIN Internships i ON im.internship_id = i.id
      LEFT JOIN University_Company_Partnerships ucp 
        ON s.university_id = ucp.university_id 
        AND i.company_id = ucp.company_id
      WHERE im.status = 'accepted'
      ORDER BY im.completed_hours DESC
    `;

    const [rows] = await connection.query(query);
    
    console.log('\n📊 Student Training Hours Status:\n');
    rows.forEach(row => {
      const percentage = row.required_hours ? 
        ((row.completed_hours / row.required_hours) * 100).toFixed(1) : 'N/A';
      const completed = row.completed_hours >= row.required_hours ? '✅' : '⏳';
      
      console.log(`${completed} ${row.student_name}`);
      console.log(`   Match ID: ${row.match_id}`);
      console.log(`   Completed: ${row.completed_hours || 0}/${row.required_hours || 'N/A'} hours (${percentage}%)`);
      console.log(`   Hours/Week: ${row.hours_per_week || 'N/A'}`);
      console.log(`   Status: ${row.status}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkHours();
