import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    avatar: {
      type: String,
      default: "",
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    bufferCommands: false,
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret._id = ret._id.toString();
        ret.admin = ret.admin.toString();
        ret.members = ret.members.map((m) =>
          typeof m === "object" && m._id ? m._id.toString() : m.toString()
        );
        delete ret.__v;
        return ret;
      },
    },
  }
);

const Group = mongoose.model("Group", groupSchema);

export default Group;
