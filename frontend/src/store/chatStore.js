import { create } from "zustand";
import api, { getErrorMessage } from "../lib/api";
import useAuthStore from "./authStore";

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

  clearChatError: () => set({ chatError: "" }),

  setSelectedUser: (user) =>
    set({
      selectedUser: user,
      messages: [],
      chatError: "",
    }),

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

  fetchMessages: async (userId) => {
    if (!userId) {
      return;
    }

    set({ isMessagesLoading: true });

    try {
      const { data } = await api.get(`/messages/${userId}`);
      set({ messages: data, chatError: "" });
    } catch (error) {
      set({ chatError: getErrorMessage(error, "Failed to fetch messages") });
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (text) => {
    const selectedUserId = get().selectedUser?._id;

    if (!selectedUserId) {
      return { success: false, message: "Choose a conversation first" };
    }

    set({ isSendingMessage: true });

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

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    const authUserId = useAuthStore.getState().authUser?._id;
    const selectedUserId = get().selectedUser?._id;
    const currentListener = get().messageListener;

    if (socket && currentListener) {
      socket.off("newMessage", currentListener);
    }

    if (!socket || !authUserId || !selectedUserId) {
      set({ messageListener: null });
      return;
    }

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
          return {
            users: nextUsers,
          };
        }

        const alreadyExists = state.messages.some((message) => message._id === newMessage._id);

        if (alreadyExists) {
          return {
            users: nextUsers,
          };
        }

        return {
          users: nextUsers,
          messages: [...state.messages, newMessage],
        };
      });
    };

    socket.on("newMessage", nextListener);
    set({ messageListener: nextListener });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    const listener = get().messageListener;

    if (socket && listener) {
      socket.off("newMessage", listener);
    }

    set({ messageListener: null });
  },

  resetChat: () => {
    get().unsubscribeFromMessages();
    set({
      users: [],
      selectedUser: null,
      messages: [],
      chatError: "",
    });
  },
}));

export default useChatStore;
