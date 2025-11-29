import db from "../config/database.js";

console.log('🔍 Checking last registration requests...\n');

// Get last registration requests
db.query('SELECT * FROM Registration_Requests ORDER BY created_at DESC LIMIT 5', (err, requests) => {
  if (err) {
    console.error('❌ Error:', err);
    db.end();
    return;
  }
  
  console.log('📋 Last 5 registration requests:');
  console.table(requests);
  
  if (requests.length > 0) {
    const lastRequest = requests[0];
    console.log('\n🔎 Analyzing last request:');
    console.log('   - Name:', lastRequest.full_name);
    console.log('   - Email:', lastRequest.email);
    console.log('   - Type:', lastRequest.user_type);
    console.log('   - Status:', lastRequest.status);
    
    if (lastRequest.user_type === 'student') {
      const domain = lastRequest.email.split('@')[1];
      console.log('   - Domain:', domain);
      
      // Check if university exists for this domain
      db.query('SELECT * FROM Universities WHERE domain = ?', [domain], (err2, universities) => {
        if (!err2 && universities.length > 0) {
          console.log('\n✅ University found for this domain:', universities[0].name);
          console.log('   Notification should go to university!');
        } else {
          console.log('\n⚠️ No university found for domain:', domain);
          console.log('   Notification will go to ADMIN (fallback)');
          console.log('\n💡 Available university domains:');
          db.query('SELECT name, domain FROM Universities', (err3, unis) => {
            if (!err3) {
              console.table(unis);
            }
            db.end();
          });
        }
      });
    } else {
      console.log('\n   This is not a student request, will go to ADMIN.');
      db.end();
    }
  } else {
    console.log('No registration requests found.');
    db.end();
  }
});
