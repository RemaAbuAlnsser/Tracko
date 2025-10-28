import fetch from 'node-fetch';

async function testNotifications() {
  try {
    console.log('🧪 Testing New Internship Notifications Feature\n');
    
    // Test data for a new internship
    const newInternship = {
      company_email: 'info@techcorp.com', // Replace with actual company email
      title: 'Frontend Developer Intern',
      description: 'Looking for a talented frontend developer intern',
      requirements: 'React, JavaScript, HTML, CSS, TypeScript',
      specialization: 'Frontend',
      capacity: 3,
      status: 'open',
      min_gpa: 3.0,
      work_mode: 'hybrid'
    };
    
    console.log('📝 Creating new internship...');
    console.log('Title:', newInternship.title);
    console.log('Requirements:', newInternship.requirements);
    console.log('Min GPA:', newInternship.min_gpa);
    console.log('Work Mode:', newInternship.work_mode);
    console.log('\n📡 Sending POST request to: http://localhost:5050/api/internships\n');
    
    const response = await fetch('http://localhost:5050/api/internships', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newInternship)
    });
    
    const data = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📦 Response Data:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n✅ Internship created successfully!');
      console.log('📋 Internship ID:', data.internshipId);
      console.log('\n💡 Check the backend logs to see notification process');
      console.log('💡 Notifications should be sent to students with >50% match');
      console.log('\n🔍 To verify notifications were sent:');
      console.log('   1. Check backend console logs');
      console.log('   2. Query notifications table for new entries');
      console.log('   3. Check student dashboard for notifications');
    } else {
      console.log('\n❌ Failed to create internship:', data.message);
    }
    
  } catch (error) {
    console.error('\n❌ Error testing notifications:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. Backend server is running (npm start)');
    console.log('   2. Company email exists in database');
    console.log('   3. Students with CVs exist in database');
  }
}

testNotifications();
