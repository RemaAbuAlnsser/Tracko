import fetch from 'node-fetch';

async function testAPI() {
  try {
    console.log('🧪 Testing Notifications API...\n');
    
    const userId = 7; // noor's user_id
    
    console.log(`📡 Sending GET request to: http://localhost:5050/api/notifications/user/${userId}`);
    
    const response = await fetch(`http://localhost:5050/api/notifications/user/${userId}`);
    const data = await response.json();
    
    console.log('\n📊 Response Status:', response.status);
    console.log('📦 Response Data:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log(`\n✅ API is working! Found ${data.notifications.length} notifications`);
      
      if (data.notifications.length > 0) {
        console.log('\n📋 Notifications:');
        data.notifications.forEach((notif, index) => {
          console.log(`\n${index + 1}. ${notif.title}`);
          console.log(`   ${notif.message}`);
        });
      }
    } else {
      console.log('\n❌ API returned error:', data.message);
    }
    
  } catch (error) {
    console.error('\n❌ Error testing API:', error.message);
    console.log('\n💡 Make sure the backend server is running (npm start)');
  }
}

testAPI();
