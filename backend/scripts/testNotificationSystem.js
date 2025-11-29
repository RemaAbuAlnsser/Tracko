import InternshipMatch from '../models/InternshipMatch.js';
import Notification from '../models/Notification.js';

async function testNotificationSystem() {
  try {
    console.log('🧪 Testing Notification System...\n');
    
    // Test 1: Get match details
    console.log('Test 1: Getting match details for ID 9...');
    const matchDetails = await InternshipMatch.getMatchDetailsById(9);
    
    if (matchDetails) {
      console.log('✅ Match details retrieved:');
      console.log(`   Student: ${matchDetails.student_name}`);
      console.log(`   Student User ID: ${matchDetails.student_user_id}`);
      console.log(`   Internship: ${matchDetails.internship_title}`);
      console.log(`   Company: ${matchDetails.company_name}`);
      console.log(`   Status: ${matchDetails.status}`);
      
      // Test 2: Create a test notification
      console.log('\nTest 2: Creating test notification...');
      await Notification.create({
        user_id: matchDetails.student_user_id,
        title: '🧪 Test Notification',
        message: `This is a test notification for "${matchDetails.internship_title}" at ${matchDetails.company_name}.`,
        type: 'application'
      });
      console.log('✅ Test notification created successfully!');
      
      // Test 3: Get notifications for the student
      console.log('\nTest 3: Getting notifications for student...');
      const notifications = await Notification.getByUserId(matchDetails.student_user_id, { limit: 5 });
      console.log(`✅ Found ${notifications.length} notifications:`);
      notifications.forEach((notif, index) => {
        console.log(`   ${index + 1}. ${notif.title} - ${notif.is_read ? 'Read' : 'Unread'}`);
      });
      
    } else {
      console.log('❌ No match found with ID 9');
      console.log('💡 Try running: node scripts/viewMatches.js to see available matches');
    }
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

testNotificationSystem();
