const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const path = require("path");
const cors = require("cors");

// Load environment variables FIRST
dotenv.config();

// Connect to database
connectDB().catch(console.error);

const app = express();

// CRITICAL: CORS must be the very first middleware
// This ensures CORS headers are set even if other middleware fails

app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Log every request for debugging
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log("Origin:", origin);
  console.log("User-Agent:", req.headers["user-agent"]);

  // Always set CORS headers for your frontend domain
  if (
    origin ===
    "https://letschatapp-git-main-gauriatilkar-8221s-projects.vercel.app"
  ) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  // Set all required CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept, Origin"
  );
  res.setHeader("Access-Control-Max-Age", "86400");

  // Handle preflight OPTIONS requests immediately
  if (req.method === "OPTIONS") {
    console.log("OPTIONS request - sending 200");
    res.status(200).end();
    return;
  }

  next();
});

// Additional CORS using cors package as backup
app.use(
  cors({
    origin:
      "https://letschatapp-git-main-gauriatilkar-8221s-projects.vercel.app",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    optionsSuccessStatus: 200,
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get("/", (req, res) => {
  console.log("Health check accessed");
  res.json({
    message: "Chat App Backend API is running!",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
});

// CORS test route
app.get("/api/test", (req, res) => {
  console.log("Test route accessed");
  res.json({
    message: "CORS test successful",
    origin: req.headers.origin,
    timestamp: new Date().toISOString(),
  });
});

// Wrap routes with error handling to prevent CORS headers from being lost
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error("Route error:", error);

    // Ensure CORS headers are still set even on error
    if (
      req.headers.origin ===
      "https://letschatapp-git-main-gauriatilkar-8221s-projects.vercel.app"
    ) {
      res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }

    next(error);
  });
};

// API Routes with error handling
app.use(
  "/api/user",
  asyncHandler((req, res, next) => {
    userRoutes(req, res, next);
  })
);
app.use(
  "/api/chat",
  asyncHandler((req, res, next) => {
    chatRoutes(req, res, next);
  })
);
app.use(
  "/api/message",
  asyncHandler((req, res, next) => {
    messageRoutes(req, res, next);
  })
);

// Custom error handler that preserves CORS headers
app.use((error, req, res, next) => {
  console.error("Error handler triggered:", error.message);

  // Ensure CORS headers are set even in error responses
  if (
    req.headers.origin ===
    "https://letschatapp-git-main-gauriatilkar-8221s-projects.vercel.app"
  ) {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  res.status(error.statusCode || 500).json({
    message: error.message,
    stack: process.env.NODE_ENV === "production" ? null : error.stack,
  });
});

// Fallback error handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app;
