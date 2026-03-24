import { useEffect, useRef } from "react";
import useAuthStore from "../store/authStore";
import useChatStore from "../store/chatStore";

const ChatWindow = () => {
  const { authUser } = useAuthStore();
  const { selectedUser, messages, isMessagesLoading, setSelectedUser } = useChatStore();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!selectedUser) {
    return (
      <section className="hidden flex-1 items-center justify-center bg-slate-950/40 md:flex">
        <div className="max-w-sm text-center">
          <h2 className="text-2xl font-semibold text-white">Select a user</h2>
          <p className="mt-2 text-slate-400">
            Pick someone from the sidebar to start your real-time chat.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col bg-slate-900/40">
      <header className="flex items-center gap-3 border-b border-slate-800 px-4 py-4 md:px-6">
        <button
          type="button"
          onClick={() => setSelectedUser(null)}
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 md:hidden"
        >
          Back
        </button>
        <div>
          <h2 className="text-lg font-semibold text-white">{selectedUser.fullName}</h2>
          <p className="text-sm text-slate-400">{selectedUser.email}</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6">
        {isMessagesLoading ? (
          <p className="text-sm text-slate-400">Loading messages...</p>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-slate-400">No messages yet. Start the conversation.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => {
              const isOwnMessage = message.senderId === authUser?._id;

              return (
                <div
                  key={message._id}
                  className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-soft ${
                      isOwnMessage
                        ? "rounded-br-md bg-sky-500 text-slate-950"
                        : "rounded-bl-md border border-slate-800 bg-slate-950 text-slate-100"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm">{message.text}</p>
                    <p
                      className={`mt-2 text-[11px] ${
                        isOwnMessage ? "text-slate-900/80" : "text-slate-500"
                      }`}
                    >
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </section>
  );
};

export default ChatWindow;
