import fetch from 'node-fetch';

const testSignup = async () => {
  try {
    console.log("🧪 Testing signup endpoint...\n");
    
    const userData = {
      full_name: "Test User",
      email: `test${Date.now()}@example.com`,
      password: "testpass123",
      user_type: "student"
    };
    
    console.log("📤 Sending request with data:", userData);
    
    const response = await fetch('http://localhost:5050/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    console.log("\n📥 Response status:", response.status);
    
    const data = await response.json();
    console.log("📥 Response data:", data);
    
    if (response.status === 201) {
      console.log("\n✅ Signup successful!");
    } else {
      console.log("\n❌ Signup failed!");
    }
    
  } catch (error) {
    console.error("❌ Test error:", error.message);
  }
};

testSignup();
