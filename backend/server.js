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

mongoose.set("bufferCommands", false);

const isProduction = process.env.NODE_ENV === "production";
const localOrigins = ["http://127.0.0.1:5173", "http://localhost:5173"];
const allowedOrigins = isProduction
  ? [process.env.CLIENT_URL].filter(Boolean)
  : [...new Set([process.env.CLIENT_URL, ...localOrigins].filter(Boolean))];

console.log("Allowed origins:", allowedOrigins);

const isAllowedOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  return allowedOrigins.includes(origin);
};

const corsOptions = {
  origin(origin, callback) {
    const allowed = true;

    console.log("CORS check", {
      origin: origin || "no-origin",
      allowed,
    });

    return callback(null, true);
  },
  credentials: true,
};

const app = express();
const server = http.createServer(app);

initSocket(server, isAllowedOrigin);

app.set("trust proxy", 1);
app.use(express.json());
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(cookieParser());

app.get("/", (_req, res) => {
  res.status(200).json({ message: "Chat MVP backend is running" });
});

app.get("/health/db", async (_req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    return res.status(200).json({
      db: "connected",
      readyState: mongoose.connection.readyState,
    });
  } catch (error) {
    return res.status(503).json({
      db: "unhealthy",
      readyState: mongoose.connection.readyState,
      message: error.message,
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api", messageRoutes);

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      family: 4,
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
