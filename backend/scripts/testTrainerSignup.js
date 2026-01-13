import fetch from 'node-fetch';

const testTrainerSignup = async () => {
  try {
    console.log("🧪 Testing Trainer Signup...\n");
    
    // Test data - using @asal.com domain to match existing company
    const signupData = {
      full_name: "Ahmad Trainer",
      email: "ahmad@asal.com",
      password: "password123",
      user_type: "company"
    };
    
    console.log("📤 Sending signup request with data:");
    console.log(JSON.stringify(signupData, null, 2));
    console.log("\n");
    
    const response = await fetch('http://localhost:5000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signupData)
    });
    
    const data = await response.json();
    
    console.log("📥 Response status:", response.status);
    console.log("📥 Response data:");
    console.log(JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log("\n✅ Signup successful!");
      console.log("💡 Now check the Trainers table to see if the trainer was created");
    } else {
      console.log("\n❌ Signup failed!");
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
};

testTrainerSignup();
