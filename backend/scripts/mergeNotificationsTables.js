import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function mergeTables() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'tracko'
    });

    console.log('✅ Connected to database\n');
    
    // Check both tables
    const [upperCount] = await connection.query('SELECT COUNT(*) as count FROM Notifications');
    const [lowerCount] = await connection.query('SELECT COUNT(*) as count FROM notifications');
    
    console.log(`📊 Current state:`);
    console.log(`   Notifications (uppercase): ${upperCount[0].count} records`);
    console.log(`   notifications (lowercase): ${lowerCount[0].count} records\n`);
    
    // Copy data from Notifications to notifications (avoiding duplicates)
    console.log('🔄 Copying data from Notifications to notifications...');
    
    const [upperData] = await connection.query('SELECT * FROM Notifications');
    
    if (upperData.length > 0) {
      console.log(`   Found ${upperData.length} records to copy`);
      
      for (const record of upperData) {
        // Check if record already exists in lowercase table
        const [existing] = await connection.query(
          'SELECT id FROM notifications WHERE id = ?',
          [record.id]
        );
        
        if (existing.length === 0) {
          // Insert if doesn't exist
          await connection.query(
            'INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [record.id, record.user_id, record.title, record.message, record.type, record.is_read, record.created_at]
          );
          console.log(`   ✅ Copied record ID: ${record.id}`);
        } else {
          console.log(`   ⏭️  Skipped record ID: ${record.id} (already exists)`);
        }
      }
    } else {
      console.log('   No records to copy');
    }
    
    // Verify the copy
    const [newCount] = await connection.query('SELECT COUNT(*) as count FROM notifications');
    console.log(`\n📊 After merge:`);
    console.log(`   notifications: ${newCount[0].count} records\n`);
    
    // Drop the old table
    console.log('🗑️  Dropping old "Notifications" table...');
    await connection.query('DROP TABLE Notifications');
    console.log('✅ Old table dropped successfully!\n');
    
    // Verify
    console.log('🔍 Verifying final state...');
    const [tables] = await connection.query("SHOW TABLES LIKE 'Notifications'");
    
    if (tables.length === 0) {
      console.log('✅ "Notifications" table removed');
    } else {
      console.log('❌ "Notifications" table still exists');
    }
    
    const [finalTables] = await connection.query("SHOW TABLES LIKE 'notifications'");
    if (finalTables.length > 0) {
      console.log('✅ "notifications" table exists');
      const [finalCount] = await connection.query('SELECT COUNT(*) as count FROM notifications');
      console.log(`   Records: ${finalCount[0].count}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

mergeTables()
  .then(() => {
    console.log('\n✅ Operation completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Operation failed:', error);
    process.exit(1);
  });
