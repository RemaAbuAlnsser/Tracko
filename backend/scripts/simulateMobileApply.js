import fetch from 'node-fetch';

const simulateMobileApply = async () => {
  console.log("📱 Simulating Mobile Apply Request...\n");
  
  try {
    const userId = 26; // user_id from Users table
    const internshipId = 6; // AI internship
    const hoursPerWeek = 22;
    
    console.log(`Sending POST request to:`);
    console.log(`http://localhost:5050/api/matching/student/${userId}/apply/${internshipId}`);
    console.log(`Body: { hours_per_week: ${hoursPerWeek} }\n`);
    
    const response = await fetch(
      `http://localhost:5050/api/matching/student/${userId}/apply/${internshipId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hours_per_week: hoursPerWeek }),
      }
    );
    
    const data = await response.json();
    
    console.log(`Response status: ${response.status}`);
    console.log(`Response data:`, data);
    
    if (data.success) {
      console.log(`\n✅ SUCCESS! Application submitted.`);
      console.log(`Now check the database to verify applied = 1`);
    } else {
      console.log(`\n❌ FAILED! ${data.message}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

simulateMobileApply();
