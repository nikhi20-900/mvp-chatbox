import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useUIStore from "../store/uiStore";

/* ── Helpers ──────────────────────────────────────────────── */

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

const getInitials = (name = "") =>
  name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

/* ── Tick icons for read receipts ─────────────────────────── */

const SingleTick = () => (
  <svg width="16" height="12" viewBox="0 0 16 12" fill="none" className="inline-block">
    <path
      d="M1 6.5L5.5 11L14.5 1"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DoubleTick = ({ read }) => (
  <svg width="20" height="12" viewBox="0 0 20 12" fill="none" className="inline-block">
    <path
      d="M1 6.5L5.5 11L14.5 1"
      stroke={read ? "var(--color-accent)" : "currentColor"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5 6.5L9.5 11L18.5 1"
      stroke={read ? "var(--color-accent)" : "currentColor"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ── Typing indicator (3 bouncing dots) ───────────────────── */

const TypingIndicator = () => (
  <div className="flex items-center gap-1.5 px-4 py-2">
    <span className="typing-dot animate-typing-dot-1" />
    <span className="typing-dot animate-typing-dot-2" />
    <span className="typing-dot animate-typing-dot-3" />
  </div>
);

/* ── Scroll-to-bottom button ──────────────────────────────── */

const ScrollButton = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="absolute bottom-20 right-6 z-10 flex h-10 w-10 items-center justify-center rounded-full border shadow-lg theme-transition"
    style={{
      background: "var(--color-panel)",
      borderColor: "var(--color-border)",
      color: "var(--color-text-secondary)",
    }}
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M19 12l-7 7-7-7" />
    </svg>
  </button>
);

/* ── Main ChatPanel ───────────────────────────────────────── */

const ChatPanel = ({
  authUser,
  selectedUser,
  messages,
  isMessagesLoading,
  isSendingMessage,
  chatError,
  onSendMessage,
  typingUsers = {},
  firstUnreadIndex = -1,
  onTypingChange,
  onBack,
}) => {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const showToast = useUIStore((state) => state.showToast);

  const items = useMemo(() => {
    const grouped = groupMessages(messages);

    /* Insert unread divider */
    if (firstUnreadIndex > 0) {
      const unreadMsg = messages[firstUnreadIndex];
      const insertIdx = grouped.findIndex(
        (item) => item.type === "message" && item.value._id === unreadMsg._id
      );

      if (insertIdx > 0) {
        grouped.splice(insertIdx, 0, { type: "unread-divider" });
      }
    }

    return grouped;
  }, [messages, firstUnreadIndex]);

  const isOtherUserTyping = selectedUser && typingUsers[selectedUser._id];

  /* Scroll tracking */
  const isNearBottom = useCallback(() => {
    const el = scrollContainerRef.current;

    if (!el) {
      return true;
    }

    return el.scrollHeight - el.scrollTop - el.clientHeight < 150;
  }, []);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isNearBottom()) {
      scrollToBottom();
    }
  }, [items, isOtherUserTyping, isNearBottom, scrollToBottom]);

  useEffect(() => {
    const el = scrollContainerRef.current;

    if (!el) {
      return;
    }

    const handleScroll = () => {
      setShowScrollBtn(!isNearBottom());
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [isNearBottom]);

  useEffect(() => {
    setDraft("");
  }, [selectedUser?._id]);

  /* ── Input handlers ──────────────────────────────────────── */

  const handleDraftChange = (event) => {
    setDraft(event.target.value);

    if (onTypingChange) {
      onTypingChange(event.target.value.length > 0);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  const handleSubmit = async (event) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }

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

  /* ── Empty state (no user selected) ──────────────────────── */

  if (!selectedUser) {
    return (
      <section
        className="hidden flex-1 items-center justify-center rounded-2xl border theme-transition lg:flex"
        style={{
          background: "var(--color-panel)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="max-w-md text-center">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold"
            style={{ background: "var(--color-accent)", color: "#fff" }}
          >
            💬
          </div>
          <h2 className="mt-6 text-2xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Choose a conversation
          </h2>
          <p className="mt-3 text-sm leading-7" style={{ color: "var(--color-text-secondary)" }}>
            Pick someone from the sidebar to load message history and start chatting.
          </p>
        </div>
      </section>
    );
  }

  /* ── Chat view ───────────────────────────────────────────── */

  return (
    <section
      className="flex h-full flex-col rounded-2xl border theme-transition overflow-hidden"
      style={{
        background: "var(--color-panel)",
        borderColor: "var(--color-border)",
      }}
    >
      {/* Header */}
      <header
        className="flex items-center gap-3 border-b px-4 py-3 backdrop-blur-sm sm:px-5"
        style={{
          background: "var(--color-header-bg)",
          borderColor: "var(--color-divider)",
        }}
      >
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border px-2.5 py-1.5 text-sm lg:hidden theme-transition"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-secondary)",
            }}
          >
            ← Back
          </button>
        )}

        {/* Avatar */}
        <div className="relative">
          {selectedUser.avatar ? (
            <img
              src={selectedUser.avatar}
              alt={selectedUser.fullName}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold"
              style={{ background: "var(--color-accent)", color: "#fff" }}
            >
              {getInitials(selectedUser.fullName)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {selectedUser.fullName}
          </p>
          <p className="truncate text-xs" style={{ color: "var(--color-text-muted)" }}>
            {isOtherUserTyping ? "typing…" : selectedUser.email}
          </p>
        </div>
      </header>

      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        className="relative flex-1 overflow-y-auto px-4 py-4 sm:px-5"
        style={{ background: "var(--color-chat-bg)" }}
      >
        {isMessagesLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className={`flex ${index % 2 === 0 ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="h-14 w-full max-w-xs animate-pulse rounded-2xl"
                  style={{ background: "var(--color-border)" }}
                />
              </div>
            ))}
          </div>
        ) : messages.length ? (
          <div className="space-y-1">
            {items.map((item, index) => {
              if (item.type === "date") {
                return (
                  <div key={`date-${item.value}-${index}`} className="flex justify-center py-3">
                    <span
                      className="rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-wider"
                      style={{
                        borderColor: "var(--color-border)",
                        color: "var(--color-text-muted)",
                        background: "var(--color-panel)",
                      }}
                    >
                      {item.value}
                    </span>
                  </div>
                );
              }

              if (item.type === "unread-divider") {
                return (
                  <div key="unread-divider" className="flex items-center gap-3 py-3">
                    <div className="flex-1 border-t" style={{ borderColor: "var(--color-unread-badge)" }} />
                    <span
                      className="shrink-0 text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: "var(--color-unread-badge)" }}
                    >
                      New messages
                    </span>
                    <div className="flex-1 border-t" style={{ borderColor: "var(--color-unread-badge)" }} />
                  </div>
                );
              }

              /* Message bubble */
              const msg = item.value;
              const isOwn = msg.senderId === authUser?._id;

              return (
                <div
                  key={msg._id}
                  className={`flex animate-msg-in ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 sm:max-w-[65%] ${
                      isOwn ? "rounded-br-md" : "rounded-bl-md"
                    }`}
                    style={{
                      background: isOwn ? "var(--color-bubble-own)" : "var(--color-bubble-other)",
                      color: isOwn ? "var(--color-bubble-own-text)" : "var(--color-bubble-other-text)",
                    }}
                  >
                    <p className="whitespace-pre-wrap break-words text-[13.5px] leading-relaxed">
                      {msg.text}
                    </p>
                    <div className={`mt-1 flex items-center gap-1.5 ${isOwn ? "justify-end" : ""}`}>
                      <span
                        className="text-[10px]"
                        style={{
                          color: isOwn
                            ? "var(--color-bubble-own-text)"
                            : "var(--color-text-muted)",
                          opacity: 0.7,
                        }}
                      >
                        {formatTime(msg.createdAt)}
                      </span>

                      {/* Read receipt ticks (only on own messages) */}
                      {isOwn && (
                        <span
                          style={{
                            color: "var(--color-bubble-own-text)",
                            opacity: msg.readAt ? 1 : 0.6,
                          }}
                        >
                          {msg.readAt ? (
                            <DoubleTick read />
                          ) : msg.deliveredAt ? (
                            <DoubleTick read={false} />
                          ) : (
                            <SingleTick />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {isOtherUserTyping && (
              <div className="flex justify-start animate-fade-in">
                <div
                  className="rounded-2xl rounded-bl-md"
                  style={{
                    background: "var(--color-bubble-other)",
                  }}
                >
                  <TypingIndicator />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div
              className="max-w-sm rounded-2xl border border-dashed p-6 text-center"
              style={{ borderColor: "var(--color-border)" }}
            >
              <p className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
                No messages yet
              </p>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--color-text-secondary)" }}>
                Send the first message to {selectedUser.fullName.split(" ")[0]} and the
                conversation will appear here.
              </p>
            </div>
          </div>
        )}

        {showScrollBtn && <ScrollButton onClick={scrollToBottom} />}
      </div>

      {/* Input footer */}
      <footer
        className="border-t px-4 py-3 sm:px-5"
        style={{
          borderColor: "var(--color-divider)",
          background: "var(--color-panel)",
        }}
      >
        {chatError ? (
          <div
            className="mb-3 rounded-xl border px-4 py-2.5 text-sm"
            style={{
              borderColor: "rgba(239,68,68,0.2)",
              background: "rgba(239,68,68,0.08)",
              color: "#ef4444",
            }}
          >
            {chatError}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="flex items-end gap-2.5">
          <label className="sr-only" htmlFor="message-input">
            Message
          </label>
          <textarea
            id="message-input"
            value={draft}
            onChange={handleDraftChange}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${selectedUser.fullName.split(" ")[0]}…`}
            rows={1}
            maxLength={500}
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all theme-transition"
            style={{
              background: "var(--color-input-bg)",
              borderColor: "var(--color-input-border)",
              color: "var(--color-text-primary)",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "var(--color-accent)";
              e.target.style.boxShadow = "0 0 0 3px var(--color-accent-glow)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "var(--color-input-border)";
              e.target.style.boxShadow = "none";
            }}
          />
          <button
            type="submit"
            disabled={!draft.trim() || isSendingMessage}
            className="flex h-[44px] items-center justify-center rounded-xl px-4 text-sm font-semibold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: "var(--color-accent)",
              color: "#fff",
            }}
          >
            {isSendingMessage ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            )}
          </button>
        </form>
      </footer>
    </section>
  );
};

export default ChatPanel;
