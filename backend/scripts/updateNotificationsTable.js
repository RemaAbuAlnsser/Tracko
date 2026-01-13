import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }
  console.log('✅ Connected to MySQL Database!');
});

// Add data column to notifications table
const addDataColumn = `
  ALTER TABLE notifications 
  ADD COLUMN data TEXT AFTER type
`;

connection.query(addDataColumn, (err, result) => {
  if (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('✅ Column "data" already exists in notifications table');
    } else {
      console.error('❌ Error adding data column:', err);
      connection.end();
      process.exit(1);
    }
  } else {
    console.log('✅ Successfully added "data" column to notifications table');
  }
  
  // Verify the column was added
  connection.query('DESCRIBE notifications', (err, results) => {
    if (err) {
      console.error('❌ Error describing table:', err);
    } else {
      console.log('\n📋 Notifications table structure:');
      results.forEach(field => {
        console.log(`   - ${field.Field} (${field.Type})`);
      });
    }
    
    connection.end();
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  });
});
