import { useCallback, useMemo, useState } from "react";

/* ── Icons ───────────────────────────────────────────────── */

const CloseIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CheckIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SearchIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const UsersIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const UserPlusIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
);

/* ── Helpers ─────────────────────────────────────────────── */

const getInitials = (n = "") =>
  n
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");

/* ── Component ───────────────────────────────────────────── */

const GroupModal = ({
  users = [],
  onlineUserIds = new Set(),
  onClose,
  onCreate,
  isCreating = false,
}) => {
  const [name, setName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());

  const toggleMember = useCallback((userId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }, []);

  const handleRemoveChip = (userId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === users.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(users.map((u) => u._id)));
    }
  };

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const selectedUsers = useMemo(() => {
    return users.filter((u) => selectedIds.has(u._id));
  }, [users, selectedIds]);

  const handleCreate = () => {
    if (!name.trim() || selectedIds.size === 0 || isCreating) return;
    onCreate?.(name.trim(), Array.from(selectedIds));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCreate();
    }
    if (e.key === "Escape") {
      onClose?.();
    }
  };

  return (
    <div
      className="image-preview-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="group-modal-title"
    >
      <div
        className="image-preview-card"
        style={{
          background: "var(--color-panel)",
          borderColor: "var(--color-border)",
          maxWidth: 440,
          borderRadius: 20,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ────────────────────────────────────────── */}
        <div
          className="image-preview-header"
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--color-divider)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                background: "var(--color-accent-glow)",
                color: "var(--color-accent)",
              }}
            >
              <UsersIcon />
            </div>
            <div>
              <h2
                id="group-modal-title"
                className="text-base font-bold leading-tight"
                style={{ color: "var(--color-text-primary)" }}
              >
                New Group
              </h2>
              <p
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                Create a space to chat with multiple people
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:opacity-80"
            style={{
              color: "var(--color-text-muted)",
              background: "var(--color-input-bg)",
            }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* ── Body ──────────────────────────────────────────── */}
        <div
          style={{
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* Group Name Input */}
          <div>
            <label
              className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: "var(--color-text-muted)" }}
            >
              Group Name
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Project Alpha, Family & Friends"
                className="image-caption-input"
                style={{
                  background: "var(--color-input-bg)",
                  borderColor: "var(--color-input-border)",
                  color: "var(--color-text-primary)",
                  width: "100%",
                  paddingRight: name ? "58px" : "12px",
                }}
                maxLength={50}
                autoFocus
              />
              <span
                className="absolute right-3 text-[11px] font-medium pointer-events-none"
                style={{ color: "var(--color-text-muted)" }}
              >
                {name.length}/50
              </span>
            </div>
          </div>

          {/* Selected Members Chips */}
          {selectedUsers.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Selected ({selectedUsers.length})
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="text-[11px] font-medium transition-colors hover:underline"
                  style={{ color: "var(--color-accent)" }}
                >
                  Clear all
                </button>
              </div>

              <div
                className="flex flex-wrap gap-1.5 p-2 rounded-xl"
                style={{
                  background: "var(--color-input-bg)",
                  border: "1px solid var(--color-border)",
                  maxHeight: 88,
                  overflowY: "auto",
                }}
              >
                {selectedUsers.map((user) => (
                  <span
                    key={user._id}
                    className="inline-flex items-center gap-1.5 rounded-lg py-1 pl-1.5 pr-2 text-xs font-medium transition-all"
                    style={{
                      background: "var(--color-panel)",
                      color: "var(--color-text-primary)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.fullName}
                        className="h-4 w-4 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <span
                        className="flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white shrink-0"
                        style={{ background: "var(--color-accent)" }}
                      >
                        {getInitials(user.fullName)}
                      </span>
                    )}
                    <span className="max-w-[100px] truncate">{user.fullName}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveChip(user._id)}
                      className="ml-0.5 rounded-full p-0.5 hover:opacity-70 transition-opacity"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Members List Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--color-text-muted)" }}
              >
                Add Members
              </span>

              {users.length > 1 && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[11px] font-medium transition-colors hover:underline"
                  style={{ color: "var(--color-accent)" }}
                >
                  {selectedIds.size === users.length ? "Deselect all" : "Select all"}
                </button>
              )}
            </div>

            {/* Search Input when users exist */}
            {users.length > 0 && (
              <div className="relative mb-2">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <SearchIcon />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search contacts by name or email..."
                  className="h-9 w-full rounded-xl pl-9 pr-8 text-xs outline-none transition-all"
                  style={{
                    background: "var(--color-input-bg)",
                    border: "1px solid var(--color-input-border)",
                    color: "var(--color-text-primary)",
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs hover:opacity-70"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    <CloseIcon />
                  </button>
                )}
              </div>
            )}

            {/* List Container */}
            <div
              className="overflow-y-auto"
              style={{
                maxHeight: 200,
                minHeight: users.length === 0 ? 140 : "auto",
                borderRadius: 12,
                border: "1px solid var(--color-border)",
                background: "var(--color-input-bg)",
              }}
            >
              {/* Empty state: No other users in database */}
              {users.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 text-center h-full">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl mb-3"
                    style={{
                      background: "var(--color-accent-glow)",
                      color: "var(--color-accent)",
                    }}
                  >
                    <UserPlusIcon />
                  </div>
                  <p
                    className="text-xs font-semibold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    No other contacts available
                  </p>
                  <p
                    className="text-[11px] mt-1 max-w-[260px] leading-relaxed"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Create another user account in a second window or invite members to join and start a group chat.
                  </p>
                </div>
              ) : filteredUsers.length === 0 ? (
                /* Empty state: Search query returned no results */
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <p
                    className="text-xs font-medium"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    No contacts found matching &ldquo;{searchQuery}&rdquo;
                  </p>
                </div>
              ) : (
                /* User List */
                filteredUsers.map((user) => {
                  const isSelected = selectedIds.has(user._id);
                  const isOnline =
                    onlineUserIds?.has?.(user._id) || Boolean(user.isOnline);

                  return (
                    <button
                      key={user._id}
                      type="button"
                      onClick={() => toggleMember(user._id)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-all hover:opacity-90"
                      style={{
                        background: isSelected
                          ? "var(--color-accent-glow)"
                          : "transparent",
                        borderBottom: "1px solid var(--color-divider)",
                      }}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.fullName}
                            className="h-9 w-9 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold"
                            style={{
                              background: isSelected
                                ? "var(--color-accent)"
                                : "var(--color-panel)",
                              color: isSelected
                                ? "#fff"
                                : "var(--color-text-primary)",
                              border: "1px solid var(--color-border)",
                            }}
                          >
                            {getInitials(user.fullName)}
                          </div>
                        )}
                        {isOnline && (
                          <span
                            className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2"
                            style={{
                              background: "var(--color-online)",
                              borderColor: "var(--color-panel)",
                            }}
                          />
                        )}
                      </div>

                      {/* Name & Email */}
                      <div className="min-w-0 flex-1">
                        <p
                          className="truncate text-xs font-semibold leading-snug"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {user.fullName}
                        </p>
                        <p
                          className="truncate text-[11px] leading-tight"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {user.email}
                        </p>
                      </div>

                      {/* Checkbox */}
                      <div
                        className="flex h-5 w-5 items-center justify-center rounded-md border transition-all shrink-0"
                        style={{
                          borderColor: isSelected
                            ? "var(--color-accent)"
                            : "var(--color-border)",
                          background: isSelected
                            ? "var(--color-accent)"
                            : "var(--color-panel)",
                          color: "#fff",
                          boxShadow: isSelected
                            ? "0 0 0 2px var(--color-accent-glow)"
                            : "none",
                        }}
                      >
                        {isSelected && <CheckIcon />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────────── */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid var(--color-divider)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {selectedIds.size === 0 ? (
              <span>Select at least 1 member</span>
            ) : (
              <span
                className="font-medium"
                style={{ color: "var(--color-accent)" }}
              >
                {selectedIds.size} member{selectedIds.size > 1 ? "s" : ""} selected
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold transition-all hover:opacity-80 active:scale-95"
              style={{
                background: "var(--color-input-bg)",
                color: "var(--color-text-secondary)",
                border: "1px solid var(--color-border)",
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleCreate}
              disabled={!name.trim() || selectedIds.size === 0 || isCreating}
              className="flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-semibold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
              style={{ background: "var(--color-accent)", color: "#fff" }}
            >
              {isCreating ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Creating...</span>
                </>
              ) : (
                "Create Group"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupModal;
