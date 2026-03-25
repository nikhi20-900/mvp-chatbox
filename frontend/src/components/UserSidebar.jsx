import useUIStore from "../store/uiStore";

const getInitials = (name = "") =>
  name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

/* ── Theme toggle icon ────────────────────────────────────── */

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

/* ── Sidebar ──────────────────────────────────────────────── */

const UserSidebar = ({
  authUser,
  users,
  onlineUserIds,
  selectedUser,
  isUsersLoading,
  isLoggingOut,
  onSelectUser,
  onLogout,
  onNavigateProfile,
  typingUsers = {},
}) => {
  const { theme, toggleTheme } = useUIStore();

  return (
    <aside
      className="flex h-full flex-col rounded-2xl border theme-transition overflow-hidden"
      style={{
        background: "var(--color-sidebar-bg)",
        borderColor: "var(--color-border)",
      }}
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <div
        className="border-b px-4 py-3"
        style={{ borderColor: "var(--color-divider)" }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {authUser?.avatar ? (
              <img
                src={authUser.avatar}
                alt={authUser.fullName}
                className="h-9 w-9 shrink-0 rounded-full object-cover cursor-pointer"
                onClick={onNavigateProfile}
              />
            ) : (
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold cursor-pointer"
                style={{ background: "var(--color-accent)", color: "#fff" }}
                onClick={onNavigateProfile}
              >
                {getInitials(authUser?.fullName)}
              </div>
            )}
            <div className="min-w-0">
              <p
                className="truncate text-sm font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                {authUser?.fullName}
              </p>
              <p
                className="truncate text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                {authUser?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-lg border transition-all hover:opacity-80 active:scale-95 theme-transition"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-secondary)",
              }}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>

            {/* Profile */}
            <button
              type="button"
              onClick={onNavigateProfile}
              className="flex h-8 w-8 items-center justify-center rounded-lg border transition-all hover:opacity-80 active:scale-95 theme-transition"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-secondary)",
              }}
              title="Edit profile"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>

            {/* Logout */}
            <button
              type="button"
              onClick={onLogout}
              disabled={isLoggingOut}
              className="flex h-8 w-8 items-center justify-center rounded-lg border transition-all hover:opacity-80 active:scale-95 disabled:opacity-50 theme-transition"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-secondary)",
              }}
              title="Logout"
            >
              {isLoggingOut ? (
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Section label ────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <p
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--color-text-muted)" }}
        >
          Conversations
        </p>
        <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
          {users.filter((user) => onlineUserIds.includes(user._id)).length} online
        </p>
      </div>

      {/* ── User list ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {isUsersLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex animate-pulse items-center gap-3 rounded-xl p-2.5 mb-1"
            >
              <div
                className="h-10 w-10 shrink-0 rounded-full"
                style={{ background: "var(--color-border)" }}
              />
              <div className="flex-1 space-y-2">
                <div
                  className="h-3.5 w-24 rounded-full"
                  style={{ background: "var(--color-border)" }}
                />
                <div
                  className="h-3 w-36 rounded-full"
                  style={{ background: "var(--color-border)" }}
                />
              </div>
            </div>
          ))
        ) : users.length ? (
          users.map((user) => {
            const isActive = selectedUser?._id === user._id;
            const isOnline = onlineUserIds.includes(user._id) || user.isOnline;
            const isTyping = typingUsers[user._id];
            const previewPrefix =
              user.lastMessage?.senderId === authUser?._id ? "You: " : "";

            /* Type-aware preview text */
            let lastMsgPreview = "";
            if (user.lastMessage) {
              switch (user.lastMessage.messageType) {
                case "audio":
                  lastMsgPreview = "🎤 Voice message";
                  break;
                case "image":
                  lastMsgPreview = user.lastMessage.text
                    ? `📷 ${user.lastMessage.text}`
                    : "📷 Photo";
                  break;
                case "location":
                  lastMsgPreview = "📍 Location";
                  break;
                default:
                  lastMsgPreview = user.lastMessage.text || "";
              }
            }

            const previewText = isTyping
              ? "typing…"
              : user.lastMessage
              ? `${previewPrefix}${lastMsgPreview}`
              : "No messages yet";

            return (
              <button
                key={user._id}
                type="button"
                onClick={() => onSelectUser(user)}
                className={`flex w-full items-center gap-3 rounded-xl p-2.5 mb-0.5 text-left transition-all ${
                  isActive ? "" : "hover:opacity-80"
                }`}
                style={{
                  background: isActive ? "var(--color-accent-glow)" : "transparent",
                  borderLeft: isActive ? "3px solid var(--color-accent)" : "3px solid transparent",
                }}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.fullName}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold"
                      style={{
                        background: "var(--color-input-bg)",
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {getInitials(user.fullName)}
                    </div>
                  )}
                  {/* Online dot */}
                  <span
                    className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2"
                    style={{
                      background: isOnline ? "var(--color-online)" : "var(--color-text-muted)",
                      borderColor: "var(--color-sidebar-bg)",
                    }}
                  />
                </div>

                {/* Text */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className="truncate text-sm font-medium"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {user.fullName}
                    </p>

                    {/* Unread badge */}
                    {user.unreadCount > 0 && (
                      <span
                        className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white"
                        style={{ background: "var(--color-unread-badge)" }}
                      >
                        {user.unreadCount > 99 ? "99+" : user.unreadCount}
                      </span>
                    )}
                  </div>
                  <p
                    className="truncate text-xs"
                    style={{
                      color: isTyping
                        ? "var(--color-accent)"
                        : "var(--color-text-muted)",
                      fontStyle: isTyping ? "italic" : "normal",
                    }}
                  >
                    {previewText}
                  </p>
                </div>
              </button>
            );
          })
        ) : (
          <div
            className="rounded-xl border border-dashed p-5 text-center text-sm leading-6"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-muted)",
            }}
          >
            No users yet. Create another account in a second browser window to start chatting.
          </div>
        )}
      </div>
    </aside>
  );
};

export default UserSidebar;
