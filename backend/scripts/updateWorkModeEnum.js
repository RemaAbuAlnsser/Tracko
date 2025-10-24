import mysql from 'mysql2';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tracko_db'
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err);
    process.exit(1);
  }
  console.log('✅ Connected to MySQL Database');
});

const updateWorkModeEnum = () => {
  const query = `
    ALTER TABLE Internships 
    MODIFY COLUMN work_mode ENUM('remote', 'on-site', 'hybrid', 'online') DEFAULT NULL 
    COMMENT 'Work mode for the internship'
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error('❌ Error updating work_mode column:', err);
      connection.end();
      process.exit(1);
    }

    console.log('✅ Successfully updated work_mode ENUM');
    console.log('');
    console.log('Updated work_mode column to accept:');
    console.log('  - remote');
    console.log('  - on-site');
    console.log('  - hybrid');
    console.log('  - online ✨ (NEW)');
    console.log('');
    console.log('You can now use "online" as a work_mode value!');

    connection.end();
    process.exit(0);
  });
};

// Run the update
updateWorkModeEnum();
