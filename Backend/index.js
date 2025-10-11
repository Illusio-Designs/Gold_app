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
const appIconRoutes = require("./routes/appIcon");
const appVersionRoutes = require("./routes/appVersion");
const loginRequestRoutes = require("./routes/loginRequest");
const mediaGalleryRoutes = require("./routes/mediaGallery");
const searchRoutes = require("./routes/search");
const dashboardRoutes = require("./routes/dashboard");
const notificationRoutes = require("./routes/notifications");
const adminNotificationRoutes = require("./routes/adminNotifications");
const seoRoutes = require("./routes/seo");

const app = express();

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = getCorsOrigins();
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log("CORS blocked origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
  ],
};

app.use(cors(corsOptions));

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
app.use("/api/app-icons", appIconRoutes);
app.use("/api/app-versions", appVersionRoutes);
app.use("/api/login-requests", loginRequestRoutes);
app.use("/api/media-gallery", mediaGalleryRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin-notifications", adminNotificationRoutes);
app.use("/api/seo", seoRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
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
    console.log("⚠️ Server already started, skipping...");
    return;
  }

  try {
    console.log("🚀 Starting server with database setup...");

    // Try database setup, but don't fail if it doesn't work
    try {
    await createTablesAndAdmin();
    } catch (dbError) {
      console.warn("⚠️ Database setup failed, but server will continue:", dbError.message);
    }

    // Start the server even if database failed
    app.listen(PORT, HOST, () => {
      serverStarted = true;
      console.log(`✅ Server running on http://${HOST}:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`CORS Origins: ${getCorsOrigins().join(", ")}`);
      console.log("🎉 Server is ready to accept requests!");
      console.log("📄 SEO endpoint available at: /api/seo");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Only start server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = app;
