import { create } from "zustand";
import { io } from "socket.io-client";
import {
  clearStoredToken,
  DEPLOY_CONFIG_ERROR,
  getErrorMessage,
  getStoredToken,
  setStoredToken,
  SOCKET_URL,
} from "../lib/api";
import api from "../lib/api";

const useAuthStore = create((set, get) => ({
  authUser: null,
  socket: null,
  onlineUserIds: [],
  isCheckingAuth: true,
  isLoggingIn: false,
  isSigningUp: false,
  isLoggingOut: false,
  authError: "",

  clearAuthError: () => set({ authError: "" }),

  checkAuth: async () => {
    set({ isCheckingAuth: true });

    if (!getStoredToken()) {
      get().disconnectSocket();
      set({ authUser: null, onlineUserIds: [], isCheckingAuth: false });
      return;
    }

    try {
      const { data } = await api.get("/auth/me");
      set({ authUser: data, authError: "" });
    } catch (_error) {
      get().disconnectSocket();
      clearStoredToken();
      set({ authUser: null, onlineUserIds: [] });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (payload) => {
    set({ isSigningUp: true, authError: "" });

    try {
      const { data } = await api.post("/auth/signup", payload);
      setStoredToken(data.token);
      set({ authUser: data });
      return { success: true };
    } catch (error) {
      const message = getErrorMessage(error, "Failed to create your account");
      set({ authError: message });
      return { success: false, message };
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (payload) => {
    set({ isLoggingIn: true, authError: "" });

    try {
      const { data } = await api.post("/auth/login", payload);
      setStoredToken(data.token);
      set({ authUser: data });
      return { success: true };
    } catch (error) {
      const message = getErrorMessage(error, "Failed to log in");
      set({ authError: message });
      return { success: false, message };
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    set({ isLoggingOut: true });

    try {
      await api.post("/auth/logout");
    } finally {
      clearStoredToken();
      get().disconnectSocket();
      set({
        authUser: null,
        authError: "",
        isLoggingOut: false,
      });
    }
  },

  connectSocket: () => {
    const { authUser, socket } = get();

    if (!authUser?._id) {
      return;
    }

    if (!SOCKET_URL) {
      set({ authError: DEPLOY_CONFIG_ERROR, onlineUserIds: [] });
      return;
    }

    if (socket) {
      const sameUser = socket.io.opts.query?.userId === authUser._id;

      if (sameUser && socket.connected) {
        return;
      }

      socket.disconnect();
    }

    const nextSocket = io(SOCKET_URL, {
      withCredentials: true,
      auth: {
        token: getStoredToken(),
      },
      query: {
        userId: authUser._id,
      },
    });

    nextSocket.on("onlineUsers", (onlineUserIds = []) => {
      set({ onlineUserIds });
    });

    nextSocket.on("disconnect", () => {
      set({ onlineUserIds: [] });
    });

    set({ socket: nextSocket });
  },

  disconnectSocket: () => {
    const { socket } = get();

    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
    }

    set({ socket: null, onlineUserIds: [] });
  },
}));

export default useAuthStore;
