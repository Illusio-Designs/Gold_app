const axios = require("axios");

async function testAPI() {
  try {
    console.log("Testing API endpoints...");

    // Test health endpoint
    console.log("\n1. Testing health endpoint...");
    const healthResponse = await axios.get(
      "http://172.20.10.10:3001/api/health"
    );
    console.log("Health Response:", healthResponse.data);

    // Test check-exists endpoint
    console.log("\n2. Testing check-exists endpoint...");
    const checkExistsResponse = await axios.post(
      "http://172.20.10.10:3001/api/users/check-exists",
      {
        phoneNumber: "7600046416",
      }
    );
    console.log("Check Exists Response:", checkExistsResponse.data);

    // Test verify-otp endpoint
    console.log("\n3. Testing verify-otp endpoint...");
    try {
      const verifyOtpResponse = await axios.post(
        "http://172.20.10.10:3001/api/users/verify-otp",
        {
          phoneNumber: "7600046416",
        }
      );
      console.log("Verify OTP Response:", verifyOtpResponse.data);
    } catch (error) {
      console.log(
        "Verify OTP Error (expected if user not found):",
        error.response?.data || error.message
      );
    }

    console.log("\n✅ API testing completed successfully!");
  } catch (error) {
    console.error(
      "❌ API testing failed:",
      error.response?.data || error.message
    );
  }
}

testAPI();
