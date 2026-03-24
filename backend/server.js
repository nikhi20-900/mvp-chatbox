import dotenv from "dotenv";
dotenv.config();

import http from "http";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import messageRoutes from "./routes/message.js";
import { initSocket } from "./socket.js";

const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
}

const allowedOriginPatterns = [
  /^http:\/\/127\.0\.0\.1:\d+$/,
  /^http:\/\/localhost:\d+$/,
];

const isAllowedOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) {
    return true;
  }

  return allowedOriginPatterns.some((pattern) => pattern.test(origin));
};

const app = express();
const server = http.createServer(app);

initSocket(server, isAllowedOrigin);

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/", (_req, res) => {
  res.status(200).json({ message: "Chat MVP backend is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api", messageRoutes);

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log("Connected to MongoDB");

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
