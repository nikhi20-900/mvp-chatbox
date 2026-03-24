const getInitials = (name = "") =>
  name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

const UserSidebar = ({
  authUser,
  users,
  onlineUserIds,
  selectedUser,
  isUsersLoading,
  isLoggingOut,
  onSelectUser,
  onLogout,
}) => (
  <aside className="flex h-full flex-col rounded-[2rem] border border-white/10 bg-slate-950/65 p-4 shadow-soft backdrop-blur">
    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-highlight text-sm font-semibold text-ink">
          {getInitials(authUser?.fullName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-white">{authUser?.fullName}</p>
          <p className="truncate text-sm text-slate-400">{authUser?.email}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onLogout}
        disabled={isLoggingOut}
        className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-highlight/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoggingOut ? "Signing out..." : "Logout"}
      </button>
    </div>

    <div className="mt-5 flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">
          People
        </p>
        <h2 className="mt-2 text-xl font-semibold text-white">Your inbox</h2>
        <p className="mt-1 text-xs text-slate-500">
          {users.filter((user) => onlineUserIds.includes(user._id)).length} online now
        </p>
      </div>
      <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">
        {users.length} contact{users.length === 1 ? "" : "s"}
      </div>
    </div>

    <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1">
      {isUsersLoading ? (
        Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="flex animate-pulse items-center gap-3 rounded-2xl border border-white/5 bg-white/5 p-3"
          >
            <div className="h-11 w-11 rounded-2xl bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-28 rounded-full bg-white/10" />
              <div className="h-3 w-40 rounded-full bg-white/10" />
            </div>
          </div>
        ))
      ) : users.length ? (
        users.map((user) => {
          const isActive = selectedUser?._id === user._id;
          const isOnline = onlineUserIds.includes(user._id) || user.isOnline;
          const previewPrefix = user.lastMessage?.senderId === authUser?._id ? "You: " : "";
          const previewText = user.lastMessage
            ? `${previewPrefix}${user.lastMessage.text}`
            : "No messages yet";

          return (
            <button
              key={user._id}
              type="button"
              onClick={() => onSelectUser(user)}
              className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                isActive
                  ? "border-accent/40 bg-accent/10"
                  : "border-white/5 bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.06]"
              }`}
            >
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
                {getInitials(user.fullName)}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-slate-950 ${
                    isOnline ? "bg-emerald-400" : "bg-slate-600"
                  }`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-white">{user.fullName}</p>
                  <span
                    className={`shrink-0 text-[10px] font-semibold uppercase tracking-[0.22em] ${
                      isOnline ? "text-emerald-300" : "text-slate-500"
                    }`}
                  >
                    {isOnline ? "Online" : "Offline"}
                  </span>
                </div>
                <p className="truncate text-xs text-slate-400">{previewText}</p>
              </div>
            </button>
          );
        })
      ) : (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm leading-6 text-slate-400">
          No users yet. Create another account in a second browser window to start chatting.
        </div>
      )}
    </div>
  </aside>
);

export default UserSidebar;
