import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testAppliedFilter() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'tracko'
    });

    console.log('✅ Connected to database\n');
    
    // 1. Show all applications
    console.log('📊 All Applications in Internship_Matches:\n');
    const [allApps] = await connection.query(`
      SELECT 
        im.id,
        u.full_name as student_name,
        i.title as internship_title,
        c.name as company_name,
        im.applied,
        im.status,
        im.applied_at
      FROM Internship_Matches im
      JOIN Students s ON im.student_id = s.id
      JOIN Users u ON s.user_id = u.id
      JOIN Internships i ON im.internship_id = i.id
      JOIN Company c ON i.company_id = c.id
      ORDER BY im.applied_at DESC
      LIMIT 10
    `);
    
    console.table(allApps);
    
    // 2. Show only active applications (applied = 1 AND status = 'pending')
    console.log('\n📋 Active Applications (applied = 1 AND status = pending):\n');
    const [activeApps] = await connection.query(`
      SELECT 
        im.id,
        u.full_name as student_name,
        i.title as internship_title,
        c.name as company_name,
        im.applied,
        im.status,
        im.applied_at
      FROM Internship_Matches im
      JOIN Students s ON im.student_id = s.id
      JOIN Users u ON s.user_id = u.id
      JOIN Internships i ON im.internship_id = i.id
      JOIN Company c ON i.company_id = c.id
      WHERE im.applied = 1 AND im.status = 'pending'
      ORDER BY im.applied_at DESC
    `);
    
    if (activeApps.length === 0) {
      console.log('❌ No active applications found');
    } else {
      console.table(activeApps);
    }
    
    // 3. Show accepted applications
    console.log('\n✅ Accepted Applications:\n');
    const [acceptedApps] = await connection.query(`
      SELECT 
        im.id,
        u.full_name as student_name,
        i.title as internship_title,
        im.applied,
        im.status,
        im.applied_at
      FROM Internship_Matches im
      JOIN Students s ON im.student_id = s.id
      JOIN Users u ON s.user_id = u.id
      JOIN Internships i ON im.internship_id = i.id
      WHERE im.status = 'accepted'
      ORDER BY im.applied_at DESC
      LIMIT 5
    `);
    
    if (acceptedApps.length === 0) {
      console.log('No accepted applications');
    } else {
      console.table(acceptedApps);
    }
    
    // 4. Show rejected applications
    console.log('\n❌ Rejected Applications:\n');
    const [rejectedApps] = await connection.query(`
      SELECT 
        im.id,
        u.full_name as student_name,
        i.title as internship_title,
        im.applied,
        im.status,
        im.applied_at
      FROM Internship_Matches im
      JOIN Students s ON im.student_id = s.id
      JOIN Users u ON s.user_id = u.id
      JOIN Internships i ON im.internship_id = i.id
      WHERE im.status = 'rejected'
      ORDER BY im.applied_at DESC
      LIMIT 5
    `);
    
    if (rejectedApps.length === 0) {
      console.log('No rejected applications');
    } else {
      console.table(rejectedApps);
    }
    
    // 5. Statistics
    console.log('\n📈 Statistics:\n');
    const [stats] = await connection.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN applied = 1 AND status = 'pending' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN applied = 0 THEN 1 ELSE 0 END) as processed
      FROM Internship_Matches
    `);
    
    console.log(`Total Applications: ${stats[0].total}`);
    console.log(`Active (applied=1, status=pending): ${stats[0].active}`);
    console.log(`Accepted: ${stats[0].accepted}`);
    console.log(`Rejected: ${stats[0].rejected}`);
    console.log(`Processed (applied=0): ${stats[0].processed}`);
    
    // 6. Check for any inconsistencies
    console.log('\n🔍 Checking for inconsistencies...\n');
    const [inconsistent] = await connection.query(`
      SELECT 
        im.id,
        im.applied,
        im.status
      FROM Internship_Matches im
      WHERE (im.status IN ('accepted', 'rejected') AND im.applied = 1)
         OR (im.status = 'pending' AND im.applied = 0)
    `);
    
    if (inconsistent.length > 0) {
      console.log('⚠️  Found inconsistencies:');
      console.table(inconsistent);
      console.log('\n💡 To fix, run:');
      console.log('UPDATE Internship_Matches SET applied = 0 WHERE status IN ("accepted", "rejected");');
    } else {
      console.log('✅ No inconsistencies found - all data is correct!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

testAppliedFilter();
