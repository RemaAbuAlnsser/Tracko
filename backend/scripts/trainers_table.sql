-- Create Trainers Table
CREATE TABLE IF NOT EXISTS Trainers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  internship_id INT,
  user_id INT NOT NULL,
  specialization VARCHAR(255),
  experience_years INT,
  bio TEXT,
  hourly_rate DECIMAL(10, 2),
  max_trainees INT DEFAULT 5,
  status ENUM('active', 'inactive', 'pending') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES Company(id) ON DELETE CASCADE,
  FOREIGN KEY (internship_id) REFERENCES Internships(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Display table structure
DESCRIBE Trainers;
