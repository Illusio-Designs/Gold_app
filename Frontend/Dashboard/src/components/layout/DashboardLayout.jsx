import React, { useState, useEffect } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardSquare01Icon,
  UserGroupIcon,
  PackageIcon,
  Layers01Icon,
  Settings01Icon,
  ShoppingCart01Icon,
  UserIcon,
  Notification03Icon,
  Logout01Icon,
  ArrowLeftDoubleIcon,
  Maximize01Icon,
  Minimize01Icon,
  Image01Icon,
  SmartPhone01Icon,
  PaintBoardIcon,
  UserRemove01Icon,
} from "@hugeicons/core-free-icons";
import "./DashboardLayout.css";
import dashboardLogo from "../../assests/dashboardlogo.png";
import NotificationManager from "../common/NotificationManager";
import { getUnreadCount } from "../../services/adminApiService";
import { logout } from "../../utils/authUtils";
import { initializeFirebaseMessaging, isFirebaseSupported } from "../../services/firebaseService";
import notificationSoundService from "../../services/notificationSoundService";
import RealtimeNotificationService from "../../services/realtimeNotificationService";

const SidebarLinks = [
  { name: "Dashboard", path: "/dashboard", icon: DashboardSquare01Icon },
  { name: "Sliders", path: "/dashboard/sliders", icon: Image01Icon },
  { name: "Users", path: "/dashboard/users", icon: UserGroupIcon },
  { name: "Categories", path: "/dashboard/categories", icon: Layers01Icon },
  { name: "Products", path: "/dashboard/products", icon: PackageIcon },
  { name: "Orders", path: "/dashboard/orders", icon: ShoppingCart01Icon },
  { name: "Media Gallery", path: "/dashboard/media-gallery", icon: Image01Icon },
  { name: "App Versions", path: "/dashboard/app-versions", icon: SmartPhone01Icon },
  { name: "App Icons", path: "/dashboard/app-icons", icon: PaintBoardIcon },
  { name: "Account Deletion", path: "/dashboard/account-deletion", icon: UserRemove01Icon },
];

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= 768
  );
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
    // Initialize notifications and Firebase messaging
    const initNotifications = async () => {
      const adminToken = localStorage.getItem("admin_token");
      if (adminToken) {
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
      // Stop the realtime notification polling so it doesn't keep hitting the
      // API with a cleared token after logout/unmount.
      RealtimeNotificationService.disconnect();
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('notification-updated', handleNotificationUpdate);
    };
  }, []);

  const getPageTitle = () => {
    const path = location.pathname;
    // Pages not in the sidebar.
    const extra = {
      "/dashboard/settings": "Settings",
      "/dashboard/profile": "Profile",
      "/dashboard/notifications": "Notifications",
      "/dashboard/account-deletion": "Account Deletion",
    };
    if (extra[path]) return extra[path];

    // Match the most specific sidebar link. The "/dashboard" root must match
    // exactly, otherwise it would win for every sub-path via startsWith.
    const match = SidebarLinks.filter((link) =>
      link.path === "/dashboard" ? path === "/dashboard" : path.startsWith(link.path)
    ).sort((a, b) => b.path.length - a.path.length)[0];

    return match ? match.name : "Dashboard";
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
              const iconDef = link.icon;
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
                    onClick={() => {
                      // On mobile, tapping a nav item closes the drawer.
                      if (window.innerWidth <= 768) setCollapsed(true);
                      setTooltip({ show: false, text: "", x: 0, y: 0 });
                    }}
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
                    <HugeiconsIcon icon={iconDef} size={22} className="sidebar-icon" />
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
        <HugeiconsIcon icon={ArrowLeftDoubleIcon} size={20} />
      </button>
      <div className="dashboard-main-wrapper">
        <header className="dashboard-header">
          <h1 className="dashboard-title">{getPageTitle()}</h1>
          <div className="header-actions">
            <button className="header-icon-btn" onClick={handleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
              {isFullscreen ? <HugeiconsIcon icon={Minimize01Icon} size={24} /> : <HugeiconsIcon icon={Maximize01Icon} size={24} />}
            </button>

            {/* Notification Bell */}
            <div className="notification-menu">
              <button
                className="header-icon-btn"
                onClick={handleNotificationClick}
                title="Notifications"
              >
                <HugeiconsIcon icon={Notification03Icon} size={24} />
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
                <HugeiconsIcon icon={UserIcon} size={24} />
                <span className="admin-name">Admin</span>
              </button>
              {showProfileMenu && (
                <div className="profile-dropdown">
                  <Link to="/dashboard/profile" className="dropdown-item">
                    <HugeiconsIcon icon={UserIcon} size={18} />
                    <span>Profile</span>
                  </Link>
                  <Link to="/dashboard/notifications" className="dropdown-item">
                    <HugeiconsIcon icon={Notification03Icon} size={18} />
                    <span>Notifications</span>
                  </Link>
                  <Link to="/dashboard/settings" className="dropdown-item">
                    <HugeiconsIcon icon={Settings01Icon} size={18} />
                    <span>Settings</span>
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button
                    className="dropdown-item logout"
                    onClick={handleLogout}
                  >
                    <HugeiconsIcon icon={Logout01Icon} size={18} />
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
          &copy; {new Date().getFullYear()} Amrut Jewels Admin
        </footer>
      </div>

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
