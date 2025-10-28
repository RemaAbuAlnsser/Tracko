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

const createInternshipPlansTable = () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS Internship_Plans (
      id INT AUTO_INCREMENT PRIMARY KEY,
      internship_id INT NOT NULL,
      trainer_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      duration_weeks INT NOT NULL,
      start_date DATE,
      end_date DATE,
      status ENUM('draft', 'active', 'completed', 'cancelled') DEFAULT 'draft',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (internship_id) REFERENCES Internships(id) ON DELETE CASCADE,
      FOREIGN KEY (trainer_id) REFERENCES Trainers(id) ON DELETE CASCADE,
      INDEX idx_internship_id (internship_id),
      INDEX idx_trainer_id (trainer_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  connection.query(createTableQuery, (err, results) => {
    if (err) {
      console.error('❌ Error creating Internship_Plans table:', err);
      connection.end();
      return;
    }
    console.log('✅ Internship_Plans table created successfully!');
    connection.end();
  });
};

connection.connect((err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err);
    return;
  }
  console.log('✅ Connected to database');
  createInternshipPlansTable();
});
