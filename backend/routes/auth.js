import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import protectRoute from "../middleware/auth.js";

const router = express.Router();

const generateTokenAndSetCookie = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("jwt", token, {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return token;
};

const formatAuthResponse = (user, token = null) => ({
  _id: user._id.toString(),
  fullName: user.fullName,
  email: user.email,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  token,
});

router.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedFullName = fullName?.trim();

    if (!normalizedFullName || !normalizedEmail || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      fullName: normalizedFullName,
      email: normalizedEmail,
      password: hashedPassword,
    });

    const token = generateTokenAndSetCookie(newUser._id, res);

    return res.status(201).json(formatAuthResponse(newUser, token));
  } catch (error) {
    console.error("Signup failed:", error);
    return res.status(500).json({ message: "Failed to sign up" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateTokenAndSetCookie(user._id, res);

    return res.status(200).json(formatAuthResponse(user, token));
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({ message: "Failed to log in" });
  }
});

router.post("/logout", (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.clearCookie("jwt", {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
  });
  return res.status(200).json({ message: "Logged out successfully" });
});

router.get("/me", protectRoute, async (req, res) => {
  try {
    return res.status(200).json(formatAuthResponse(req.user));
  } catch (error) {
    console.error("Fetch current user failed:", error);
    return res.status(500).json({ message: "Failed to fetch user" });
  }
});

export default router;
