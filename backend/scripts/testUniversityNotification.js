import University from "../models/University.js";
import db from "../config/database.js";

console.log('🧪 Testing university notification system...\n');

// Test 1: Find university by domain
const testDomain = 'najah.com';
console.log(`1️⃣ Testing findByDomain('${testDomain}')...`);

University.findByDomain(testDomain)
  .then(university => {
    if (university) {
      console.log('✅ Found university:', university.name);
      console.log('   - ID:', university.id);
      console.log('   - Email:', university.email);
      console.log('   - Domain:', university.domain);
      
      // Test 2: Find university user
      console.log('\n2️⃣ Looking for university user in Users table...');
      const query = "SELECT id, full_name, email, user_type FROM Users WHERE email = ? AND user_type = 'university'";
      
      db.query(query, [university.email], (err, users) => {
        if (!err && users.length > 0) {
          console.log('✅ Found university user:');
          console.table(users);
          console.log('\n✅ All tests passed! Notifications should work correctly.');
        } else {
          console.log('❌ No university user found in Users table');
          console.log('   This means the university needs to have a user account.');
        }
        db.end();
      });
    } else {
      console.log('❌ No university found for domain:', testDomain);
      db.end();
    }
  })
  .catch(err => {
    console.error('❌ Error:', err);
    db.end();
  });
