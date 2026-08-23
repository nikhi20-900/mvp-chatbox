import dotenv from "dotenv";
dotenv.config();

import http from "http";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import messageRoutes from "./routes/message.js";
import groupRoutes from "./routes/group.js";
import { initSocket } from "./socket.js";

const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
}

mongoose.set("bufferCommands", false);

const isProduction = process.env.NODE_ENV === "production";

/* ── Strict CORS Whitelist ────────────────────────────────────── */
const defaultAllowed = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://mvp-chatbox.vercel.app",
];

if (process.env.CLIENT_URL) {
  defaultAllowed.push(process.env.CLIENT_URL.trim().replace(/\/$/, ""));
}

const allowedOrigins = [...new Set(defaultAllowed)];
console.log("Strict allowed origins:", allowedOrigins);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  const normalized = origin.trim().replace(/\/$/, "");
  return allowedOrigins.includes(normalized);
};

const corsOptions = {
  origin(origin, callback) {
    if (!origin || isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
};

const app = express();
const server = http.createServer(app);

initSocket(server, isAllowedOrigin);

app.set("trust proxy", 1);

/* ── Security Headers via Helmet ──────────────────────────────── */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

/* ── Request Size Limits ──────────────────────────────────────── */
app.use(express.json({ limit: "2mb" }));
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(cookieParser());

/* ── Rate Limiters ────────────────────────────────────────────── */
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // max 120 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // max 15 login/signup attempts per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many authentication attempts. Please try again in 15 minutes." },
});

const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 45, // max 45 message sends per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "You are sending messages too quickly. Please slow down." },
});

/* ── Apply Rate Limiters ──────────────────────────────────────── */
app.use("/api", globalLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);

/* ── Health Checks ────────────────────────────────────────────── */
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

/* ── Routes ───────────────────────────────────────────────────── */
app.use("/api/auth", authRoutes);
app.use("/api/messages/send", messageLimiter);
app.use("/api", messageRoutes);
app.use("/api", groupRoutes);

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
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
