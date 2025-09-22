const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parser
app.use(express.json());

// Add this before your routes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// Health check route
app.get("/", (req, res) => {
  res.json({
    message: "Chat App Backend is running!",
    timestamp: new Date().toISOString(),
    origin: req.headers.origin,
  });
});

// Import routes directly (remove try-catch that creates fallbacks)
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

// Connect to database
connectDB().catch((err) => console.log("DB connection error:", err));

// Create HTTP server for Socket.IO
const server = http.createServer(app);

// Initialize Socket.IO
const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "*",
    credentials: true,
  },
});

// Make io accessible to controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("Connected to socket.io");
  socket.userId = null;

  socket.on("setup", (userData) => {
    socket.userId = userData._id;
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageReceived) => {
    var chat = newMessageReceived.chat;
    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id == newMessageReceived.sender._id) return;
      socket.in(user._id).emit("message recieved", newMessageReceived);
    });
  });

  socket.on("message updated", ({ chatId, message }) => {
    // Broadcast to all users in the chat
    socket.to(chatId).emit("message updated", message);
  });

  socket.on("message deleted", ({ chatId, messageId, deleteFor }) => {
    // Broadcast to all users in the chat
    socket.to(chatId).emit("message deleted", {
      messageId,
      deleteFor,
      timestamp: new Date(),
    });
  });

  socket.on("message viewed", ({ messageId, chatId, userId }) => {
    socket.to(chatId).emit("message viewed", { messageId, userId });
  });

  socket.on("message read", ({ messageId, chatId }) => {
    socket.to(chatId).emit("message read", {
      messageId: messageId,
      userId: socket.userId,
      readAt: new Date(),
    });
  });

  socket.on("disconnect", () => {});
});

// API Routes - USE THE ACTUAL ROUTES, NOT FALLBACKS
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// Error Handling middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on PORT ${PORT}`);
});

module.exports = app;
