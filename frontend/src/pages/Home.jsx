import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChatPanel from "../components/ChatPanel";
import UserSidebar from "../components/UserSidebar";
import GroupModal from "../components/GroupModal";
import CommandPalette from "../components/CommandPalette";
import CallUI from "../components/CallUI";
import useAuthStore from "../store/authStore";
import useChatStore from "../store/chatStore";
import useGroupStore from "../store/groupStore";
import useCallStore from "../store/callStore";
import useUIStore from "../store/uiStore";

const Home = () => {
  const navigate = useNavigate();
  const showToast = useUIStore((state) => state.showToast);
  const { toggleTheme } = useUIStore();
  const { authUser, logout, isLoggingOut, socket, onlineUserIds } = useAuthStore();
  const {
    users,
    selectedUser,
    messages,
    replyMessage,
    setReplyMessage,
    clearReplyMessage,
    toggleReaction,
    isUsersLoading,
    isMessagesLoading,
    isSendingMessage,
    chatError,
    typingUsers,
    firstUnreadIndex,
    fetchUsers,
    fetchMessages,
    sendMessage,
    setSelectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    markAsRead,
    emitTypingStart,
    emitTypingStop,
    resetChat,
  } = useChatStore();

  const {
    groups,
    selectedGroup,
    groupMessages,
    replyMessage: groupReplyMessage,
    setGroupReplyMessage,
    clearGroupReplyMessage,
    toggleGroupReaction,
    isGroupMessagesLoading,
    isSendingGroupMessage,
    groupError,
    isCreatingGroup,
    fetchGroups,
    createGroup,
    fetchGroupMessages,
    sendGroupMessage,
    setSelectedGroup,
    subscribeToGroupMessages,
    unsubscribeFromGroupMessages,
    resetGroups,
  } = useGroupStore();

  const { initiateCall, subscribeToCallEvents, unsubscribeFromCallEvents } =
    useCallStore();

  const [showSidebar, setShowSidebar] = useState(true);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  /* ── Init ───────────────────────────────────────────────── */

  useEffect(() => {
    fetchUsers();
    fetchGroups();

    return () => {
      resetChat();
      resetGroups();
    };
  }, [fetchUsers, fetchGroups, resetChat, resetGroups]);

  /* Subscribe to group + call socket events */
  useEffect(() => {
    if (!socket) return;

    subscribeToGroupMessages();
    subscribeToCallEvents();

    return () => {
      unsubscribeFromGroupMessages();
      unsubscribeFromCallEvents();
    };
  }, [
    socket,
    subscribeToGroupMessages,
    unsubscribeFromGroupMessages,
    subscribeToCallEvents,
    unsubscribeFromCallEvents,
  ]);

  /* Global keyboard shortcut for Command Palette (Cmd+K / Ctrl+K) */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  /* ── DM effects ─────────────────────────────────────────── */

  useEffect(() => {
    if (!selectedUser?._id) {
      unsubscribeFromMessages();
      return;
    }

    fetchMessages(selectedUser._id);
    subscribeToMessages();
    markAsRead(selectedUser._id);

    return () => {
      unsubscribeFromMessages();
    };
  }, [
    selectedUser?._id,
    socket,
    fetchMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
    markAsRead,
  ]);

  /* ── Group effects ──────────────────────────────────────── */

  useEffect(() => {
    if (!selectedGroup?._id) return;
    fetchGroupMessages(selectedGroup._id);
  }, [selectedGroup?._id, fetchGroupMessages]);

  /* ── Handlers ───────────────────────────────────────────── */

  const handleSelectUser = useCallback(
    (user) => {
      setSelectedUser(user);
      setSelectedGroup(null);
      setShowSidebar(false);
    },
    [setSelectedUser, setSelectedGroup]
  );

  const handleSelectGroup = useCallback(
    (group) => {
      setSelectedGroup(group);
      setSelectedUser(null);
      setShowSidebar(false);
    },
    [setSelectedGroup, setSelectedUser]
  );

  const handleBack = useCallback(() => {
    setSelectedUser(null);
    setSelectedGroup(null);
    setShowSidebar(true);
  }, [setSelectedUser, setSelectedGroup]);

  const handleLogout = useCallback(async () => {
    await logout();
    resetChat();
    resetGroups();
  }, [logout, resetChat, resetGroups]);

  /* Typing */
  const handleTypingChange = useCallback(
    (isTyping) => {
      if (!selectedUser?._id) return;
      if (isTyping) {
        emitTypingStart(selectedUser._id);
      }
    },
    [selectedUser?._id, emitTypingStart]
  );

  /* Media send handlers (DM) */
  const handleSendAudio = useCallback(
    (data) => sendMessage({ messageType: "audio", ...data }),
    [sendMessage]
  );

  const handleSendImage = useCallback(
    (data) => sendMessage({ messageType: "image", ...data }),
    [sendMessage]
  );

  const handleSendLocation = useCallback(
    (data) => sendMessage({ messageType: "location", ...data }),
    [sendMessage]
  );

  /* Media send handlers (group) */
  const handleSendGroupAudio = useCallback(
    (data) => sendGroupMessage({ messageType: "audio", ...data }),
    [sendGroupMessage]
  );

  const handleSendGroupImage = useCallback(
    (data) => sendGroupMessage({ messageType: "image", ...data }),
    [sendGroupMessage]
  );

  const handleSendGroupLocation = useCallback(
    (data) => sendGroupMessage({ messageType: "location", ...data }),
    [sendGroupMessage]
  );

  /* Call handler */
  const handleCall = useCallback(
    (userId, callType) => {
      if (!onlineUserIds.includes(userId)) {
        showToast?.({ type: "error", message: "User is offline" });
        return;
      }
      initiateCall(userId, callType);
    },
    [onlineUserIds, initiateCall, showToast]
  );

  /* Create group */
  const handleCreateGroup = useCallback(
    async (name, memberIds) => {
      const result = await createGroup(name, memberIds);
      if (result.success) {
        setShowGroupModal(false);
        handleSelectGroup(result.group);
      }
    },
    [createGroup, handleSelectGroup]
  );

  /* ── Resolve which messages / handlers to pass to ChatPanel ── */
  const isGroupMode = !!selectedGroup;

  return (
    <main
      className="min-h-screen px-3 py-3 sm:px-4 sm:py-4"
      style={{ background: "var(--color-bg-page)" }}
    >
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-7xl gap-3 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* Sidebar */}
        <div className={`${!showSidebar && (selectedUser || selectedGroup) ? "hidden lg:block" : ""}`}>
          <UserSidebar
            authUser={authUser}
            users={users}
            onlineUserIds={onlineUserIds}
            selectedUser={selectedUser}
            isUsersLoading={isUsersLoading}
            isLoggingOut={isLoggingOut}
            onSelectUser={handleSelectUser}
            onLogout={handleLogout}
            onNavigateProfile={() => navigate("/profile")}
            onOpenCommandPalette={() => setShowCommandPalette(true)}
            typingUsers={typingUsers}
            groups={groups}
            selectedGroup={selectedGroup}
            onSelectGroup={handleSelectGroup}
            onNewGroup={() => setShowGroupModal(true)}
          />
        </div>

        {/* Chat panel */}
        <div className={`${showSidebar && !selectedUser && !selectedGroup ? "hidden lg:block" : ""} min-h-0`}>
          <ChatPanel
            authUser={authUser}
            selectedUser={isGroupMode ? null : selectedUser}
            selectedGroup={isGroupMode ? selectedGroup : null}
            messages={isGroupMode ? groupMessages : messages}
            replyMessage={isGroupMode ? groupReplyMessage : replyMessage}
            onSetReply={isGroupMode ? setGroupReplyMessage : setReplyMessage}
            onClearReply={isGroupMode ? clearGroupReplyMessage : clearReplyMessage}
            onToggleReaction={
              isGroupMode
                ? (msgId, emoji) =>
                    selectedGroup?._id &&
                    toggleGroupReaction(selectedGroup._id, msgId, emoji)
                : toggleReaction
            }
            isMessagesLoading={isGroupMode ? isGroupMessagesLoading : isMessagesLoading}
            isSendingMessage={isGroupMode ? isSendingGroupMessage : isSendingMessage}
            chatError={isGroupMode ? groupError : chatError}
            onSendMessage={isGroupMode ? sendGroupMessage : sendMessage}
            onSendAudio={isGroupMode ? handleSendGroupAudio : handleSendAudio}
            onSendImage={isGroupMode ? handleSendGroupImage : handleSendImage}
            onSendLocation={isGroupMode ? handleSendGroupLocation : handleSendLocation}
            onCall={isGroupMode ? undefined : handleCall}
            allUsers={users}
            typingUsers={typingUsers}
            firstUnreadIndex={isGroupMode ? -1 : firstUnreadIndex}
            onTypingChange={isGroupMode ? undefined : handleTypingChange}
            onBack={handleBack}
          />
        </div>
      </div>

      {/* Group modal */}
      {showGroupModal && (
        <GroupModal
          users={users}
          onlineUserIds={onlineUserIds}
          onClose={() => setShowGroupModal(false)}
          onCreate={handleCreateGroup}
          isCreating={isCreatingGroup}
        />
      )}

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        users={users}
        groups={groups}
        onSelectUser={handleSelectUser}
        onSelectGroup={handleSelectGroup}
        onNewGroup={() => setShowGroupModal(true)}
        onToggleTheme={toggleTheme}
        onNavigateProfile={() => navigate("/profile")}
        onLogout={handleLogout}
      />

      {/* Call UI overlay */}
      <CallUI />
    </main>
  );
};

export default Home;
