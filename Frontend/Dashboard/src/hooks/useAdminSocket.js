import { useEffect, useRef, useState } from "react";
import adminSocketService from "../services/adminSocketService";

/**
 * Custom hook for admin WebSocket functionality
 * @param {Object} adminData - Admin user data
 * @param {string} serverUrl - WebSocket server URL
 * @returns {Object} - Socket service and connection status
 */
export const useAdminSocket = (
  adminData = null,
  serverUrl = "http://172.20.10.10:3001"
) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const eventListenersRef = useRef(new Map());

  // Initialize connection
  useEffect(() => {
    if (adminData) {
      console.log(
        "🔌 [USE ADMIN SOCKET] Initializing with admin data:",
        adminData
      );
      adminSocketService.connect(serverUrl, adminData);
    }
  }, [adminData, serverUrl]);

  // Update admin data when it changes
  useEffect(() => {
    if (adminData) {
      adminSocketService.setAdminData(adminData);
    }
  }, [adminData]);

  // Monitor connection status
  useEffect(() => {
    const updateConnectionStatus = () => {
      const connected = adminSocketService.getConnectionStatus();
      setIsConnected(connected);
      setConnectionStatus(connected ? "connected" : "disconnected");
    };

    // Initial status
    updateConnectionStatus();

    // Listen for connection changes
    const handleConnect = () => {
      console.log("✅ [USE ADMIN SOCKET] Connected");
      setIsConnected(true);
      setConnectionStatus("connected");
    };

    const handleDisconnect = () => {
      console.log("❌ [USE ADMIN SOCKET] Disconnected");
      setIsConnected(false);
      setConnectionStatus("disconnected");
    };

    const handleAdminRoomJoined = (data) => {
      console.log("✅ [USE ADMIN SOCKET] Admin room joined:", data);
      setConnectionStatus("admin-room-joined");
    };

    // Add event listeners
    adminSocketService.on("connect", handleConnect);
    adminSocketService.on("disconnect", handleDisconnect);
    adminSocketService.on("admin-room-joined", handleAdminRoomJoined);

    // Cleanup
    return () => {
      adminSocketService.off("connect", handleConnect);
      adminSocketService.off("disconnect", handleDisconnect);
      adminSocketService.off("admin-room-joined", handleAdminRoomJoined);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't disconnect here as other components might be using it
      // adminSocketService.disconnect();
    };
  }, []);

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  const on = (event, callback) => {
    if (!eventListenersRef.current.has(event)) {
      eventListenersRef.current.set(event, []);
    }

    const listeners = eventListenersRef.current.get(event);
    listeners.push(callback);

    // Add listener to socket service
    adminSocketService.on(event, callback);

    return () => {
      // Remove from our tracking
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }

      // Remove from socket service
      adminSocketService.off(event, callback);
    };
  };

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  const off = (event, callback) => {
    adminSocketService.off(event, callback);

    if (eventListenersRef.current.has(event)) {
      const listeners = eventListenersRef.current.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  };

  /**
   * Emit event to server
   * @param {string} event - Event name
   * @param {any} data - Data to emit
   */
  const emit = (event, data) => {
    adminSocketService.emit(event, data);
  };

  /**
   * Disconnect from server
   */
  const disconnect = () => {
    adminSocketService.disconnect();
  };

  /**
   * Get admin data
   * @returns {Object|null} - Admin data
   */
  const getAdminData = () => {
    return adminSocketService.getAdminData();
  };

  return {
    // Connection status
    isConnected,
    connectionStatus,

    // Socket methods
    on,
    off,
    emit,
    disconnect,
    getAdminData,

    // Direct access to service
    socketService: adminSocketService,
  };
};

export default useAdminSocket;
