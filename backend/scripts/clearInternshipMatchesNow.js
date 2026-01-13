import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function clearInternshipMatches() {
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
    
    // Count current records
    const [countResult] = await connection.query('SELECT COUNT(*) as count FROM Internship_Matches');
    const recordCount = countResult[0].count;
    
    console.log(`\n📊 Current records in Internship_Matches: ${recordCount}`);
    console.log('🗑️  Deleting all records...');
    
    const [result] = await connection.query('DELETE FROM Internship_Matches');
    
    console.log(`✅ Successfully deleted ${result.affectedRows} records from Internship_Matches`);
    console.log('🔄 Resetting auto-increment counter...');
    
    await connection.query('ALTER TABLE Internship_Matches AUTO_INCREMENT = 1');
    
    console.log('✅ Table cleared and reset successfully!');
    
    // Verify
    const [verifyResult] = await connection.query('SELECT COUNT(*) as count FROM Internship_Matches');
    console.log(`\n✅ Verification: ${verifyResult[0].count} records remaining`);
    
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

clearInternshipMatches()
  .then(() => {
    console.log('\n✅ Operation completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Operation failed:', error);
    process.exit(1);
  });
