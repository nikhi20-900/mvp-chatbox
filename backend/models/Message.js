import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "audio", "location"],
      default: "text",
    },
    text: {
      type: String,
      default: "",
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
    audio: {
      type: String,
      default: "",
    },
    audioDuration: {
      type: Number,
      default: 0,
    },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    bufferCommands: false,
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform: (_doc, ret) => {
        ret._id = ret._id.toString();
        ret.senderId = ret.senderId.toString();
        ret.receiverId = ret.receiverId ? ret.receiverId.toString() : null;
        ret.groupId = ret.groupId ? ret.groupId.toString() : null;
        ret.deliveredAt = ret.deliveredAt || null;
        ret.readAt = ret.readAt || null;
        delete ret.__v;
        return ret;
      },
    },
  }
);

messageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });
messageSchema.index({ groupId: 1, createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
