-- ============================================
-- Tracko Database Schema
-- ============================================
-- استخدم هذا الملف لإنشاء قاعدة البيانات الكاملة
-- mysql -u root -p trackoDB < database_schema.sql

-- إنشاء قاعدة البيانات
CREATE DATABASE IF NOT EXISTS trackoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE trackoDB;

-- ============================================
-- 1. جدول المستخدمين (Users)
-- ============================================
CREATE TABLE IF NOT EXISTS Users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  user_type ENUM('student', 'company', 'university', 'trainer', 'admin') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_user_type (user_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. جدول الشركات (Company)
-- ============================================
CREATE TABLE IF NOT EXISTS Company (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  logo VARCHAR(500),
  industry VARCHAR(255),
  description TEXT,
  website VARCHAR(500),
  location VARCHAR(255),
  status ENUM('pending', 'active', 'inactive') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. جدول الجامعات (Universities)
-- ============================================
CREATE TABLE IF NOT EXISTS Universities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  logo VARCHAR(500),
  location VARCHAR(255),
  website VARCHAR(500),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. جدول الطلاب (Students)
-- ============================================
CREATE TABLE IF NOT EXISTS Students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  university_id INT,
  major VARCHAR(255),
  academic_year VARCHAR(50),
  gpa DECIMAL(3,2),
  cv_file VARCHAR(500),
  student_img VARCHAR(500),
  skills TEXT,
  status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
  FOREIGN KEY (university_id) REFERENCES Universities(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_university_id (university_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. جدول المدربين (Trainers)
-- ============================================
CREATE TABLE IF NOT EXISTS Trainers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  company_id INT,
  specialization VARCHAR(255),
  experience_years INT,
  bio TEXT,
  linkedin_url VARCHAR(500),
  github_url VARCHAR(500),
  hourly_rate DECIMAL(10,2),
  max_trainees INT DEFAULT 5,
  status ENUM('active', 'inactive', 'pending') DEFAULT 'active',
  profile_image VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES Company(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_company_id (company_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. جدول التدريبات (Internships)
-- ============================================
CREATE TABLE IF NOT EXISTS Internships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  requirements TEXT,
  specialization VARCHAR(255),
  capacity INT DEFAULT 1,
  status ENUM('active', 'inactive', 'closed') DEFAULT 'active',
  min_gpa DECIMAL(3,2),
  work_mode ENUM('on-site', 'remote', 'hybrid') DEFAULT 'on-site',
  duration VARCHAR(100),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES Company(id) ON DELETE CASCADE,
  INDEX idx_company_id (company_id),
  INDEX idx_status (status),
  INDEX idx_specialization (specialization)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. جدول السير الذاتية (CVs)
-- ============================================
CREATE TABLE IF NOT EXISTS CVs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  analysis_data JSON,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE,
  INDEX idx_student_id (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. جدول المطابقات (Internship_Matches)
-- ============================================
CREATE TABLE IF NOT EXISTS Internship_Matches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  internship_id INT NOT NULL,
  match_percentage DECIMAL(5,2) DEFAULT 0,
  matched_skills JSON,
  matched_categories JSON,
  gpa_match BOOLEAN,
  gpa_message TEXT,
  work_mode_match BOOLEAN,
  work_mode_message TEXT,
  applied BOOLEAN DEFAULT FALSE,
  applied_at TIMESTAMP NULL,
  saved BOOLEAN DEFAULT FALSE,
  status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE,
  FOREIGN KEY (internship_id) REFERENCES Internships(id) ON DELETE CASCADE,
  UNIQUE KEY unique_match (student_id, internship_id),
  INDEX idx_student_id (student_id),
  INDEX idx_internship_id (internship_id),
  INDEX idx_status (status),
  INDEX idx_applied (applied),
  INDEX idx_saved (saved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 9. جدول الإشعارات (notifications)
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 10. جدول الشراكات (University_Company_Partnerships)
-- ============================================
CREATE TABLE IF NOT EXISTS University_Company_Partnerships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  university_id INT NOT NULL,
  company_id INT NOT NULL,
  status ENUM('pending', 'active', 'inactive') DEFAULT 'pending',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (university_id) REFERENCES Universities(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES Company(id) ON DELETE CASCADE,
  UNIQUE KEY unique_partnership (university_id, company_id),
  INDEX idx_university_id (university_id),
  INDEX idx_company_id (company_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 11. جدول طلبات التسجيل (Registration_Requests)
-- ============================================
CREATE TABLE IF NOT EXISTS Registration_Requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  user_type ENUM('student', 'company', 'university', 'trainer') NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 12. جدول خطط التدريب (Internship_Plans)
-- ============================================
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

-- ============================================
-- 13. جدول أسابيع الخطة (Plan_Weeks)
-- ============================================
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
  UNIQUE KEY unique_week (plan_id, week_number),
  INDEX idx_plan_id (plan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 14. جدول تسليمات المهام (Task_Submissions)
-- ============================================
CREATE TABLE IF NOT EXISTS Task_Submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  trainer_id INT NULL,
  week_id INT NULL,
  plan_id INT NULL,
  task_title VARCHAR(255) NULL,
  submission_file VARCHAR(500),
  submission_text TEXT,
  submission_link VARCHAR(500),
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  trainer_comment TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE,
  INDEX idx_student_id (student_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 15. جدول التقارير الأسبوعية (Weekly_Reports)
-- ============================================
CREATE TABLE IF NOT EXISTS Weekly_Reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  trainer_id INT NULL,
  plan_id INT NULL,
  week_number INT NOT NULL,
  report_text TEXT,
  report_file VARCHAR(500),
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  trainer_comment TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE,
  FOREIGN KEY (trainer_id) REFERENCES Trainers(id) ON DELETE SET NULL,
  FOREIGN KEY (plan_id) REFERENCES Internship_Plans(id) ON DELETE SET NULL,
  INDEX idx_student_id (student_id),
  INDEX idx_trainer_id (trainer_id),
  INDEX idx_plan_id (plan_id),
  INDEX idx_status (status),
  INDEX idx_week_number (week_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 16. جدول التقارير النهائية (Final_Reports)
-- ============================================
CREATE TABLE IF NOT EXISTS Final_Reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  trainer_id INT NOT NULL,
  internship_id INT NOT NULL,
  overall_performance TEXT,
  technical_skills_rating INT CHECK (technical_skills_rating BETWEEN 1 AND 5),
  communication_rating INT CHECK (communication_rating BETWEEN 1 AND 5),
  teamwork_rating INT CHECK (teamwork_rating BETWEEN 1 AND 5),
  problem_solving_rating INT CHECK (problem_solving_rating BETWEEN 1 AND 5),
  attendance_rating INT CHECK (attendance_rating BETWEEN 1 AND 5),
  overall_rating DECIMAL(3,2),
  strengths TEXT,
  areas_for_improvement TEXT,
  recommendations TEXT,
  certificate_file VARCHAR(500),
  certificate_uploaded_at TIMESTAMP NULL,
  university_approved BOOLEAN DEFAULT FALSE,
  university_approved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE,
  FOREIGN KEY (trainer_id) REFERENCES Trainers(id) ON DELETE CASCADE,
  FOREIGN KEY (internship_id) REFERENCES Internships(id) ON DELETE CASCADE,
  INDEX idx_student_id (student_id),
  INDEX idx_trainer_id (trainer_id),
  INDEX idx_internship_id (internship_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- إنشاء مستخدم Admin افتراضي
-- ============================================
-- كلمة المرور: admin123 (مشفرة بـ bcrypt)
INSERT INTO Users (full_name, email, password, user_type) 
VALUES ('Admin', 'admin@tracko.com', '$2b$10$rQZ5YvZxQxQxQxQxQxQxQeO', 'admin')
ON DUPLICATE KEY UPDATE email = email;

-- ============================================
-- انتهى
-- ============================================
