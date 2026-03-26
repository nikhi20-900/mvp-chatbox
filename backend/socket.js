import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Group from "./models/Group.js";

const userSocketMap = new Map();
let ioInstance = null;

const parseCookieHeader = (cookieHeader = "") =>
  cookieHeader.split(";").reduce((cookies, chunk) => {
    const [rawKey, ...rawValue] = chunk.trim().split("=");

    if (!rawKey) {
      return cookies;
    }

    cookies[rawKey] = decodeURIComponent(rawValue.join("="));
    return cookies;
  }, {});

const resolveUserIdFromSocket = (socket) => {
  const bearerToken = socket.handshake.auth?.token;
  const headerToken = socket.handshake.headers?.authorization?.startsWith("Bearer ")
    ? socket.handshake.headers.authorization.split(" ")[1]
    : null;
  const cookieToken = parseCookieHeader(socket.handshake.headers?.cookie).jwt;
  const token = bearerToken || headerToken || cookieToken;

  if (token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId?.toString();
  }

  return socket.handshake.query.userId?.toString() || null;
};

const getOnlineUserIds = () => Array.from(userSocketMap.keys());

const emitOnlineUsers = () => {
  if (ioInstance) {
    ioInstance.emit("onlineUsers", getOnlineUserIds());
  }
};

const initSocket = (server, isAllowedOrigin = () => true) => {
  ioInstance = new Server(server, {
    cors: {
      origin(origin, callback) {
        const allowed = isAllowedOrigin(origin);

        console.log("Socket CORS check", {
          origin: origin || "no-origin",
          allowed,
        });

        if (allowed) {
          return callback(null, true);
        }

        return callback(new Error("CORS origin not allowed"));
      },
      credentials: true,
    },
  });

  ioInstance.use((socket, next) => {
    try {
      const userId = resolveUserIdFromSocket(socket);

      if (!userId) {
        return next(new Error("Unauthorized"));
      }

      socket.data.userId = userId;
      return next();
    } catch (error) {
      return next(new Error("Unauthorized"));
    }
  });

  ioInstance.on("connection", async (socket) => {
    const { userId } = socket.data;
    const existingSocketIds = userSocketMap.get(userId) ?? new Set();

    existingSocketIds.add(socket.id);
    userSocketMap.set(userId, existingSocketIds);
    socket.join(userId);

    /* ── Join all group rooms this user is a member of ──── */
    try {
      const groups = await Group.find({ members: userId }).select("_id").lean();
      groups.forEach((g) => socket.join(`group:${g._id.toString()}`));
    } catch (err) {
      console.error("Failed to join group rooms:", err.message);
    }

    emitOnlineUsers();

    /* ── Typing indicators (DM) ──────────────────────── */
    socket.on("typing:start", ({ toUserId }) => {
      if (!toUserId) {
        return;
      }

      socket.to(toUserId.toString()).emit("typing:start", {
        fromUserId: userId,
      });
    });

    socket.on("typing:stop", ({ toUserId }) => {
      if (!toUserId) {
        return;
      }

      socket.to(toUserId.toString()).emit("typing:stop", {
        fromUserId: userId,
      });
    });

    /* ── Group room management ───────────────────────── */
    socket.on("group:join", ({ groupId }) => {
      if (groupId) {
        socket.join(`group:${groupId}`);
      }
    });

    socket.on("group:leave", ({ groupId }) => {
      if (groupId) {
        socket.leave(`group:${groupId}`);
      }
    });

    /* ── Calling signaling ───────────────────────────── */
    socket.on("call:initiate", (data) => {
      /* data: { toUserId, callType, callerName, callerAvatar } */
      const targetSockets = getReceiverSocketIds(data.toUserId);
      if (targetSockets.length === 0) {
        socket.emit("call:unavailable", { toUserId: data.toUserId });
        return;
      }
      socket.to(data.toUserId).emit("call:incoming", {
        fromUserId: userId,
        callType: data.callType,
        callerName: data.callerName,
        callerAvatar: data.callerAvatar,
      });
    });

    socket.on("call:accept", ({ toUserId }) => {
      socket.to(toUserId).emit("call:accepted", { fromUserId: userId });
    });

    socket.on("call:reject", ({ toUserId }) => {
      socket.to(toUserId).emit("call:rejected", { fromUserId: userId });
    });

    socket.on("call:offer", ({ toUserId, offer }) => {
      socket.to(toUserId).emit("call:offer", { fromUserId: userId, offer });
    });

    socket.on("call:answer", ({ toUserId, answer }) => {
      socket.to(toUserId).emit("call:answer", { fromUserId: userId, answer });
    });

    socket.on("call:ice-candidate", ({ toUserId, candidate }) => {
      socket.to(toUserId).emit("call:ice-candidate", { fromUserId: userId, candidate });
    });

    socket.on("call:end", ({ toUserId }) => {
      socket.to(toUserId).emit("call:ended", { fromUserId: userId });
    });

    /* ── Disconnect ──────────────────────────────────── */
    socket.on("disconnect", () => {
      const activeSocketIds = userSocketMap.get(userId);

      if (activeSocketIds) {
        activeSocketIds.delete(socket.id);

        if (activeSocketIds.size === 0) {
          userSocketMap.delete(userId);
        }
      }

      emitOnlineUsers();
    });
  });

  return ioInstance;
};

const getReceiverSocketIds = (userId) => Array.from(userSocketMap.get(userId?.toString()) ?? []);
const getReceiverSocketId = (userId) => getReceiverSocketIds(userId)[0];
const getIO = () => ioInstance;

export { initSocket, getReceiverSocketId, getReceiverSocketIds, getIO, getOnlineUserIds };
