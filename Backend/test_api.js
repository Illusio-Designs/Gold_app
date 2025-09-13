const axios = require("axios");

async function testApprovedCategories() {
  try {
    console.log("🔍 Testing approved categories API for user 2...");

    // First, let's get a token for user 2
    const loginResponse = await axios.post(
      "http://localhost:3001/api/users/business/login",
      {
        phoneNumber: "7600046416",
        password: "password123",
      }
    );

    console.log("✅ Login successful");
    const token = loginResponse.data.token;
    console.log("🔑 Token:", token.substring(0, 20) + "...");

    // Now test the approved categories API
    const categoriesResponse = await axios.get(
      "http://localhost:3001/api/login-requests/approved-categories/2",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("📂 Approved Categories Response:");
    console.log("Status:", categoriesResponse.status);
    console.log("Data:", JSON.stringify(categoriesResponse.data, null, 2));
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

testApprovedCategories();
