import React, { useState, useEffect, Suspense } from "react";
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
  GalleryHorizontalIcon,
  GridViewIcon,
  UserRemove01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import "./DashboardLayout.css";
import dashboardLogo from "../../assests/dashboardlogo.png";
import NotificationManager from "../common/NotificationManager";
import { getUnreadCount } from "../../services/adminApiService";
import { logout } from "../../utils/authUtils";
import { initializeFirebaseMessaging, isFirebaseSupported } from "../../services/firebaseService";
import notificationSoundService from "../../services/notificationSoundService";
import RealtimeNotificationService from "../../services/realtimeNotificationService";

// Nav is grouped like the Amrut Admin design: Overview / Catalog / People / System.
const NavGroups = [
  {
    label: "Overview",
    links: [
      { name: "Dashboard", path: "/dashboard", icon: DashboardSquare01Icon },
      { name: "Orders", path: "/dashboard/orders", icon: ShoppingCart01Icon },
    ],
  },
  {
    label: "Catalog",
    links: [
      { name: "Products", path: "/dashboard/products", icon: PackageIcon },
      { name: "Categories", path: "/dashboard/categories", icon: Layers01Icon },
      { name: "Sliders", path: "/dashboard/sliders", icon: GalleryHorizontalIcon },
      { name: "Media Gallery", path: "/dashboard/media-gallery", icon: GridViewIcon },
    ],
  },
  {
    label: "People",
    links: [
      { name: "Users", path: "/dashboard/users", icon: UserGroupIcon },
      { name: "Consumers", path: "/dashboard/consumers", icon: UserIcon },
    ],
  },
  {
    label: "System",
    links: [
      { name: "Account Deletion", path: "/dashboard/account-deletion", icon: UserRemove01Icon },
    ],
  },
];

// Flattened list for page-title matching (incl. pages not in the sidebar).
const AllLinks = NavGroups.flatMap((g) => g.links);

// Page subtitles shown under the title in the topbar.
const PageMeta = {
  "/dashboard": "Store overview",
  "/dashboard/orders": "All channels · B2B, D2C and custom",
  "/dashboard/products": "Your gold & diamond catalog",
  "/dashboard/categories": "Organise the catalog",
  "/dashboard/sliders": "App home banners",
  "/dashboard/media-gallery": "Product & banner images",
  "/dashboard/users": "Wholesale (B2B) accounts & approvals",
  "/dashboard/consumers": "D2C storefront customers",
  "/dashboard/account-deletion": "Account deletion requests",
  "/dashboard/settings": "Store & app configuration",
  "/dashboard/profile": "Your admin profile",
  "/dashboard/notifications": "Push to the apps",
};

const ExtraTitles = {
  "/dashboard/settings": "Settings",
  "/dashboard/profile": "Profile",
  "/dashboard/notifications": "Notifications",
};

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= 768
  );
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [tooltip, setTooltip] = useState({ show: false, text: "", x: 0, y: 0 });
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize notifications and Firebase messaging
    const initNotifications = async () => {
      const adminToken = localStorage.getItem("admin_token");
      if (adminToken) {
        try {
          const response = await getUnreadCount(adminToken);
          setUnreadCount(response.unreadCount || 0);
        } catch (error) {
          console.error("Failed to fetch unread count:", error);
        }

        if (isFirebaseSupported()) {
          const success = await initializeFirebaseMessaging(adminToken, (payload) => {
            const notification = {
              id: Date.now(),
              title: payload.notification?.title || "New Notification",
              body: payload.notification?.body || "You have a new notification",
              type: payload.data?.notificationType || "default",
              created_at: new Date().toISOString(),
              data: payload.data || {},
              is_read: false,
            };

            const toastEvent = new CustomEvent("show-toast", { detail: { notification } });
            window.dispatchEvent(toastEvent);

            const notificationType =
              payload.data?.notificationType || payload.notification?.type || "default";
            notificationSoundService.playSound(notificationType.toLowerCase());

            updateUnreadCount();
          });
          if (success) {
            console.log("✅ [DASHBOARD] Firebase messaging initialized successfully");
          }
        }

        RealtimeNotificationService.connect();
      }
    };

    initNotifications();

    const interval = setInterval(async () => {
      const adminToken = localStorage.getItem("admin_token");
      if (adminToken) {
        try {
          const response = await getUnreadCount(adminToken);
          setUnreadCount(response.unreadCount || 0);
        } catch (error) {
          console.error("Failed to fetch unread count:", error);
        }
      }
    }, 30000);

    const handleClickOutside = (event) => {
      if (!event.target.closest(".notification-menu") && !event.target.closest(".profile-menu")) {
        setShowNotificationMenu(false);
        setShowProfileMenu(false);
      }
    };

    const handleNotificationUpdate = () => updateUnreadCount();

    document.addEventListener("click", handleClickOutside);
    window.addEventListener("notification-updated", handleNotificationUpdate);

    return () => {
      clearInterval(interval);
      RealtimeNotificationService.disconnect();
      document.removeEventListener("click", handleClickOutside);
      window.removeEventListener("notification-updated", handleNotificationUpdate);
    };
  }, []);

  const matchLink = () => {
    const path = location.pathname;
    return AllLinks.filter((link) =>
      link.path === "/dashboard" ? path === "/dashboard" : path.startsWith(link.path)
    ).sort((a, b) => b.path.length - a.path.length)[0];
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (ExtraTitles[path]) return ExtraTitles[path];
    const match = matchLink();
    return match ? match.name : "Dashboard";
  };

  const getPageSubtitle = () => PageMeta[location.pathname] || "";

  const isLinkActive = (linkPath) =>
    linkPath === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(linkPath) && location.pathname !== "/dashboard";

  const handleLogout = () => {
    setShowProfileMenu(false);
    setShowNotificationMenu(false);
    logout(navigate);
  };

  const handleNotificationClick = () => {
    setShowNotificationMenu(!showNotificationMenu);
    setShowProfileMenu(false);
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
      oscillator.type = "sine";
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      /* audio not available */
    }
  };

  const updateUnreadCount = async () => {
    const adminToken = localStorage.getItem("admin_token");
    if (adminToken) {
      try {
        const response = await getUnreadCount(adminToken);
        setUnreadCount(response.unreadCount || 0);
      } catch (error) {
        console.error("Failed to fetch unread count:", error);
      }
    }
  };

  const isMobile = () => typeof window !== "undefined" && window.innerWidth <= 768;

  return (
    <div className={`dashboard-layout${collapsed ? " collapsed" : ""}`}>
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <img src={dashboardLogo} alt="Amrut Jewels" className="sidebar-logo" />
          <div className="brand-text">
            <div className="brand-name">Amrut Jewels</div>
            <div className="brand-sub">Admin Console</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NavGroups.map((group) => (
            <div key={group.label} className="nav-section">
              <div className="nav-group">{group.label}</div>
              <ul>
                {group.links.map((link) => {
                  const active = isLinkActive(link.path);
                  return (
                    <li key={link.path}>
                      <Link
                        to={link.path}
                        className={active ? "active" : ""}
                        onClick={() => {
                          if (isMobile()) setCollapsed(true);
                          setTooltip({ show: false, text: "", x: 0, y: 0 });
                        }}
                        onMouseEnter={(e) => {
                          if (collapsed && !isMobile()) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setTooltip({
                              show: true,
                              text: link.name,
                              x: rect.right + 15,
                              y: rect.top + rect.height / 2,
                            });
                          }
                        }}
                        onMouseLeave={() => setTooltip({ show: false, text: "", x: 0, y: 0 })}
                      >
                        <HugeiconsIcon icon={link.icon} size={20} className="sidebar-icon" />
                        <span className="link-text">{link.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="sidefoot">
          <div className="sf-avatar">A</div>
          <div className="sf-meta">
            <div className="sf-who">Admin</div>
            <div className="sf-role">Super admin</div>
          </div>
        </div>
      </aside>

      {/* Scrim behind the mobile drawer */}
      <div
        className={`sidebar-scrim${!collapsed && isMobile() ? " show" : ""}`}
        onClick={() => setCollapsed(true)}
      />

      <button
        className="sidebar-toggle-btn"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <HugeiconsIcon icon={ArrowLeftDoubleIcon} size={18} />
      </button>

      <div className="dashboard-main-wrapper">
        <header className="dashboard-header">
          <div className="header-titles">
            <h1 className="dashboard-title">{getPageTitle()}</h1>
            {getPageSubtitle() && <div className="dashboard-subtitle">{getPageSubtitle()}</div>}
          </div>

          <label className="topbar-search">
            <HugeiconsIcon icon={Search01Icon} size={16} />
            <input type="search" placeholder="Search orders, SKU, customer…" aria-label="Search" />
          </label>

          <div className="header-actions">
            <div className="notification-menu">
              <button
                className="header-icon-btn"
                onClick={handleNotificationClick}
                title="Notifications"
              >
                <HugeiconsIcon icon={Notification03Icon} size={20} />
                {unreadCount > 0 && <span className="notif-dot" />}
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
                <HugeiconsIcon icon={UserIcon} size={20} />
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
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    <HugeiconsIcon icon={Logout01Icon} size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="dashboard-content">
          <Suspense
            fallback={
              <div className="dash-content-loading">
                <span className="dash-content-spinner" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>

        <footer className="dashboard-footer">
          &copy; {new Date().getFullYear()} Amrut Jewels Admin
        </footer>
      </div>

      {/* Collapsed-rail tooltip (desktop) */}
      {tooltip.show && collapsed && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x,
            top: tooltip.y,
            transform: "translateY(-50%)",
            background: "linear-gradient(135deg, #4c0a23 0%, #7c1f43 100%)",
            color: "#fce2bf",
            padding: "8px 16px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            whiteSpace: "nowrap",
            zIndex: 2147483647,
            boxShadow: "0 4px 12px rgba(58, 6, 25, 0.35)",
            border: "1px solid rgba(252, 226, 191, 0.2)",
            pointerEvents: "none",
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
