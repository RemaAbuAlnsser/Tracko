import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function fixAppliedColumn() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'tracko'
    });

    console.log('✅ Connected to database\n');
    
    // 1. Check current state
    console.log('🔍 Checking current state...\n');
    const [before] = await connection.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('accepted', 'rejected') AND applied = 1 THEN 1 ELSE 0 END) as needs_fix
      FROM Internship_Matches
    `);
    
    console.log(`Total records: ${before[0].total}`);
    console.log(`Records needing fix: ${before[0].needs_fix}\n`);
    
    if (before[0].needs_fix === 0) {
      console.log('✅ No records need fixing!');
      return;
    }
    
    // 2. Show records that will be updated
    console.log('📋 Records that will be updated:\n');
    const [toFix] = await connection.query(`
      SELECT 
        im.id,
        u.full_name as student_name,
        i.title as internship_title,
        im.applied,
        im.status
      FROM Internship_Matches im
      JOIN Students s ON im.student_id = s.id
      JOIN Users u ON s.user_id = u.id
      JOIN Internships i ON im.internship_id = i.id
      WHERE im.status IN ('accepted', 'rejected') AND im.applied = 1
    `);
    
    console.table(toFix);
    
    // 3. Ask for confirmation (in production, you might want to add readline)
    console.log('\n⚠️  This will update applied = 0 for all accepted/rejected records');
    console.log('🔄 Proceeding with update...\n');
    
    // 4. Perform the update
    const [result] = await connection.query(`
      UPDATE Internship_Matches 
      SET applied = 0 
      WHERE status IN ('accepted', 'rejected') AND applied = 1
    `);
    
    console.log(`✅ Updated ${result.affectedRows} records\n`);
    
    // 5. Verify the fix
    console.log('🔍 Verifying the fix...\n');
    const [after] = await connection.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('accepted', 'rejected') AND applied = 1 THEN 1 ELSE 0 END) as still_needs_fix,
        SUM(CASE WHEN status IN ('accepted', 'rejected') AND applied = 0 THEN 1 ELSE 0 END) as fixed
      FROM Internship_Matches
    `);
    
    console.log(`Total records: ${after[0].total}`);
    console.log(`Still needs fix: ${after[0].still_needs_fix}`);
    console.log(`Fixed records: ${after[0].fixed}\n`);
    
    if (after[0].still_needs_fix === 0) {
      console.log('✅ All records fixed successfully!');
    } else {
      console.log('⚠️  Some records still need fixing');
    }
    
    // 6. Show final statistics
    console.log('\n📊 Final Statistics:\n');
    const [stats] = await connection.query(`
      SELECT 
        status,
        applied,
        COUNT(*) as count
      FROM Internship_Matches
      GROUP BY status, applied
      ORDER BY status, applied
    `);
    
    console.table(stats);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

fixAppliedColumn();
