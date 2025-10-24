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

const createPlanWeeksTable = () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS Plan_Weeks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      plan_id INT NOT NULL,
      week_number INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      objectives TEXT,
      tasks TEXT,
      resources TEXT,
      deliverables TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (plan_id) REFERENCES Internship_Plans(id) ON DELETE CASCADE,
      INDEX idx_plan_id (plan_id),
      UNIQUE KEY unique_plan_week (plan_id, week_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  connection.query(createTableQuery, (err, results) => {
    if (err) {
      console.error('❌ Error creating Plan_Weeks table:', err);
      connection.end();
      return;
    }
    console.log('✅ Plan_Weeks table created successfully!');
    connection.end();
  });
};

connection.connect((err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err);
    return;
  }
  console.log('✅ Connected to database');
  createPlanWeeksTable();
});
