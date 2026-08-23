import { useEffect, useMemo, useRef, useState } from "react";

/* ── Icons ───────────────────────────────────────────────── */

const SearchIcon = () => (
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
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const UserIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const GroupIcon = () => (
  <svg
    width="16"
    height="16"
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

const PlusIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const SunMoonIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

const ProfileIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LogoutIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

/* ── Helper ──────────────────────────────────────────────── */

const getInitials = (n = "") =>
  n
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");

/* ── Component ───────────────────────────────────────────── */

const CommandPalette = ({
  isOpen,
  onClose,
  users = [],
  groups = [],
  onSelectUser,
  onSelectGroup,
  onNewGroup,
  onToggleTheme,
  onNavigateProfile,
  onLogout,
}) => {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build items list
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();

    const matchedUsers = users
      .filter(
        (u) =>
          !q ||
          u.fullName?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)
      )
      .map((u) => ({
        id: `user-${u._id}`,
        type: "user",
        category: "Direct Messages",
        title: u.fullName,
        subtitle: u.email,
        avatar: u.avatar,
        data: u,
        action: () => {
          onSelectUser?.(u);
          onClose?.();
        },
      }));

    const matchedGroups = groups
      .filter((g) => !q || g.name?.toLowerCase().includes(q))
      .map((g) => ({
        id: `group-${g._id}`,
        type: "group",
        category: "Groups",
        title: g.name,
        subtitle: `${g.members?.length || 0} members`,
        avatar: g.avatar,
        data: g,
        action: () => {
          onSelectGroup?.(g);
          onClose?.();
        },
      }));

    const actionItems = [
      {
        id: "act-new-group",
        type: "action",
        category: "Actions",
        title: "Create New Group",
        subtitle: "Start a group conversation",
        icon: <PlusIcon />,
        keywords: ["new", "group", "create", "chat"],
        action: () => {
          onNewGroup?.();
          onClose?.();
        },
      },
      {
        id: "act-theme",
        type: "action",
        category: "Actions",
        title: "Toggle Theme",
        subtitle: "Switch between Dark and Light mode",
        icon: <SunMoonIcon />,
        keywords: ["theme", "dark", "light", "mode", "color"],
        action: () => {
          onToggleTheme?.();
          onClose?.();
        },
      },
      {
        id: "act-profile",
        type: "action",
        category: "Actions",
        title: "View Profile",
        subtitle: "Manage your account & avatar",
        icon: <ProfileIcon />,
        keywords: ["profile", "account", "settings", "avatar", "name"],
        action: () => {
          onNavigateProfile?.();
          onClose?.();
        },
      },
      {
        id: "act-logout",
        type: "action",
        category: "Actions",
        title: "Log Out",
        subtitle: "End current session",
        icon: <LogoutIcon />,
        keywords: ["logout", "signout", "exit"],
        action: () => {
          onLogout?.();
          onClose?.();
        },
      },
    ].filter((item) => {
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.includes(q))
      );
    });

    return [...matchedUsers, ...matchedGroups, ...actionItems];
  }, [
    query,
    users,
    groups,
    onSelectUser,
    onSelectGroup,
    onNewGroup,
    onToggleTheme,
    onNavigateProfile,
    onLogout,
    onClose,
  ]);

  // Keep active index in bounds
  useEffect(() => {
    if (activeIndex >= filteredItems.length) {
      setActiveIndex(Math.max(0, filteredItems.length - 1));
    }
  }, [filteredItems, activeIndex]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose?.();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev <= 0 ? filteredItems.length - 1 : prev - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = filteredItems[activeIndex];
      if (selected) {
        selected.action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
      style={{
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden animate-scale-up"
        style={{
          background: "var(--color-panel)",
          borderColor: "var(--color-border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search header */}
        <div
          className="flex items-center gap-3 px-4 py-3.5 border-b"
          style={{ borderColor: "var(--color-divider)" }}
        >
          <span
            className="flex items-center justify-center shrink-0"
            style={{ color: "var(--color-accent)" }}
          >
            <SearchIcon />
          </span>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search contacts, groups, actions..."
            className="flex-1 bg-transparent text-sm font-medium outline-none"
            style={{ color: "var(--color-text-primary)" }}
          />

          <kbd
            className="hidden sm:inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold border"
            style={{
              background: "var(--color-input-bg)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-muted)",
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="max-h-[380px] overflow-y-auto p-2"
          style={{ background: "var(--color-panel)" }}
        >
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center">
              <p
                className="text-sm font-medium"
                style={{ color: "var(--color-text-muted)" }}
              >
                No results found for &ldquo;{query}&rdquo;
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--color-text-muted)", opacity: 0.8 }}
              >
                Try searching for a user name, group, or command
              </p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === activeIndex;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.action}
                  onMouseEnter={() => setActiveIndex(index)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all"
                  style={{
                    background: isSelected
                      ? "var(--color-accent-glow)"
                      : "transparent",
                    color: isSelected
                      ? "var(--color-accent)"
                      : "var(--color-text-primary)",
                  }}
                >
                  {/* Icon / Avatar */}
                  <div className="shrink-0">
                    {item.type === "user" ? (
                      item.avatar ? (
                        <img
                          src={item.avatar}
                          alt={item.title}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold"
                          style={{
                            background: isSelected
                              ? "var(--color-accent)"
                              : "var(--color-input-bg)",
                            color: isSelected
                              ? "#fff"
                              : "var(--color-text-primary)",
                          }}
                        >
                          {getInitials(item.title)}
                        </div>
                      )
                    ) : item.type === "group" ? (
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-full"
                        style={{
                          background: isSelected
                            ? "var(--color-accent)"
                            : "var(--color-input-bg)",
                          color: isSelected
                            ? "#fff"
                            : "var(--color-accent)",
                        }}
                      >
                        <GroupIcon />
                      </div>
                    ) : (
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-xl"
                        style={{
                          background: isSelected
                            ? "var(--color-accent)"
                            : "var(--color-input-bg)",
                          color: isSelected
                            ? "#fff"
                            : "var(--color-text-secondary)",
                        }}
                      >
                        {item.icon}
                      </div>
                    )}
                  </div>

                  {/* Text details */}
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-xs font-semibold leading-tight"
                      style={{
                        color: isSelected
                          ? "var(--color-accent)"
                          : "var(--color-text-primary)",
                      }}
                    >
                      {item.title}
                    </p>
                    <p
                      className="truncate text-[11px] leading-tight mt-0.5"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {item.subtitle}
                    </p>
                  </div>

                  {/* Category tag & Enter shortcut */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                      style={{
                        background: "var(--color-input-bg)",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {item.category}
                    </span>
                    {isSelected && (
                      <kbd
                        className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold"
                        style={{
                          background: "var(--color-accent)",
                          color: "#fff",
                        }}
                      >
                        ↵
                      </kbd>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div
          className="flex items-center justify-between px-4 py-2 text-[11px] border-t"
          style={{
            borderColor: "var(--color-divider)",
            background: "var(--color-input-bg)",
            color: "var(--color-text-muted)",
          }}
        >
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-semibold">↑</kbd> <kbd className="font-semibold">↓</kbd> navigate
            </span>
            <span>
              <kbd className="font-semibold">↵</kbd> select
            </span>
          </div>
          <span>
            <kbd className="font-semibold">esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
