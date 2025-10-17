import fetch from 'node-fetch';

const testUniversitySignup = async () => {
  console.log("🧪 Testing University Signup...\n");

  const testData = {
    full_name: "جامعة بيرزيت",
    email: "info@birzeit.edu",
    password: "test123456",
    user_type: "university"
  };

  try {
    console.log("📤 Sending signup request with data:");
    console.log(JSON.stringify(testData, null, 2));
    console.log("");

    const response = await fetch('http://localhost:5050/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    console.log("📥 Response Status:", response.status);
    console.log("📥 Response Data:");
    console.log(JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log("\n✅ University signup test PASSED!");
      console.log("✅ User created in Users table");
      console.log("✅ University created in Universities table");
    } else {
      console.log("\n❌ University signup test FAILED!");
      console.log("Error:", result.message);
    }

  } catch (error) {
    console.error("❌ Test error:", error.message);
  }
};

testUniversitySignup();
