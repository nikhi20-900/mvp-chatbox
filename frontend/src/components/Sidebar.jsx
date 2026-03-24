import useAuthStore from "../store/authStore";
import useChatStore from "../store/chatStore";

const Sidebar = () => {
  const { authUser, logout, isLoggingOut } = useAuthStore();
  const { users, selectedUser, setSelectedUser, isUsersLoading, resetChat } = useChatStore();

  const handleLogout = async () => {
    await logout();
    resetChat();
  };

  return (
    <aside className="flex h-full w-full flex-col border-r border-slate-800 bg-slate-950/80 md:w-80">
      <div className="border-b border-slate-800 px-5 py-4">
        <p className="text-xs uppercase tracking-[0.35em] text-sky-400">Chat MVP</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">{authUser?.fullName}</h2>
            <p className="text-sm text-slate-400">{authUser?.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:border-sky-400 hover:text-white disabled:opacity-60"
          >
            {isLoggingOut ? "..." : "Logout"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {isUsersLoading ? (
          <p className="px-2 py-4 text-sm text-slate-400">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="px-2 py-4 text-sm text-slate-400">No other users found.</p>
        ) : (
          <div className="space-y-2">
            {users.map((user) => {
              const isActive = selectedUser?._id === user._id;
              const initials = user.fullName
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <button
                  key={user._id}
                  type="button"
                  onClick={() => setSelectedUser(user)}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                    isActive
                      ? "border-sky-500 bg-sky-500/10"
                      : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                  }`}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-sky-300">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{user.fullName}</p>
                    <p className="truncate text-sm text-slate-400">{user.email}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
