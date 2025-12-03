import fetch from 'node-fetch';

const testApplicationsAPI = async () => {
  try {
    console.log('🧪 Testing Applications API...\n');
    
    // Test with a sample student ID (you can change this)
    const studentId = 1; // Change this to an actual student ID
    const baseUrl = 'http://localhost:5050';
    
    console.log(`📝 Testing GET /api/students/${studentId}/applications`);
    
    const response = await fetch(`${baseUrl}/api/students/${studentId}/applications`);
    const data = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log(`✅ API working! Found ${data.applications.length} applications`);
      
      // Check for accepted applications
      const acceptedApps = data.applications.filter(app => app.status === 'accepted');
      console.log(`📊 Accepted applications: ${acceptedApps.length}`);
      
      if (acceptedApps.length > 0) {
        console.log('✅ Student has accepted applications - validation should block new applications');
      } else {
        console.log('ℹ️ Student has no accepted applications - can apply to new internships');
      }
    } else {
      console.log('❌ API returned error:', data.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
};

testApplicationsAPI();
