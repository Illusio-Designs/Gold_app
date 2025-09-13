# 🔌 Real-Time Notifications System

This document explains how to use and test the real-time notifications system for the Amrut Jewels Admin Dashboard.

## 🚀 Features

- **Real-time WebSocket connections** using Socket.IO
- **Instant notifications** when new users register
- **Admin-specific room** for targeted notifications
- **Browser notifications** with sound and visual indicators
- **Connection status monitoring** with real-time updates
- **Test interface** for debugging and demonstration

## 🏗️ Architecture

### Backend Components

1. **Socket Service** (`Backend/services/socketService.js`)

   - Manages WebSocket connections
   - Handles admin room management
   - Emits notifications to specific rooms

2. **Admin Notification Service** (`Backend/services/adminNotificationService.js`)

   - Sends push notifications via Firebase
   - Triggers WebSocket notifications
   - Manages notification records

3. **Admin Notifications API** (`Backend/routes/adminNotifications.js`)
   - REST endpoints for admin notifications
   - Test notification functionality
   - Connection status endpoints

### Frontend Components

1. **Admin Socket Service** (`Frontend/Dashboard/src/services/adminSocketService.js`)

   - WebSocket client implementation
   - Connection management and reconnection
   - Event handling and room management

2. **useAdminSocket Hook** (`Frontend/Dashboard/src/hooks/useAdminSocket.js`)

   - React hook for easy socket integration
   - Connection status management
   - Event listener management

3. **Real-Time Notifications Component** (`Frontend/Dashboard/src/components/RealTimeNotifications.jsx`)
   - Notification display interface
   - Connection status indicator
   - Notification management (mark as read, clear, etc.)

## 🔧 Setup Instructions

### Backend Setup

1. **Install Dependencies**

   ```bash
   cd Backend
   npm install
   ```

2. **Start Server**

   ```bash
   npm start
   # Server will run on port 3001
   ```

3. **Verify Socket.IO Initialization**
   - Check console for "🔌 Socket.IO server initialized" message
   - Verify server is listening on port 3001

### Frontend Setup

1. **Install Dependencies**

   ```bash
   cd Frontend/Dashboard
   npm install
   # socket.io-client should be installed
   ```

2. **Start Development Server**

   ```bash
   npm run dev
   ```

3. **Access Dashboard**
   - Navigate to `http://172.20.10.10:5173/dashboard`
   - Login with admin credentials
   - Check connection status in header

## 🧪 Testing the System

### 1. Test Page

Navigate to `/dashboard/test` to access the comprehensive test interface:

- **Connection Status**: Monitor WebSocket connection
- **Test Notifications**: Send test notifications via API
- **Direct Socket Tests**: Test WebSocket directly
- **Debug Information**: View connection details

### 2. Test Notifications

1. **Via API**:

   ```bash
   curl -X POST "http://172.20.10.10:3001/api/admin-notifications/test-notification" \
     -H "Content-Type: application/json" \
     -d '{"message": "Test notification", "type": "test"}'
   ```

2. **Via Dashboard**:
   - Go to `/dashboard/test`
   - Enter test message
   - Click "Send Test Notification"

### 3. Test User Registration

1. **Register New User** in mobile app
2. **Check Admin Dashboard** for real-time notification
3. **Verify Notification** appears instantly

## 📱 How It Works

### Connection Flow

1. **Admin Dashboard Loads**

   - Connects to WebSocket server
   - Joins admin room automatically
   - Shows connection status

2. **User Registration**

   - Mobile app registers new user
   - Backend processes registration
   - Sends push notification to admin
   - Emits WebSocket notification to admin room

3. **Real-Time Display**
   - Dashboard receives notification instantly
   - Shows notification in real-time panel
   - Plays sound and shows browser notification

### Notification Types

- **User Registration**: New business user signs up
- **Login Requests**: Users request temporary access
- **Order Updates**: Order status changes
- **Product Updates**: Product information changes
- **Test Notifications**: Manual testing notifications

## 🔍 Troubleshooting

### Common Issues

1. **Connection Failed**

   - Check backend server is running
   - Verify port 3001 is accessible
   - Check firewall settings

2. **Notifications Not Appearing**

   - Verify admin is in admin room
   - Check browser console for errors
   - Verify notification permissions

3. **Socket Connection Issues**
   - Check network connectivity
   - Verify CORS settings
   - Check browser WebSocket support

### Debug Steps

1. **Check Console Logs**

   - Backend: Look for Socket.IO messages
   - Frontend: Check browser console
   - Look for connection status messages

2. **Verify API Endpoints**

   ```bash
   # Test admin notifications API
   curl "http://172.20.10.10:3001/api/admin-notifications/stats"

   # Test connection status
   curl "http://172.20.10.10:3001/api/admin-notifications/admin-clients"
   ```

3. **Check Network Tab**
   - Verify WebSocket connection
   - Check for failed requests
   - Monitor real-time communication

## 🎯 Usage Examples

### In Components

```jsx
import useAdminSocket from "../hooks/useAdminSocket";

const MyComponent = () => {
  const { isConnected, on, emit } = useAdminSocket(adminData);

  useEffect(() => {
    if (isConnected) {
      // Listen for notifications
      const unsubscribe = on("new-user-registration", (data) => {
        console.log("New user registered:", data);
        // Handle notification
      });

      return unsubscribe;
    }
  }, [isConnected, on]);

  return (
    <div>Connection Status: {isConnected ? "Connected" : "Disconnected"}</div>
  );
};
```

### Direct Service Usage

```jsx
import adminSocketService from "../services/adminSocketService";

// Connect to server
adminSocketService.connect("http://172.20.10.10:3001", adminData);

// Listen for events
adminSocketService.on("new-user-registration", (data) => {
  console.log("New user:", data);
});

// Emit events
adminSocketService.emit("custom-event", { message: "Hello" });
```

## 🔒 Security Considerations

- **Admin Room Access**: Only authenticated admins can join
- **CORS Configuration**: Properly configured for production
- **Authentication**: JWT tokens for secure connections
- **Rate Limiting**: Implemented to prevent abuse

## 🚀 Production Deployment

1. **Update Server URLs**

   - Change `172.20.10.10:3001` to production domain
   - Update CORS settings
   - Configure SSL certificates

2. **Environment Variables**

   ```bash
   NODE_ENV=production
   PORT=3001
   CORS_ORIGIN=https://yourdomain.com
   ```

3. **Monitoring**
   - Log connection attempts
   - Monitor notification delivery
   - Track WebSocket performance

## 📚 Additional Resources

- [Socket.IO Documentation](https://socket.io/docs/)
- [React Hooks Guide](https://reactjs.org/docs/hooks-intro.html)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

## 🆘 Support

For issues or questions:

1. Check this documentation
2. Review console logs
3. Test with the test interface
4. Check network connectivity
5. Verify backend server status
