import { useEffect, useMemo, useRef, useState } from "react";
import useUIStore from "../store/uiStore";

const formatTime = (value) =>
  new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

const groupMessages = (messages) => {
  const formatter = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const grouped = [];
  let currentDate = "";

  messages.forEach((message) => {
    const label = formatter.format(new Date(message.createdAt));

    if (label !== currentDate) {
      grouped.push({ type: "date", value: label });
      currentDate = label;
    }

    grouped.push({ type: "message", value: message });
  });

  return grouped;
};

const ChatPanel = ({
  authUser,
  selectedUser,
  messages,
  isMessagesLoading,
  isSendingMessage,
  chatError,
  onSendMessage,
}) => {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef(null);
  const showToast = useUIStore((state) => state.showToast);

  const items = useMemo(() => groupMessages(messages), [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items]);

  useEffect(() => {
    setDraft("");
  }, [selectedUser?._id]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedDraft = draft.trim();

    if (isSendingMessage) {
      return;
    }

    if (!trimmedDraft) {
      showToast({ type: "error", message: "Type a message before sending." });
      return;
    }

    if (trimmedDraft.length > 500) {
      showToast({ type: "error", message: "Keep messages under 500 characters." });
      return;
    }

    const result = await onSendMessage(trimmedDraft);

    if (result?.success) {
      setDraft("");
      return;
    }

    if (result?.message) {
      showToast({ type: "error", message: result.message });
    }
  };

  if (!selectedUser) {
    return (
      <section className="flex h-full items-center justify-center rounded-[2rem] border border-white/10 bg-slate-950/55 p-6 shadow-soft backdrop-blur">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-accent to-highlight text-xl font-semibold text-ink">
            C
          </div>
          <h2 className="mt-6 text-3xl font-semibold text-white">Choose a conversation</h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Pick someone from the sidebar to load message history and start a live chat.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-full flex-col rounded-[2rem] border border-white/10 bg-slate-950/55 shadow-soft backdrop-blur">
      <header className="border-b border-white/10 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/80 to-highlight/80 text-sm font-semibold text-ink">
            {selectedUser.fullName
              .split(" ")
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase() || "")
              .join("")}
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-white">{selectedUser.fullName}</p>
            <p className="truncate text-sm text-slate-400">{selectedUser.email}</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        {isMessagesLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className={`flex ${index % 2 === 0 ? "justify-end" : "justify-start"}`}
              >
                <div className="h-16 w-full max-w-xs animate-pulse rounded-3xl bg-white/5" />
              </div>
            ))}
          </div>
        ) : messages.length ? (
          <div className="space-y-3">
            {items.map((item, index) =>
              item.type === "date" ? (
                <div key={`${item.value}-${index}`} className="flex justify-center py-2">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.28em] text-slate-400">
                    {item.value}
                  </span>
                </div>
              ) : (
                <div
                  key={item.value._id}
                  className={`flex ${
                    item.value.senderId === authUser?._id ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-[1.6rem] px-4 py-3 sm:max-w-[70%] ${
                      item.value.senderId === authUser?._id
                        ? "rounded-br-md bg-gradient-to-br from-accent to-teal-500 text-ink"
                        : "rounded-bl-md border border-white/10 bg-white/[0.05] text-slate-100"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm leading-6">
                      {item.value.text}
                    </p>
                    <p
                      className={`mt-2 text-right text-[11px] ${
                        item.value.senderId === authUser?._id ? "text-slate-900/70" : "text-slate-400"
                      }`}
                    >
                      {formatTime(item.value.createdAt)}
                    </p>
                  </div>
                </div>
              )
            )}
            <div ref={bottomRef} />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-sm rounded-[1.75rem] border border-dashed border-white/10 bg-white/[0.03] p-6 text-center">
              <p className="text-lg font-semibold text-white">No messages yet</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Send the first note to {selectedUser.fullName.split(" ")[0]} and the thread will
                appear here.
              </p>
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-white/10 px-4 py-4 sm:px-6">
        {chatError ? (
          <div className="mb-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {chatError}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <label className="sr-only" htmlFor="message">
            Message
          </label>
          <textarea
            id="message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={`Message ${selectedUser.fullName.split(" ")[0]}...`}
            rows={1}
            maxLength={500}
            className="max-h-40 min-h-[56px] flex-1 resize-y rounded-3xl border border-white/10 bg-slate-900/90 px-4 py-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-accent/60"
          />
          <button
            type="submit"
            disabled={!draft.trim() || isSendingMessage}
            className="rounded-3xl bg-gradient-to-r from-accent to-highlight px-5 py-4 text-sm font-semibold text-ink transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSendingMessage ? "Sending..." : "Send"}
          </button>
        </form>
      </footer>
    </section>
  );
};

export default ChatPanel;
