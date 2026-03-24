import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import protectRoute from "../middleware/auth.js";
import { getIO } from "../socket.js";

const router = express.Router();
const MAX_AVATAR_LENGTH = 1_500_000;

const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
};

const generateTokenAndSetCookie = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, getCookieOptions());

  return token;
};

const formatAuthResponse = (user, token) => {
  const response = {
    _id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    avatar: user.avatar || "",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  if (token) {
    response.token = token;
  }

  return response;
};

router.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedFullName = fullName?.trim();

    console.log("Signup request received", {
      email: normalizedEmail,
      hasName: Boolean(normalizedFullName),
    });

    if (!normalizedFullName || !normalizedEmail || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    console.log("Checking existing user", { email: normalizedEmail });
    const existingUser = await User.findOne({ email: normalizedEmail });

    console.log("Signup lookup completed", {
      email: normalizedEmail,
      exists: Boolean(existingUser),
    });

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

    console.log("Signup user created", {
      userId: newUser._id.toString(),
      email: normalizedEmail,
    });

    const token = generateTokenAndSetCookie(newUser._id, res);

    console.log("Sending signup response", {
      userId: newUser._id.toString(),
      email: normalizedEmail,
    });

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

    console.log("Login request received", { email: normalizedEmail });

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    console.log("Checking login user", { email: normalizedEmail });
    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    console.log("Login lookup completed", {
      email: normalizedEmail,
      found: Boolean(user),
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateTokenAndSetCookie(user._id, res);

    console.log("Sending login response", {
      userId: user._id.toString(),
      email: normalizedEmail,
    });

    return res.status(200).json(formatAuthResponse(user, token));
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({ message: "Failed to log in" });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("jwt", getCookieOptions());
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

router.patch("/profile", protectRoute, async (req, res) => {
  try {
    const fullName = req.body.fullName?.trim();
    const avatar = typeof req.body.avatar === "string" ? req.body.avatar.trim() : "";

    if (!fullName || fullName.length < 2) {
      return res.status(400).json({ message: "Name must be at least 2 characters" });
    }

    if (avatar.length > MAX_AVATAR_LENGTH) {
      return res.status(400).json({ message: "Avatar image is too large" });
    }

    req.user.fullName = fullName;
    req.user.avatar = avatar;
    await req.user.save();

    const formattedUser = formatAuthResponse(req.user);
    const io = getIO();

    if (io) {
      io.emit("user:updated", formattedUser);
    }

    return res.status(200).json(formattedUser);
  } catch (error) {
    console.error("Update profile failed:", error);
    return res.status(500).json({ message: "Failed to update profile" });
  }
});

export default router;
