const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const { config, getCorsOrigins } = require("./config/environment");

// Import database setup
const createTablesAndAdmin = require("./scripts/setup");

// Import routes
const userRoutes = require("./routes/user");
const productRoutes = require("./routes/product");
const categoryRoutes = require("./routes/category");
const orderRoutes = require("./routes/order");
const cartRoutes = require("./routes/cart");
const sliderRoutes = require("./routes/slider");
const mediaGalleryRoutes = require("./routes/mediaGallery");
const searchRoutes = require("./routes/search");
const dashboardRoutes = require("./routes/dashboard");
const notificationRoutes = require("./routes/notifications");
const adminNotificationRoutes = require("./routes/adminNotifications");
const seoRoutes = require("./routes/seo");
const accountDeletionRoutes = require("./routes/accountDeletion");
const systemRoutes = require("./routes/system");
const customOrderRoutes = require("./routes/customOrder");
const paymentRoutes = require("./routes/payment");
const settingsRoutes = require("./routes/settings");

const app = express();

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = getCorsOrigins();
    if (!origin) return callback(null, true);

    // Allow exact matches from config
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow subdomains of your production domains (e.g. dashboard.*, www.*)
    // Origin never contains a path, only scheme + host (+ optional port).
    try {
      const url = new URL(origin);
      const host = url.hostname.toLowerCase();

      const allowedBaseDomains = [
        "amrutkumargovinddasllp.com",
        "api.amrutkumargovinddasllp.com",
      ];

      const isAllowedDomain = allowedBaseDomains.some(
        (d) => host === d || host.endsWith(`.${d}`)
      );

      if (isAllowedDomain) {
        return callback(null, true);
      }
    } catch (e) {
      // If origin is not a valid URL, fall through to block.
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    // Allow cache-busting headers used by frontend clients
    "Cache-Control",
    "Pragma",
    "Expires",
  ],
};

app.use(cors(corsOptions));

// Security headers + rate limiting. Loaded optionally so the server still
// runs if the packages aren't installed yet (FTP deploy doesn't npm install).
// To enable: run `npm install helmet express-rate-limit` on the server.
try {
  const helmet = require("helmet");
  app.use(helmet({ crossOriginResourcePolicy: false })); // allow image loads
} catch (e) {
  console.warn("[security] helmet not installed — run `npm install helmet`");
}
try {
  const rateLimit = require("express-rate-limit");
  // Throttle OTP / auth endpoints to curb abuse.
  const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many attempts. Please try again later." },
  });
  app.use("/api/users/verify-otp", authLimiter);
  app.use("/api/users/send-otp", authLimiter);
} catch (e) {
  console.warn(
    "[security] express-rate-limit not installed — run `npm install express-rate-limit`",
  );
}

// Body parsing middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Serve uploaded files
app.use("/uploads", express.static("uploads"));

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/slider", sliderRoutes);
app.use("/api/media-gallery", mediaGalleryRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin-notifications", adminNotificationRoutes);
app.use("/api/seo", seoRoutes);
app.use("/api/account-deletion", accountDeletionRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/custom-orders", customOrderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/settings", settingsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(500).json({ error: "Internal server error" });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const PORT = config.SERVER.PORT;
const HOST = config.SERVER.HOST;

// Prevent multiple server starts
let serverStarted = false;

// Start server with database setup
async function startServer() {
  if (serverStarted) {
    return;
  }

  try {
    // Try database setup, but don't fail if it doesn't work
    try {
    await createTablesAndAdmin();
    } catch (dbError) {
      }

    // Start the server even if database failed
    app.listen(PORT, HOST, () => {
      serverStarted = true;
      });
  } catch (error) {
    process.exit(1);
  }
}

// Process-level safety nets: log and keep the API alive instead of letting a
// stray promise rejection or async error take the whole process down.
process.on("unhandledRejection", (reason) => {
  console.error("[process] Unhandled promise rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[process] Uncaught exception:", err);
});

// Only start server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = app;
