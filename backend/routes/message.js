import express from "express";
import mongoose from "mongoose";
import Message from "../models/Message.js";
import User from "../models/User.js";
import protectRoute from "../middleware/auth.js";
import { getIO, getOnlineUserIds, getReceiverSocketIds } from "../socket.js";

const router = express.Router();

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

router.get("/users", protectRoute, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.userId } }).sort({ fullName: 1 });

    const onlineUserIds = new Set(getOnlineUserIds());

    const formattedUsers = await Promise.all(
      users.map(async (user) => {
        const lastMessage = await Message.findOne({
          $or: [
            { senderId: req.userId, receiverId: user._id },
            { senderId: user._id, receiverId: req.userId },
          ],
        })
          .sort({ createdAt: -1 })
          .lean();

        return {
          _id: user._id.toString(),
          fullName: user.fullName,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          isOnline: onlineUserIds.has(user._id.toString()),
          lastMessage: lastMessage
            ? {
                _id: lastMessage._id.toString(),
                senderId: lastMessage.senderId.toString(),
                receiverId: lastMessage.receiverId.toString(),
                text: lastMessage.text,
                createdAt: lastMessage.createdAt,
              }
            : null,
        };
      })
    );

    formattedUsers.sort((left, right) => {
      const leftTime = left.lastMessage ? new Date(left.lastMessage.createdAt).getTime() : 0;
      const rightTime = right.lastMessage ? new Date(right.lastMessage.createdAt).getTime() : 0;

      if (leftTime !== rightTime) {
        return rightTime - leftTime;
      }

      return left.fullName.localeCompare(right.fullName);
    });

    return res.status(200).json(formattedUsers);
  } catch (error) {
    console.error("Fetch users failed:", error);
    return res.status(500).json({ message: "Failed to fetch users" });
  }
});

router.get("/messages/:id", protectRoute, async (req, res) => {
  try {
    const { id: chatUserId } = req.params;

    if (!isValidObjectId(chatUserId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const chatUser = await User.findById(chatUserId);

    if (!chatUser) {
      return res.status(404).json({ message: "Chat user not found" });
    }

    const messages = await Message.find({
      $or: [
        { senderId: req.userId, receiverId: chatUserId },
        { senderId: chatUserId, receiverId: req.userId },
      ],
    }).sort({ createdAt: 1 });

    return res.status(200).json(messages);
  } catch (error) {
    console.error("Fetch messages failed:", error);
    return res.status(500).json({ message: "Failed to fetch messages" });
  }
});

router.post("/messages/send/:id", protectRoute, async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const { text } = req.body;

    if (!isValidObjectId(receiverId)) {
      return res.status(400).json({ message: "Invalid receiver id" });
    }

    if (receiverId === req.userId) {
      return res.status(400).json({ message: "You cannot message yourself" });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const receiver = await User.findById(receiverId);

    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    const newMessage = await Message.create({
      senderId: req.userId,
      receiverId,
      text: text.trim(),
    });

    const receiverSocketIds = getReceiverSocketIds(receiverId);
    const io = getIO();

    if (receiverSocketIds.length > 0 && io) {
      receiverSocketIds.forEach((socketId) => {
        io.to(socketId).emit("newMessage", newMessage);
      });
    }

    return res.status(201).json(newMessage);
  } catch (error) {
    console.error("Send message failed:", error);
    return res.status(500).json({ message: "Failed to send message" });
  }
});

export default router;
