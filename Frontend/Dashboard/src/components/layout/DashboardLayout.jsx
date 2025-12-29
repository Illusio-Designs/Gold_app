import React, { useState, useEffect } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  Layers,
  Store,
  Star,
  Settings,
  ShoppingCart,
  FileText,
  User,
  Bell,
  LogOut,
  ChevronsLeft,
  Maximize,
  Minimize,
  Image as ImageIcon,
  Smartphone,
  Palette,
} from "lucide-react";
import "./DashboardLayout.css";
import dashboardLogo from "../../assests/dashboardlogo.png";
import NotificationManager from "../common/NotificationManager";
import ToastManager from "../common/ToastManager";
import RealTimeNotifications from "../RealTimeNotifications";
import { getUnreadCount, getStoredTokens } from "../../services/adminApiService";
import { logout, getAdminToken } from "../../utils/authUtils";
import { initializeFirebaseMessaging, isFirebaseSupported } from "../../services/firebaseService";
import notificationSoundService from "../../services/notificationSoundService";
import RealtimeNotificationService from "../../services/realtimeNotificationService";

const SidebarLinks = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Sliders", path: "/dashboard/sliders", icon: ImageIcon },
  { name: "Users", path: "/dashboard/users", icon: Users },
  { name: "Categories", path: "/dashboard/categories", icon: Layers },
  { name: "Products", path: "/dashboard/products", icon: Package },
  { name: "Orders", path: "/dashboard/orders", icon: ShoppingCart },
  { name: "Media Gallery", path: "/dashboard/media-gallery", icon: ImageIcon },
  { name: "App Versions", path: "/dashboard/app-versions", icon: Smartphone },
  { name: "App Icons", path: "/dashboard/app-icons", icon: Palette },
];

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 });
  const location = useLocation();
  const navigate = useNavigate();
  const audioRef = React.useRef(null);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    // Debug function to check current state
    const debugFirebaseState = async () => {
      const adminToken = localStorage.getItem("admin_token");
      console.log('🔍 [DEBUG] Current admin token:', adminToken ? adminToken.substring(0, 20) + '...' : 'null');
      console.log('🔍 [DEBUG] Firebase supported:', isFirebaseSupported());
      console.log('🔍 [DEBUG] Service worker supported:', 'serviceWorker' in navigator);
      console.log('🔍 [DEBUG] Push manager supported:', 'PushManager' in window);
      
      if (adminToken) {
        try {
          // Check if we can get stored tokens
          const tokens = await getStoredTokens(adminToken);
          console.log('🔍 [DEBUG] Stored tokens:', tokens);
        } catch (error) {
          console.error('🔍 [DEBUG] Error getting stored tokens:', error);
        }
      }
    };
    
    // Initialize notifications and Firebase messaging
    const initNotifications = async () => {
      const adminToken = localStorage.getItem("admin_token");
      if (adminToken) {
        // Debug current state
        await debugFirebaseState();
        
        // Fetch initial unread count
        try {
          const response = await getUnreadCount(adminToken);
          setUnreadCount(response.unreadCount || 0);
        } catch (error) {
          console.error('Failed to fetch unread count:', error);
        }
        
        // Initialize Firebase messaging if supported
        if (isFirebaseSupported()) {
          console.log('🔔 [DASHBOARD] Initializing Firebase messaging...');
          const success = await initializeFirebaseMessaging(adminToken, (payload) => {
            console.log('🔔 [DASHBOARD] Received Firebase notification:', payload);
            
            // Create notification object for toast
            const notification = {
              id: Date.now(),
              title: payload.notification?.title || 'New Notification',
              body: payload.notification?.body || 'You have a new notification',
              type: payload.data?.notificationType || 'default',
              created_at: new Date().toISOString(),
              data: payload.data || {},
              is_read: false
            };
            
            console.log('🔔 [DASHBOARD] Created notification object for toast:', notification);
            console.log('🔔 [DASHBOARD] Notification type:', notification.type);
            console.log('🔔 [DASHBOARD] Notification data:', notification.data);
            
            // Show real-time toast notification
            const toastEvent = new CustomEvent('show-toast', {
              detail: { notification }
            });
            window.dispatchEvent(toastEvent);
            
            // Play notification sound
            const notificationType = payload.data?.notificationType || payload.notification?.type || 'default';
            notificationSoundService.playSound(notificationType.toLowerCase());
            
            // Update unread count
            updateUnreadCount();
          });
          
          if (success) {
            console.log('✅ [DASHBOARD] Firebase messaging initialized successfully');
          } else {
            console.log('⚠️ [DASHBOARD] Firebase messaging initialization failed');
          }
        } else {
          console.log('⚠️ [DASHBOARD] Firebase messaging not supported in this browser');
        }
        
        // Initialize real-time notification service
        console.log('🔔 [DASHBOARD] Initializing real-time notification service...');
        RealtimeNotificationService.connect();
        console.log('✅ [DASHBOARD] Real-time notification service initialized');
      }
    };
    
    initNotifications();
    
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    
    // Set up polling for unread count
    const interval = setInterval(async () => {
      const adminToken = localStorage.getItem("admin_token");
      if (adminToken) {
        try {
          const response = await getUnreadCount(adminToken);
          setUnreadCount(response.unreadCount || 0);
        } catch (error) {
          console.error('Failed to fetch unread count:', error);
        }
      }
    }, 30000); // Poll every 30 seconds
    
    // Click outside handler to close dropdowns
    const handleClickOutside = (event) => {
      if (!event.target.closest('.notification-menu') && !event.target.closest('.profile-menu')) {
        setShowNotificationMenu(false);
        setShowProfileMenu(false);
      }
    };
    
    // Listen for notification updates
    const handleNotificationUpdate = () => {
      updateUnreadCount();
    };
    
    document.addEventListener('click', handleClickOutside);
    window.addEventListener('notification-updated', handleNotificationUpdate);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('notification-updated', handleNotificationUpdate);
    };
  }, []);

  const getPageTitle = () => {
    const currentLink = SidebarLinks.find((link) =>
      location.pathname.startsWith(link.path)
    );
    return currentLink ? currentLink.name : "Dashboard";
  };

  const handleLogout = () => {
    // Close any open dropdowns
    setShowProfileMenu(false);
    setShowNotificationMenu(false);
    
    // Use utility function for logout
    logout(navigate);
  };

  const handleNotificationClick = () => {
    console.log('Notification bell clicked, current state:', showNotificationMenu);
    setShowNotificationMenu(!showNotificationMenu);
    setShowProfileMenu(false);
    
    // Play notification sound when bell is clicked
    try {
      // Create audio context for beep sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create oscillator for beep sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configure sound
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime); // 600Hz beep
      oscillator.type = 'sine';
      
      // Configure volume
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      // Play sound
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
      
      console.log('Bell click sound played successfully');
    } catch (error) {
      console.log('Could not play bell click sound:', error);
    }
  };

  const updateUnreadCount = async () => {
    const adminToken = localStorage.getItem("admin_token");
    if (adminToken) {
      try {
        const response = await getUnreadCount(adminToken);
        setUnreadCount(response.unreadCount || 0);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    }
  };

  return (
    <div className={`dashboard-layout${collapsed ? " collapsed" : ""}`}>
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <img
            src={dashboardLogo}
            alt="Amrut Jewels"
            className="sidebar-logo"
          />
        </div>
        <nav className="sidebar-nav">
          <ul>
            {SidebarLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.path === "/dashboard"
                  ? location.pathname === "/dashboard"
                  : location.pathname.startsWith(link.path) &&
                    location.pathname !== "/dashboard";
              return (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className={isActive ? "active" : ""}
                    onMouseEnter={(e) => {
                      if (collapsed) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltip({
                          show: true,
                          text: link.name,
                          x: rect.right + 15,
                          y: rect.top + rect.height / 2
                        });
                      }
                    }}
                    onMouseLeave={() => {
                      setTooltip({ show: false, text: '', x: 0, y: 0 });
                    }}
                  >
                    <Icon size={22} className="sidebar-icon" />
                    <span className="link-text">{link.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
      <button
        className="sidebar-toggle-btn"
        onClick={() => setCollapsed((c) => !c)}
      >
        <ChevronsLeft size={20} />
      </button>
      <div className="dashboard-main-wrapper">
        <header className="dashboard-header">
          <h1 className="dashboard-title">{getPageTitle()}</h1>
          <div className="header-actions">
            <button className="header-icon-btn" onClick={handleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
              {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
            </button>
            
            {/* Real-Time Notifications */}
            <RealTimeNotifications adminData={{ id: 1, name: 'Admin' }} />
            
            {/* Notification Bell */}
            <div className="notification-menu">
              <button
                className="header-icon-btn"
                onClick={handleNotificationClick}
                title="Notifications"
              >
                <Bell size={24} />
              </button>
              {showNotificationMenu && (
                <div className="notification-dropdown">
                  <NotificationManager isDropdown={true} onNotificationUpdate={updateUnreadCount} />
                </div>
              )}
            </div>
            
            <div className="profile-menu">
              <button
                className="profile-trigger"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <User size={24} />
                <span className="admin-name">Admin</span>
              </button>
              {showProfileMenu && (
                <div className="profile-dropdown">
                  <Link to="#" className="dropdown-item">
                    <User size={18} />
                    <span>Profile</span>
                  </Link>
                  <button 
                    className="dropdown-item"
                    onClick={() => {
                      setShowNotificationMenu(!showNotificationMenu);
                      setShowProfileMenu(false);
                    }}
                  >
                    <Bell size={18} />
                    <span>Notifications</span>
                  </button>
                  <Link to="/dashboard/settings" className="dropdown-item">
                    <Settings size={18} />
                    <span>Settings</span>
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button
                    className="dropdown-item logout"
                    onClick={handleLogout}
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="dashboard-content">
          <Outlet />
        </main>
        <footer className="dashboard-footer">
          &copy; 1991 Amrut Jewels Admin
        </footer>
      </div>
      
      {/* Toast Manager for real-time notifications */}
      <ToastManager />
      
      {/* Tooltip */}
      {tooltip.show && collapsed && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translateY(-50%)',
            background: 'linear-gradient(135deg, #5d0829 0%, #7d0a37 100%)',
            color: '#fce2bf',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            whiteSpace: 'nowrap',
            zIndex: 2147483647,
            boxShadow: '0 4px 12px rgba(93, 8, 41, 0.3)',
            border: '1px solid rgba(252, 226, 191, 0.2)',
            pointerEvents: 'none'
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
