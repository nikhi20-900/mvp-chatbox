import { Server } from "socket.io";
import jwt from "jsonwebtoken";

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

  ioInstance.on("connection", (socket) => {
    const { userId } = socket.data;
    const existingSocketIds = userSocketMap.get(userId) ?? new Set();

    existingSocketIds.add(socket.id);
    userSocketMap.set(userId, existingSocketIds);
    socket.join(userId);

    emitOnlineUsers();

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
