import { useEffect } from "react";
import ChatPanel from "../components/ChatPanel";
import UserSidebar from "../components/UserSidebar";
import useAuthStore from "../store/authStore";
import useChatStore from "../store/chatStore";

const Home = () => {
  const { authUser, logout, isLoggingOut, socket, onlineUserIds } = useAuthStore();
  const {
    users,
    selectedUser,
    messages,
    isUsersLoading,
    isMessagesLoading,
    isSendingMessage,
    chatError,
    fetchUsers,
    fetchMessages,
    sendMessage,
    setSelectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    resetChat,
  } = useChatStore();

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

    return () => {
      unsubscribeFromMessages();
    };
  }, [
    selectedUser?._id,
    socket,
    fetchMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
  ]);

  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <UserSidebar
          authUser={authUser}
          users={users}
          onlineUserIds={onlineUserIds}
          selectedUser={selectedUser}
          isUsersLoading={isUsersLoading}
          isLoggingOut={isLoggingOut}
          onSelectUser={setSelectedUser}
          onLogout={logout}
        />

        <ChatPanel
          authUser={authUser}
          selectedUser={selectedUser}
          messages={messages}
          isMessagesLoading={isMessagesLoading}
          isSendingMessage={isSendingMessage}
          chatError={chatError}
          onSendMessage={sendMessage}
        />
      </div>
    </main>
  );
};

export default Home;
