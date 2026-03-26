import express from "express";
import mongoose from "mongoose";
import Group from "../models/Group.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import protectRoute from "../middleware/auth.js";
import { getIO, getReceiverSocketIds } from "../socket.js";
import { uploadImage, uploadAudio } from "../lib/cloudinary.js";

const router = express.Router();

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
const MAX_MEDIA_BASE64_LENGTH = 4 * 1024 * 1024;

/* ── Create group ──────────────────────────────────────────── */

router.post("/groups", protectRoute, async (req, res) => {
  try {
    const { name, members: memberIds } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Group name is required" });
    }

    if (!Array.isArray(memberIds) || memberIds.length < 1) {
      return res.status(400).json({ message: "At least one other member is required" });
    }

    if (memberIds.some((id) => !isValidObjectId(id))) {
      return res.status(400).json({ message: "Invalid member id" });
    }

    /* Ensure creator is always a member */
    const uniqueMembers = [...new Set([req.userId, ...memberIds])];

    /* Verify all members exist */
    const existingUsers = await User.find({ _id: { $in: uniqueMembers } }).select("_id");
    if (existingUsers.length !== uniqueMembers.length) {
      return res.status(400).json({ message: "One or more members not found" });
    }

    const group = await Group.create({
      name: name.trim(),
      members: uniqueMembers,
      admin: req.userId,
    });

    /* Notify members via socket */
    const io = getIO();
    if (io) {
      uniqueMembers.forEach((memberId) => {
        if (memberId !== req.userId) {
          io.to(memberId).emit("group:created", group);
        }
      });
    }

    return res.status(201).json(group);
  } catch (error) {
    console.error("Create group failed:", error);
    return res.status(500).json({ message: "Failed to create group" });
  }
});

/* ── List user's groups ────────────────────────────────────── */

router.get("/groups", protectRoute, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.userId })
      .sort({ updatedAt: -1 })
      .lean();

    /* Attach last message for each group */
    const groupsWithPreview = await Promise.all(
      groups.map(async (group) => {
        const lastMessage = await Message.findOne({ groupId: group._id })
          .sort({ createdAt: -1 })
          .lean();

        return {
          ...group,
          _id: group._id.toString(),
          admin: group.admin.toString(),
          members: group.members.map((m) => m.toString()),
          lastMessage: lastMessage
            ? {
                _id: lastMessage._id.toString(),
                senderId: lastMessage.senderId.toString(),
                messageType: lastMessage.messageType || "text",
                text: lastMessage.text,
                createdAt: lastMessage.createdAt,
              }
            : null,
        };
      })
    );

    return res.status(200).json(groupsWithPreview);
  } catch (error) {
    console.error("Fetch groups failed:", error);
    return res.status(500).json({ message: "Failed to fetch groups" });
  }
});

/* ── Fetch group messages ──────────────────────────────────── */

router.get("/groups/:id/messages", protectRoute, async (req, res) => {
  try {
    const { id: groupId } = req.params;

    if (!isValidObjectId(groupId)) {
      return res.status(400).json({ message: "Invalid group id" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.members.map((m) => m.toString()).includes(req.userId)) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    const messages = await Message.find({ groupId })
      .sort({ createdAt: 1 })
      .lean();

    const formatted = messages.map((msg) => ({
      ...msg,
      _id: msg._id.toString(),
      senderId: msg.senderId.toString(),
      groupId: msg.groupId.toString(),
      receiverId: null,
    }));

    return res.status(200).json(formatted);
  } catch (error) {
    console.error("Fetch group messages failed:", error);
    return res.status(500).json({ message: "Failed to fetch group messages" });
  }
});

/* ── Send message to group ─────────────────────────────────── */

router.post("/groups/:id/send", protectRoute, async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { messageType = "text", text, image, audio, audioDuration, location } = req.body;

    if (!isValidObjectId(groupId)) {
      return res.status(400).json({ message: "Invalid group id" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.members.map((m) => m.toString()).includes(req.userId)) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    const messageData = {
      senderId: req.userId,
      groupId,
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
        try {
          const imgResult = await uploadImage(image);
          messageData.image = imgResult.url;
        } catch (uploadErr) {
          console.error("Image upload failed:", uploadErr.message);
          return res.status(500).json({ message: "Image upload failed" });
        }
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
        try {
          const audioResult = await uploadAudio(audio);
          messageData.audio = audioResult.url;
        } catch (uploadErr) {
          console.error("Audio upload failed:", uploadErr.message);
          return res.status(500).json({ message: "Audio upload failed" });
        }
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

    const newMessage = await Message.create(messageData);

    /* Broadcast to all group members via socket room */
    const io = getIO();
    if (io) {
      io.to(`group:${groupId}`).emit("group:newMessage", {
        ...newMessage.toJSON(),
        groupId,
      });
    }

    return res.status(201).json(newMessage);
  } catch (error) {
    console.error("Send group message failed:", error);
    return res.status(500).json({ message: "Failed to send message" });
  }
});

/* ── Update group (admin only) ─────────────────────────────── */

router.patch("/groups/:id", protectRoute, async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { name, avatar } = req.body;

    if (!isValidObjectId(groupId)) {
      return res.status(400).json({ message: "Invalid group id" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.admin.toString() !== req.userId) {
      return res.status(403).json({ message: "Only the admin can update the group" });
    }

    if (name) group.name = name.trim();
    if (avatar !== undefined) group.avatar = avatar;

    await group.save();

    const io = getIO();
    if (io) {
      io.to(`group:${groupId}`).emit("group:updated", group);
    }

    return res.status(200).json(group);
  } catch (error) {
    console.error("Update group failed:", error);
    return res.status(500).json({ message: "Failed to update group" });
  }
});

/* ── Add members (admin only) ──────────────────────────────── */

router.post("/groups/:id/members", protectRoute, async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { memberIds } = req.body;

    if (!isValidObjectId(groupId)) {
      return res.status(400).json({ message: "Invalid group id" });
    }

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ message: "Member IDs are required" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.admin.toString() !== req.userId) {
      return res.status(403).json({ message: "Only the admin can add members" });
    }

    const currentMembers = new Set(group.members.map((m) => m.toString()));
    const newMembers = memberIds.filter((id) => !currentMembers.has(id));

    if (newMembers.length === 0) {
      return res.status(400).json({ message: "All users are already members" });
    }

    group.members.push(...newMembers);
    await group.save();

    const io = getIO();
    if (io) {
      io.to(`group:${groupId}`).emit("group:updated", group);
      /* Notify new members so they can join the socket room */
      newMembers.forEach((memberId) => {
        io.to(memberId).emit("group:created", group);
      });
    }

    return res.status(200).json(group);
  } catch (error) {
    console.error("Add members failed:", error);
    return res.status(500).json({ message: "Failed to add members" });
  }
});

/* ── Remove member (admin only) ────────────────────────────── */

router.delete("/groups/:id/members/:userId", protectRoute, async (req, res) => {
  try {
    const { id: groupId, userId: targetId } = req.params;

    if (!isValidObjectId(groupId) || !isValidObjectId(targetId)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.admin.toString() !== req.userId) {
      return res.status(403).json({ message: "Only the admin can remove members" });
    }

    if (targetId === req.userId) {
      return res.status(400).json({ message: "Admin cannot remove themselves" });
    }

    group.members = group.members.filter((m) => m.toString() !== targetId);
    await group.save();

    const io = getIO();
    if (io) {
      io.to(`group:${groupId}`).emit("group:updated", group);
      io.to(targetId).emit("group:removed", { groupId });
    }

    return res.status(200).json(group);
  } catch (error) {
    console.error("Remove member failed:", error);
    return res.status(500).json({ message: "Failed to remove member" });
  }
});

/* ── Leave group ───────────────────────────────────────────── */

router.post("/groups/:id/leave", protectRoute, async (req, res) => {
  try {
    const { id: groupId } = req.params;

    if (!isValidObjectId(groupId)) {
      return res.status(400).json({ message: "Invalid group id" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const memberStrings = group.members.map((m) => m.toString());
    if (!memberStrings.includes(req.userId)) {
      return res.status(400).json({ message: "You are not a member of this group" });
    }

    group.members = group.members.filter((m) => m.toString() !== req.userId);

    /* If admin leaves, transfer to first remaining member */
    if (group.admin.toString() === req.userId && group.members.length > 0) {
      group.admin = group.members[0];
    }

    /* Delete group if no members left */
    if (group.members.length === 0) {
      await Group.findByIdAndDelete(groupId);
    } else {
      await group.save();
    }

    const io = getIO();
    if (io) {
      io.to(`group:${groupId}`).emit("group:updated", group);
    }

    return res.status(200).json({ message: "Left group successfully" });
  } catch (error) {
    console.error("Leave group failed:", error);
    return res.status(500).json({ message: "Failed to leave group" });
  }
});

export default router;
