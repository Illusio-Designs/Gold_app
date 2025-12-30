const axios = require('axios');

// Test configuration
const BACKEND_URL =
  process.env.API_URL?.replace('/api', '') || 'http://172.20.10.10:3001';

async function checkTokens() {
  console.log('🔍 Checking FCM tokens in database...\n');

  try {
    // Get admin token (you'll need to replace this with a valid admin token)
    const adminToken = 'YOUR_ADMIN_TOKEN_HERE'; // Replace with actual admin token

    const response = await axios.get(
      `${BACKEND_URL}/api/notifications/debug/tokens`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      },
    );

    console.log('📊 Current FCM tokens in database:');
    console.log(JSON.stringify(response.data, null, 2));

    // Check for user 2 specifically
    const user2Tokens = response.data.tokens.filter(
      token => token.user_id === 2,
    );
    console.log('\n🔍 Tokens for user ID 2:');
    console.log(user2Tokens);

    if (user2Tokens.length === 0) {
      console.log('\n❌ No FCM tokens found for user ID 2');
      console.log('💡 This is why notifications are not being sent');
    } else {
      console.log('\n✅ Found FCM tokens for user ID 2');
      console.log('📱 Token count:', user2Tokens.length);
    }
  } catch (error) {
    console.error(
      '❌ Error checking tokens:',
      error.response?.data || error.message,
    );

    if (error.response?.status === 401) {
      console.log('\n💡 You need to provide a valid admin token');
      console.log('💡 Get the token from the dashboard login');
    }
  }
}

async function testNotificationForUser2() {
  console.log('\n🧪 Testing notification for user 2...\n');

  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/notifications/test-user-notification`,
      {
        type: 'LOGIN_REQUEST_STATUS',
        userId: 2,
        data: {
          id: 1,
          userId: 2,
          status: 'approved',
          remarks: 'Test notification from debug script',
          sessionTimeMinutes: 30,
        },
      },
    );

    console.log('📊 Test notification response:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error(
      '❌ Error sending test notification:',
      error.response?.data || error.message,
    );
  }
}

async function runDebug() {
  console.log('🔍 FCM Token Debug Tool');
  console.log('=======================\n');

  await checkTokens();
  await testNotificationForUser2();

  console.log('\n📋 Next Steps:');
  console.log('1. Make sure the React Native app is running');
  console.log('2. Grant notification permissions');
  console.log('3. Register FCM token for user 2');
  console.log('4. Run this debug script again to verify');
}

runDebug().catch(console.error);
