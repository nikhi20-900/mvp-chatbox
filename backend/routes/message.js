import express from "express";
import mongoose from "mongoose";
import Message from "../models/Message.js";
import User from "../models/User.js";
import protectRoute from "../middleware/auth.js";
import { getIO, getOnlineUserIds, getReceiverSocketIds } from "../socket.js";

const router = express.Router();

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
const MAX_MEDIA_BASE64_LENGTH = 4 * 1024 * 1024; // ~4MB base64

const formatMessagePreview = (message) =>
  message
    ? {
        _id: message._id.toString(),
        senderId: message.senderId.toString(),
        receiverId: message.receiverId.toString(),
        messageType: message.messageType || "text",
        text: message.text,
        createdAt: message.createdAt,
        deliveredAt: message.deliveredAt || null,
        readAt: message.readAt || null,
      }
    : null;

const emitMessageStatus = (io, userId, eventName, payload) => {
  if (!io || !userId) {
    return;
  }

  io.to(userId.toString()).emit(eventName, payload);
};

const markIncomingConversationState = async ({
  senderId,
  receiverId,
  markRead = false,
}) => {
  const pendingMessages = await Message.find({
    senderId,
    receiverId,
    $or: [{ deliveredAt: null }, ...(markRead ? [{ readAt: null }] : [])],
  })
    .select("_id deliveredAt readAt")
    .lean();

  if (!pendingMessages.length) {
    return {
      deliveredIds: [],
      deliveredAt: null,
      readIds: [],
      readAt: null,
    };
  }

  const deliveredIds = pendingMessages
    .filter((message) => !message.deliveredAt)
    .map((message) => message._id.toString());
  const readIds = markRead
    ? pendingMessages.filter((message) => !message.readAt).map((message) => message._id.toString())
    : [];
  const deliveredAt = deliveredIds.length ? new Date() : null;
  const readAt = readIds.length ? new Date() : null;
  const operations = [];

  if (deliveredIds.length) {
    operations.push({
      updateMany: {
        filter: { _id: { $in: deliveredIds } },
        update: { $set: { deliveredAt } },
      },
    });
  }

  if (readIds.length) {
    operations.push({
      updateMany: {
        filter: { _id: { $in: readIds }, deliveredAt: null },
        update: {
          $set: {
            deliveredAt: readAt,
            readAt,
          },
        },
      },
    });
    operations.push({
      updateMany: {
        filter: { _id: { $in: readIds }, deliveredAt: { $ne: null } },
        update: {
          $set: {
            readAt,
          },
        },
      },
    });
  }

  if (operations.length) {
    await Message.bulkWrite(operations);
  }

  return {
    deliveredIds,
    deliveredAt,
    readIds,
    readAt,
  };
};

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
        const unreadCount = await Message.countDocuments({
          senderId: user._id,
          receiverId: req.userId,
          readAt: null,
        });

        return {
          _id: user._id.toString(),
          fullName: user.fullName,
          email: user.email,
          avatar: user.avatar || "",
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          isOnline: onlineUserIds.has(user._id.toString()),
          unreadCount,
          lastMessage: formatMessagePreview(lastMessage),
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

    const io = getIO();
    const stateUpdate = await markIncomingConversationState({
      senderId: chatUserId,
      receiverId: req.userId,
      markRead: true,
    });

    const messages = await Message.find({
      $or: [
        { senderId: req.userId, receiverId: chatUserId },
        { senderId: chatUserId, receiverId: req.userId },
      ],
    }).sort({ createdAt: 1 });

    if (stateUpdate.deliveredIds.length && stateUpdate.deliveredAt) {
      emitMessageStatus(io, chatUserId, "message:delivered", {
        messageIds: stateUpdate.deliveredIds,
        deliveredAt: stateUpdate.deliveredAt.toISOString(),
      });
    }

    if (stateUpdate.readIds.length && stateUpdate.readAt) {
      emitMessageStatus(io, chatUserId, "message:read", {
        messageIds: stateUpdate.readIds,
        readAt: stateUpdate.readAt.toISOString(),
      });
    }

    return res.status(200).json(messages);
  } catch (error) {
    console.error("Fetch messages failed:", error);
    return res.status(500).json({ message: "Failed to fetch messages" });
  }
});

router.post("/messages/send/:id", protectRoute, async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const { messageType = "text", text, image, audio, audioDuration, location } = req.body;

    if (!isValidObjectId(receiverId)) {
      return res.status(400).json({ message: "Invalid receiver id" });
    }

    if (receiverId === req.userId) {
      return res.status(400).json({ message: "You cannot message yourself" });
    }

    /* ── Per-type validation ────────────────────────── */
    const messageData = {
      senderId: req.userId,
      receiverId,
      messageType,
      text: text ? text.trim() : "",
    };

    switch (messageType) {
      case "text":
        if (!text || !text.trim()) {
          return res.status(400).json({ message: "Message text is required" });
        }
        break;

      case "image":
        if (!image || typeof image !== "string") {
          return res.status(400).json({ message: "Image data is required" });
        }
        if (image.length > MAX_MEDIA_BASE64_LENGTH) {
          return res.status(400).json({ message: "Image is too large (max 2 MB)" });
        }
        messageData.image = image;
        break;

      case "audio":
        if (!audio || typeof audio !== "string") {
          return res.status(400).json({ message: "Audio data is required" });
        }
        if (audio.length > MAX_MEDIA_BASE64_LENGTH) {
          return res.status(400).json({ message: "Audio is too large" });
        }
        if (!audioDuration || typeof audioDuration !== "number" || audioDuration <= 0) {
          return res.status(400).json({ message: "Audio duration is required" });
        }
        messageData.audio = audio;
        messageData.audioDuration = audioDuration;
        break;

      case "location":
        if (
          !location ||
          typeof location.lat !== "number" ||
          typeof location.lng !== "number"
        ) {
          return res.status(400).json({ message: "Valid location coordinates are required" });
        }
        messageData.location = { lat: location.lat, lng: location.lng };
        break;

      default:
        return res.status(400).json({ message: "Invalid message type" });
    }

    const receiver = await User.findById(receiverId);

    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    const receiverSocketIds = getReceiverSocketIds(receiverId);
    const deliveredAt = receiverSocketIds.length ? new Date() : null;
    messageData.deliveredAt = deliveredAt;

    const newMessage = await Message.create(messageData);

    const io = getIO();

    if (io) {
      io.to(receiverId).emit("newMessage", newMessage);

      if (deliveredAt) {
        emitMessageStatus(io, req.userId, "message:delivered", {
          messageIds: [newMessage._id.toString()],
          deliveredAt: deliveredAt.toISOString(),
        });
      }
    }

    return res.status(201).json(newMessage);
  } catch (error) {
    console.error("Send message failed:", error);
    return res.status(500).json({ message: "Failed to send message" });
  }
});

router.post("/messages/read/:id", protectRoute, async (req, res) => {
  try {
    const { id: chatUserId } = req.params;

    if (!isValidObjectId(chatUserId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const chatUser = await User.findById(chatUserId);

    if (!chatUser) {
      return res.status(404).json({ message: "Chat user not found" });
    }

    const io = getIO();
    const stateUpdate = await markIncomingConversationState({
      senderId: chatUserId,
      receiverId: req.userId,
      markRead: true,
    });

    if (stateUpdate.deliveredIds.length && stateUpdate.deliveredAt) {
      emitMessageStatus(io, chatUserId, "message:delivered", {
        messageIds: stateUpdate.deliveredIds,
        deliveredAt: stateUpdate.deliveredAt.toISOString(),
      });
    }

    if (stateUpdate.readIds.length && stateUpdate.readAt) {
      emitMessageStatus(io, chatUserId, "message:read", {
        messageIds: stateUpdate.readIds,
        readAt: stateUpdate.readAt.toISOString(),
      });
    }

    return res.status(200).json({
      messageIds: stateUpdate.readIds,
      deliveredIds: stateUpdate.deliveredIds,
      deliveredAt: stateUpdate.deliveredAt ? stateUpdate.deliveredAt.toISOString() : null,
      readAt: stateUpdate.readAt ? stateUpdate.readAt.toISOString() : null,
    });
  } catch (error) {
    console.error("Mark messages as read failed:", error);
    return res.status(500).json({ message: "Failed to mark messages as read" });
  }
});

export default router;
