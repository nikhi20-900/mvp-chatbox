import { create } from "zustand";
import api, { getErrorMessage } from "../lib/api";
import useAuthStore from "./authStore";

const TYPING_DEBOUNCE_MS = 1500;

const isMessageForSelectedChat = (message, selectedUserId, authUserId) =>
  (message.senderId === selectedUserId && message.receiverId === authUserId) ||
  (message.senderId === authUserId && message.receiverId === selectedUserId);

const getMessageTimestamp = (message) =>
  message?.createdAt ? new Date(message.createdAt).getTime() : 0;

const sortUsersByRecentActivity = (users) =>
  [...users].sort((left, right) => {
    const leftTime = getMessageTimestamp(left.lastMessage);
    const rightTime = getMessageTimestamp(right.lastMessage);

    if (leftTime !== rightTime) {
      return rightTime - leftTime;
    }

    return left.fullName.localeCompare(right.fullName);
  });

const updateUserPreview = (users, message, authUserId) =>
  sortUsersByRecentActivity(
    users.map((user) => {
      const isConversationUser =
        user._id === message.senderId || user._id === message.receiverId;

      if (!isConversationUser || user._id === authUserId) {
        return user;
      }

      return {
        ...user,
        lastMessage: {
          _id: message._id,
          senderId: message.senderId,
          receiverId: message.receiverId,
          text: message.text,
          createdAt: message.createdAt,
        },
      };
    })
  );

const useChatStore = create((set, get) => ({
  users: [],
  selectedUser: null,
  messages: [],
  isUsersLoading: false,
  isMessagesLoading: false,
  isSendingMessage: false,
  chatError: "",
  messageListener: null,

  /* ── Typing state ──────────────────────────────────────── */
  typingUsers: {},
  _typingTimer: null,
  _isTypingEmitted: false,

  /* ── Unread tracking ───────────────────────────────────── */
  firstUnreadIndex: -1,

  clearChatError: () => set({ chatError: "" }),

  setSelectedUser: (user) =>
    set({
      selectedUser: user,
      messages: [],
      chatError: "",
      firstUnreadIndex: -1,
    }),

  /* ── Users ─────────────────────────────────────────────── */
  fetchUsers: async () => {
    set({ isUsersLoading: true });

    try {
      const { data } = await api.get("/users");
      set({ users: sortUsersByRecentActivity(data), chatError: "" });
    } catch (error) {
      set({ chatError: getErrorMessage(error, "Failed to fetch users") });
    } finally {
      set({ isUsersLoading: false });
    }
  },

  /* ── Messages ──────────────────────────────────────────── */
  fetchMessages: async (userId) => {
    if (!userId) {
      return;
    }

    set({ isMessagesLoading: true });

    try {
      const { data } = await api.get(`/messages/${userId}`);

      /* Find where unread messages start */
      const authUserId = useAuthStore.getState().authUser?._id;
      let firstUnread = -1;

      for (let i = 0; i < data.length; i++) {
        if (data[i].senderId !== authUserId && !data[i].readAt) {
          firstUnread = i;
          break;
        }
      }

      set({ messages: data, chatError: "", firstUnreadIndex: firstUnread });
    } catch (error) {
      set({ chatError: getErrorMessage(error, "Failed to fetch messages") });
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  /* ── Send ───────────────────────────────────────────────── */
  sendMessage: async (text) => {
    const selectedUserId = get().selectedUser?._id;

    if (!selectedUserId) {
      return { success: false, message: "Choose a conversation first" };
    }

    set({ isSendingMessage: true });

    /* Stop typing indicator on send */
    get().emitTypingStop(selectedUserId);

    try {
      const { data } = await api.post(`/messages/send/${selectedUserId}`, { text });
      const authUserId = useAuthStore.getState().authUser?._id;

      set((state) => ({
        messages: [...state.messages, data],
        users: authUserId ? updateUserPreview(state.users, data, authUserId) : state.users,
        chatError: "",
      }));

      return { success: true };
    } catch (error) {
      const message = getErrorMessage(error, "Failed to send the message");
      set({ chatError: message });
      return { success: false, message };
    } finally {
      set({ isSendingMessage: false });
    }
  },

  /* ── Read receipts ─────────────────────────────────────── */
  markAsRead: async (userId) => {
    if (!userId) {
      return;
    }

    try {
      await api.post(`/messages/read/${userId}`);

      /* Clear unread count for this user in the sidebar */
      set((state) => ({
        users: state.users.map((user) =>
          user._id === userId ? { ...user, unreadCount: 0 } : user
        ),
        firstUnreadIndex: -1,
      }));
    } catch {
      /* silently fail – non-critical */
    }
  },

  /* ── Typing emission ───────────────────────────────────── */
  emitTypingStart: (toUserId) => {
    const socket = useAuthStore.getState().socket;

    if (!socket || !toUserId) {
      return;
    }

    const { _isTypingEmitted, _typingTimer } = get();

    if (_typingTimer) {
      clearTimeout(_typingTimer);
    }

    if (!_isTypingEmitted) {
      socket.emit("typing:start", { toUserId });
      set({ _isTypingEmitted: true });
    }

    const timer = setTimeout(() => {
      get().emitTypingStop(toUserId);
    }, TYPING_DEBOUNCE_MS);

    set({ _typingTimer: timer });
  },

  emitTypingStop: (toUserId) => {
    const socket = useAuthStore.getState().socket;
    const { _typingTimer, _isTypingEmitted } = get();

    if (_typingTimer) {
      clearTimeout(_typingTimer);
    }

    if (socket && toUserId && _isTypingEmitted) {
      socket.emit("typing:stop", { toUserId });
    }

    set({ _typingTimer: null, _isTypingEmitted: false });
  },

  /* ── Socket subscriptions ──────────────────────────────── */
  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    const authUserId = useAuthStore.getState().authUser?._id;
    const selectedUserId = get().selectedUser?._id;
    const currentListener = get().messageListener;

    if (socket && currentListener) {
      socket.off("newMessage", currentListener);
      socket.off("typing:start");
      socket.off("typing:stop");
      socket.off("message:delivered");
      socket.off("message:read");
      socket.off("user:updated");
    }

    if (!socket || !authUserId || !selectedUserId) {
      set({ messageListener: null });
      return;
    }

    /* New message handler */
    const nextListener = (newMessage) => {
      const activeSelectedUserId = get().selectedUser?._id;
      const currentAuthUserId = useAuthStore.getState().authUser?._id;

      if (!activeSelectedUserId || !currentAuthUserId) {
        return;
      }

      set((state) => {
        const nextUsers = updateUserPreview(state.users, newMessage, currentAuthUserId);
        const shouldAppend = isMessageForSelectedChat(
          newMessage,
          activeSelectedUserId,
          currentAuthUserId
        );

        if (!shouldAppend) {
          /* Update unread count for the sender */
          const updatedUsers = nextUsers.map((user) =>
            user._id === newMessage.senderId
              ? { ...user, unreadCount: (user.unreadCount || 0) + 1 }
              : user
          );

          return { users: updatedUsers };
        }

        const alreadyExists = state.messages.some((message) => message._id === newMessage._id);

        if (alreadyExists) {
          return { users: nextUsers };
        }

        return {
          users: nextUsers,
          messages: [...state.messages, newMessage],
        };
      });
    };

    /* Typing indicators */
    socket.on("typing:start", ({ fromUserId }) => {
      set((state) => ({
        typingUsers: { ...state.typingUsers, [fromUserId]: true },
      }));
    });

    socket.on("typing:stop", ({ fromUserId }) => {
      set((state) => {
        const next = { ...state.typingUsers };
        delete next[fromUserId];
        return { typingUsers: next };
      });
    });

    /* Delivery & read status updates */
    socket.on("message:delivered", ({ messageIds, deliveredAt }) => {
      if (!messageIds?.length) {
        return;
      }

      const idSet = new Set(messageIds);

      set((state) => ({
        messages: state.messages.map((msg) =>
          idSet.has(msg._id) ? { ...msg, deliveredAt: msg.deliveredAt || deliveredAt } : msg
        ),
      }));
    });

    socket.on("message:read", ({ messageIds, readAt }) => {
      if (!messageIds?.length) {
        return;
      }

      const idSet = new Set(messageIds);

      set((state) => ({
        messages: state.messages.map((msg) =>
          idSet.has(msg._id)
            ? { ...msg, deliveredAt: msg.deliveredAt || readAt, readAt: msg.readAt || readAt }
            : msg
        ),
      }));
    });

    /* User profile updates */
    socket.on("user:updated", (updatedUser) => {
      set((state) => ({
        users: state.users.map((user) =>
          user._id === updatedUser._id ? { ...user, ...updatedUser } : user
        ),
        selectedUser:
          state.selectedUser?._id === updatedUser._id
            ? { ...state.selectedUser, ...updatedUser }
            : state.selectedUser,
      }));
    });

    socket.on("newMessage", nextListener);
    set({ messageListener: nextListener });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    const listener = get().messageListener;

    if (socket) {
      if (listener) {
        socket.off("newMessage", listener);
      }

      socket.off("typing:start");
      socket.off("typing:stop");
      socket.off("message:delivered");
      socket.off("message:read");
      socket.off("user:updated");
    }

    set({ messageListener: null, typingUsers: {} });
  },

  resetChat: () => {
    const { _typingTimer } = get();

    if (_typingTimer) {
      clearTimeout(_typingTimer);
    }

    get().unsubscribeFromMessages();
    set({
      users: [],
      selectedUser: null,
      messages: [],
      chatError: "",
      typingUsers: {},
      _typingTimer: null,
      _isTypingEmitted: false,
      firstUnreadIndex: -1,
    });
  },
}));

export default useChatStore;
