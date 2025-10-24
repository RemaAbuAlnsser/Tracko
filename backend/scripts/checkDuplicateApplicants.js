import mysql from 'mysql2';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  console.log('✅ Connected to MySQL Database\n');
});

// Check for duplicate CVs per student
const checkDuplicateCVs = () => {
  const query = `
    SELECT student_id, COUNT(*) as cv_count 
    FROM CVs 
    GROUP BY student_id 
    HAVING cv_count > 1
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error('❌ Error checking CVs:', err);
      return;
    }

    console.log('📋 Students with multiple CVs:');
    if (results.length === 0) {
      console.log('   ✅ No duplicates found\n');
    } else {
      console.table(results);
      console.log('');
    }
  });
};

// Check for duplicate applications
const checkDuplicateApplications = () => {
  const query = `
    SELECT 
      student_id, 
      internship_id, 
      COUNT(*) as application_count 
    FROM Internship_Matches 
    GROUP BY student_id, internship_id 
    HAVING application_count > 1
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error('❌ Error checking applications:', err);
      return;
    }

    console.log('📋 Duplicate applications (same student + same internship):');
    if (results.length === 0) {
      console.log('   ✅ No duplicates found\n');
    } else {
      console.table(results);
      console.log('');
    }
  });
};

// Check applicants for company 1 (ASAL)
const checkCompanyApplicants = () => {
  const query = `
    SELECT 
      im.id as match_id,
      im.student_id,
      im.internship_id,
      u.full_name,
      i.title as internship_title,
      cv.id as cv_id,
      cv.analysis_data
    FROM Internship_Matches im
    INNER JOIN Students s ON im.student_id = s.id
    INNER JOIN Users u ON s.user_id = u.id
    LEFT JOIN CVs cv ON s.id = cv.student_id
    INNER JOIN Internships i ON im.internship_id = i.id
    WHERE i.company_id = 1 AND im.applied = TRUE AND im.status = 'pending'
    ORDER BY u.full_name, im.internship_id
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error('❌ Error checking company applicants:', err);
      connection.end();
      return;
    }

    console.log('📋 All applicants for company 1 (ASAL):');
    console.log(`   Total rows returned: ${results.length}\n`);
    
    if (results.length > 0) {
      // Group by student
      const byStudent = {};
      results.forEach(row => {
        const key = row.full_name;
        if (!byStudent[key]) {
          byStudent[key] = [];
        }
        byStudent[key].push({
          match_id: row.match_id,
          student_id: row.student_id,
          internship: row.internship_title,
          cv_id: row.cv_id,
          has_cv: !!row.analysis_data
        });
      });

      Object.keys(byStudent).forEach(studentName => {
        const apps = byStudent[studentName];
        console.log(`\n👤 ${studentName}:`);
        console.log(`   Applications: ${apps.length}`);
        apps.forEach((app, index) => {
          console.log(`   ${index + 1}. Match ID: ${app.match_id}, Internship: ${app.internship}, CV ID: ${app.cv_id || 'NULL'}, Has CV: ${app.has_cv ? 'YES' : 'NO'}`);
        });
        
        if (apps.length > 1) {
          console.log(`   ⚠️  DUPLICATE DETECTED!`);
        }
      });
    }

    console.log('\n');
    connection.end();
  });
};

// Run checks
console.log('🔍 Checking for duplicate data...\n');
checkDuplicateCVs();
setTimeout(() => checkDuplicateApplications(), 500);
setTimeout(() => checkCompanyApplicants(), 1000);
