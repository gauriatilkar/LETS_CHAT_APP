const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const path = require("path");
const cors = require("cors");

dotenv.config();
connectDB();
const app = express();

// CORS Configuration - Fixed
const allowedOrigins = [
  "https://letschatapp-git-main-gauriatilkar-8221s-projects.vercel.app",
  "https://letschatapp-git-main-gauriatilkar-8221s-projects.vercel.app/",
  "http://localhost:3000",
  "http://localhost:3000/",
];

// Simple and reliable CORS setup
app.use(
  cors({
    origin: function (origin, callback) {
      console.log("Incoming origin:", origin); // Debug log

      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // Remove trailing slash for comparison
      const normalizedOrigin = origin.replace(/\/$/, "");
      const normalizedAllowedOrigins = allowedOrigins.map((o) =>
        o.replace(/\/$/, "")
      );

      if (normalizedAllowedOrigins.includes(normalizedOrigin)) {
        callback(null, true);
      } else {
        console.log("Origin not allowed:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["*"],
    maxAge: 86400, // Cache preflight for 24 hours
  })
);

// Explicit preflight handling for all routes
app.options("*", (req, res) => {
  const origin = req.headers.origin;

  if (
    !origin ||
    allowedOrigins.some((allowed) => {
      const normalizedOrigin = origin.replace(/\/$/, "");
      const normalizedAllowed = allowed.replace(/\/$/, "");
      return normalizedOrigin === normalizedAllowed;
    })
  ) {
    res.header("Access-Control-Allow-Origin", origin || "*");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With"
    );
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Max-Age", "86400");
  }

  res.sendStatus(200);
});

// Body parser middleware
app.use(express.json());

// API Routes
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// Root route for testing
app.get("/", (req, res) => {
  res.json({ message: "Chat App Backend API is running!" });
});

// Error Handling middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () =>
  console.log(`Server running on PORT ${PORT}...`)
);

// Socket.io configuration with proper CORS
const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");

  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;

    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;

      socket.in(user._id).emit("message recieved", newMessageRecieved);
    });
  });

  socket.on("disconnect", () => {
    console.log("USER DISCONNECTED");
  });
});

module.exports = app;
