const express = require('express');
const router = express.Router();
const socketService = require('../services/socketService');
const { getAdminNotificationStats } = require('../services/adminNotificationService');

// Get admin notification statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await getAdminNotificationStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get notification statistics'
    });
  }
});

// Get connected admin clients info
router.get('/admin-clients', (req, res) => {
  try {
    const adminClients = socketService.getAdminClients();
    const adminCount = socketService.getAdminClientsCount();
    
    res.json({
      success: true,
      data: {
        adminClients,
        adminCount,
        totalConnectedClients: socketService.getConnectedClientsCount()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get admin clients information'
    });
  }
});

// Test real-time notification (for development)
router.post('/test-notification', (req, res) => {
  try {
    const { message, type = 'test' } = req.body;
    
    // Send test notification to admin room
    socketService.emitToRoom('admin', 'test-notification', {
      message: message || 'Test notification from admin dashboard',
      type,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Test notification sent to admin dashboard',
      adminClientsCount: socketService.getAdminClientsCount()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to send test notification'
    });
  }
});

module.exports = router;

