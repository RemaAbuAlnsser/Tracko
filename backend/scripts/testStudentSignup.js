import University from "../models/University.js";
import db from "../config/database.js";

// Test with a sample student email
const studentEmail = "ahmad@najah.com"; // Change this to test different emails
const domain = studentEmail.split('@')[1];

console.log('🧪 Testing student signup notification routing...\n');
console.log('📧 Student email:', studentEmail);
console.log('🌐 Extracted domain:', domain);
console.log('\n' + '='.repeat(50) + '\n');

// Step 1: Find university by domain
console.log('1️⃣ Looking for university with domain:', domain);

University.findByDomain(domain)
  .then(university => {
    if (university) {
      console.log('✅ Found university:', university.name);
      console.log('   - University ID:', university.id);
      console.log('   - University Email:', university.email);
      console.log('   - Domain:', university.domain);
      
      // Step 2: Find university user
      console.log('\n2️⃣ Looking for university user account...');
      const query = "SELECT id, full_name, email, user_type FROM Users WHERE email = ? AND user_type = 'university'";
      
      db.query(query, [university.email], (err, users) => {
        if (!err && users.length > 0) {
          const universityUser = users[0];
          console.log('✅ Found university user:');
          console.log('   - User ID:', universityUser.id);
          console.log('   - Name:', universityUser.full_name);
          console.log('   - Email:', universityUser.email);
          console.log('\n' + '='.repeat(50));
          console.log('✅ SUCCESS: Notification will be sent to university user ID:', universityUser.id);
          console.log('='.repeat(50));
        } else {
          console.log('❌ No university user found!');
          console.log('   The university exists but has no user account.');
          console.log('   Notification will be sent to ADMIN as fallback.');
        }
        db.end();
      });
    } else {
      console.log('❌ No university found for domain:', domain);
      console.log('   Notification will be sent to ADMIN as fallback.');
      console.log('\n💡 Available universities:');
      
      db.query('SELECT id, name, email, domain FROM Universities', (err, universities) => {
        if (!err) {
          console.table(universities);
        }
        db.end();
      });
    }
  })
  .catch(err => {
    console.error('❌ Error:', err);
    db.end();
  });
