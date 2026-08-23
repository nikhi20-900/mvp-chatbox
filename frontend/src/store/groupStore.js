import { create } from "zustand";
import api, { getErrorMessage } from "../lib/api";
import useAuthStore from "./authStore";

const useGroupStore = create((set, get) => ({
  groups: [],
  selectedGroup: null,
  groupMessages: [],
  replyMessage: null,
  isGroupsLoading: false,
  isGroupMessagesLoading: false,
  isSendingGroupMessage: false,
  isCreatingGroup: false,
  groupError: "",

  /* ── Reply state ────────────────────────────────────────── */

  setGroupReplyMessage: (message) => set({ replyMessage: message }),
  clearGroupReplyMessage: () => set({ replyMessage: null }),

  /* ── Fetch groups ───────────────────────────────────────── */

  fetchGroups: async () => {
    set({ isGroupsLoading: true });

    try {
      const { data } = await api.get("/groups");
      set({ groups: data, isGroupsLoading: false });
    } catch (error) {
      const message = getErrorMessage(error, "Failed to fetch groups");
      set({ groupError: message, isGroupsLoading: false });
    }
  },

  /* ── Create group ───────────────────────────────────────── */

  createGroup: async (name, memberIds) => {
    set({ isCreatingGroup: true });

    try {
      const { data } = await api.post("/groups", { name, members: memberIds });
      set((state) => ({
        groups: [data, ...state.groups],
        isCreatingGroup: false,
        groupError: "",
      }));
      return { success: true, group: data };
    } catch (error) {
      const message = getErrorMessage(error, "Failed to create group");
      set({ groupError: message, isCreatingGroup: false });
      return { success: false, message };
    }
  },

  /* ── Select group ───────────────────────────────────────── */

  setSelectedGroup: (group) => {
    set({
      selectedGroup: group,
      groupMessages: [],
      replyMessage: null,
      groupError: "",
    });
  },

  /* ── Fetch group messages ───────────────────────────────── */

  fetchGroupMessages: async (groupId) => {
    set({ isGroupMessagesLoading: true });

    try {
      const { data } = await api.get(`/groups/${groupId}/messages`);
      set({ groupMessages: data, isGroupMessagesLoading: false });
    } catch (error) {
      const message = getErrorMessage(error, "Failed to fetch messages");
      set({ groupError: message, isGroupMessagesLoading: false });
    }
  },

  /* ── Send group message ─────────────────────────────────── */

  sendGroupMessage: async (payload) => {
    const groupId = get().selectedGroup?._id;
    if (!groupId) return { success: false, message: "No group selected" };

    set({ isSendingGroupMessage: true });

    const baseBody =
      typeof payload === "string"
        ? { messageType: "text", text: payload }
        : { messageType: "text", ...payload };

    const replyToId = get().replyMessage?._id || baseBody.replyTo;
    const body = replyToId ? { ...baseBody, replyTo: replyToId } : baseBody;

    try {
      const { data } = await api.post(`/groups/${groupId}/send`, body);

      set((state) => ({
        groupMessages: [...state.groupMessages, data],
        replyMessage: null,
        groups: state.groups.map((g) =>
          g._id === groupId
            ? {
                ...g,
                lastMessage: {
                  _id: data._id,
                  senderId: data.senderId,
                  messageType: data.messageType || "text",
                  text: data.text,
                  createdAt: data.createdAt,
                },
              }
            : g
        ),
        groupError: "",
      }));

      return { success: true };
    } catch (error) {
      const message = getErrorMessage(error, "Failed to send message");
      set({ groupError: message });
      return { success: false, message };
    } finally {
      set({ isSendingGroupMessage: false });
    }
  },

  /* ── React to group message ─────────────────────────────── */

  toggleGroupReaction: async (groupId, messageId, emoji) => {
    const authUserId = useAuthStore.getState().authUser?._id;
    if (!authUserId || !groupId || !messageId || !emoji) return;

    /* Optimistic UI update */
    set((state) => ({
      groupMessages: state.groupMessages.map((msg) => {
        if (msg._id !== messageId) return msg;
        const currentReactions = Array.isArray(msg.reactions) ? [...msg.reactions] : [];
        const idx = currentReactions.findIndex(
          (r) => r.userId === authUserId && r.emoji === emoji
        );
        if (idx > -1) {
          currentReactions.splice(idx, 1);
        } else {
          currentReactions.push({ userId: authUserId, emoji });
        }
        return { ...msg, reactions: currentReactions };
      }),
    }));

    try {
      const { data } = await api.post(
        `/groups/${groupId}/messages/${messageId}/react`,
        { emoji }
      );
      set((state) => ({
        groupMessages: state.groupMessages.map((msg) =>
          msg._id === messageId ? { ...msg, reactions: data.reactions } : msg
        ),
      }));
    } catch (error) {
      console.error("Failed to toggle group reaction:", error);
    }
  },

  /* ── Leave group ────────────────────────────────────────── */

  leaveGroup: async (groupId) => {
    try {
      await api.post(`/groups/${groupId}/leave`);
      set((state) => ({
        groups: state.groups.filter((g) => g._id !== groupId),
        selectedGroup:
          state.selectedGroup?._id === groupId ? null : state.selectedGroup,
      }));
      return { success: true };
    } catch (error) {
      return { success: false, message: getErrorMessage(error, "Failed to leave group") };
    }
  },

  /* ── Socket subscriptions ───────────────────────────────── */

  subscribeToGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("group:newMessage", (message) => {
      const state = get();
      const authUserId = useAuthStore.getState().authUser?._id;

      /* Skip own echoed messages (we already added them optimistically) */
      if (message.senderId === authUserId) return;

      /* If this group is currently selected, add to messages */
      if (state.selectedGroup?._id === message.groupId) {
        set((s) => ({ groupMessages: [...s.groupMessages, message] }));
      }

      /* Update group preview */
      set((s) => ({
        groups: s.groups.map((g) =>
          g._id === message.groupId
            ? {
                ...g,
                lastMessage: {
                  _id: message._id,
                  senderId: message.senderId,
                  messageType: message.messageType || "text",
                  text: message.text,
                  createdAt: message.createdAt,
                },
              }
            : g
        ),
      }));
    });

    socket.on("group:message:reaction", ({ groupId, messageId, reactions }) => {
      if (get().selectedGroup?._id === groupId) {
        set((s) => ({
          groupMessages: s.groupMessages.map((msg) =>
            msg._id === messageId ? { ...msg, reactions } : msg
          ),
        }));
      }
    });

    socket.on("group:created", (group) => {
      set((s) => ({
        groups: [group, ...s.groups.filter((g) => g._id !== group._id)],
      }));
      /* Join the socket room */
      socket.emit("group:join", { groupId: group._id });
    });

    socket.on("group:updated", (group) => {
      set((s) => ({
        groups: s.groups.map((g) => (g._id === group._id ? { ...g, ...group } : g)),
        selectedGroup:
          s.selectedGroup?._id === group._id
            ? { ...s.selectedGroup, ...group }
            : s.selectedGroup,
      }));
    });

    socket.on("group:removed", ({ groupId }) => {
      set((s) => ({
        groups: s.groups.filter((g) => g._id !== groupId),
        selectedGroup:
          s.selectedGroup?._id === groupId ? null : s.selectedGroup,
      }));
      socket.emit("group:leave", { groupId });
    });
  },

  unsubscribeFromGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("group:newMessage");
    socket.off("group:message:reaction");
    socket.off("group:created");
    socket.off("group:updated");
    socket.off("group:removed");
  },

  /* ── Reset ──────────────────────────────────────────────── */

  resetGroups: () => {
    set({
      groups: [],
      selectedGroup: null,
      groupMessages: [],
      replyMessage: null,
      groupError: "",
    });
  },
}));

export default useGroupStore;
