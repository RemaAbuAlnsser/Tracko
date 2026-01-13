import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function deleteFirstRow() {
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
    
    // Get the first row
    const [rows] = await connection.query(
      'SELECT * FROM Internship_Matches ORDER BY id ASC LIMIT 1'
    );
    
    if (rows.length === 0) {
      console.log('⚠️  No records found in Internship_Matches table');
      return;
    }
    
    const firstRow = rows[0];
    console.log('\n📋 First row details:');
    console.log(`   ID: ${firstRow.id}`);
    console.log(`   Student ID: ${firstRow.student_id}`);
    console.log(`   Internship ID: ${firstRow.internship_id}`);
    console.log(`   Match Percentage: ${firstRow.match_percentage}%`);
    
    console.log('\n🗑️  Deleting first row...');
    
    const [result] = await connection.query(
      'DELETE FROM Internship_Matches WHERE id = ?',
      [firstRow.id]
    );
    
    console.log(`✅ Successfully deleted row with ID: ${firstRow.id}`);
    console.log(`   Affected rows: ${result.affectedRows}`);
    
    // Show remaining count
    const [countResult] = await connection.query(
      'SELECT COUNT(*) as count FROM Internship_Matches'
    );
    console.log(`\n📊 Remaining records: ${countResult[0].count}`);
    
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

deleteFirstRow()
  .then(() => {
    console.log('\n✅ Operation completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Operation failed:', error);
    process.exit(1);
  });
