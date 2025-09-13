const axios = require("axios");

async function testApprovedCategories() {
  try {
    console.log("🔍 Testing approved categories API for user 2...");

    // First, let's get a fresh token for user 2
    const loginResponse = await axios.post(
      "http://172.20.10.10:3001/api/users/business/login",
      {
        phoneNumber: "7600046416",
        password: "password123",
      }
    );

    console.log("✅ Login successful");
    const token = loginResponse.data.token;
    console.log("🔑 Token:", token.substring(0, 20) + "...");

    // Now test the approved categories API
    console.log("\n🔍 Testing approved categories...");
    const categoriesResponse = await axios.get(
      "http://172.20.10.10:3001/api/login-requests/approved-categories/2",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("📂 Approved Categories Response:");
    console.log("Status:", categoriesResponse.status);
    console.log("Data:", JSON.stringify(categoriesResponse.data, null, 2));

    // Now test the approved products API
    console.log("\n🔍 Testing approved products...");
    const productsResponse = await axios.get(
      "http://172.20.10.10:3001/api/login-requests/approved-products/2",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("📦 Approved Products Response:");
    console.log("Status:", productsResponse.status);
    console.log("Data:", JSON.stringify(productsResponse.data, null, 2));
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

testApprovedCategories();
