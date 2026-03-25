import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChatPanel from "../components/ChatPanel";
import UserSidebar from "../components/UserSidebar";
import useAuthStore from "../store/authStore";
import useChatStore from "../store/chatStore";

const Home = () => {
  const navigate = useNavigate();
  const { authUser, logout, isLoggingOut, socket, onlineUserIds } = useAuthStore();
  const {
    users,
    selectedUser,
    messages,
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

  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    fetchUsers();

    return () => {
      resetChat();
    };
  }, [fetchUsers, resetChat]);

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

  const handleSelectUser = useCallback(
    (user) => {
      setSelectedUser(user);
      setShowSidebar(false);
    },
    [setSelectedUser]
  );

  const handleBack = useCallback(() => {
    setSelectedUser(null);
    setShowSidebar(true);
  }, [setSelectedUser]);

  const handleLogout = useCallback(async () => {
    await logout();
    resetChat();
  }, [logout, resetChat]);

  /* Typing emission handler */
  const typingTimerRef = useRef(null);

  const handleTypingChange = useCallback(
    (isTyping) => {
      if (!selectedUser?._id) {
        return;
      }

      if (isTyping) {
        emitTypingStart(selectedUser._id);
      }
    },
    [selectedUser?._id, emitTypingStart]
  );

  /* Media send handlers */
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

  return (
    <main
      className="min-h-screen px-3 py-3 sm:px-4 sm:py-4"
      style={{ background: "var(--color-bg-page)" }}
    >
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-7xl gap-3 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* Sidebar — hidden on mobile when user is selected */}
        <div className={`${!showSidebar && selectedUser ? "hidden lg:block" : ""}`}>
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
            typingUsers={typingUsers}
          />
        </div>

        {/* Chat panel — always visible on desktop, only when user is selected on mobile */}
        <div className={`${showSidebar && !selectedUser ? "hidden lg:block" : ""} min-h-0`}>
          <ChatPanel
            authUser={authUser}
            selectedUser={selectedUser}
            messages={messages}
            isMessagesLoading={isMessagesLoading}
            isSendingMessage={isSendingMessage}
            chatError={chatError}
            onSendMessage={sendMessage}
            onSendAudio={handleSendAudio}
            onSendImage={handleSendImage}
            onSendLocation={handleSendLocation}
            typingUsers={typingUsers}
            firstUnreadIndex={firstUnreadIndex}
            onTypingChange={handleTypingChange}
            onBack={handleBack}
          />
        </div>
      </div>
    </main>
  );
};

export default Home;
