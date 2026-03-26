import { useCallback, useState } from "react";

/* ── Icons ───────────────────────────────────────────────── */

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/* ── Component ───────────────────────────────────────────── */

const GroupModal = ({ users = [], onClose, onCreate, isCreating = false }) => {
  const [name, setName] = useState("");
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

  const handleCreate = () => {
    if (!name.trim() || selectedIds.size === 0) return;
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

  const getInitials = (n = "") =>
    n
      .split(" ")
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || "")
      .join("");

  return (
    <div className="image-preview-overlay" onClick={onClose}>
      <div
        className="image-preview-card"
        style={{ background: "var(--color-panel)", borderColor: "var(--color-border)", maxWidth: 400 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="image-preview-header">
          <span className="image-preview-title" style={{ color: "var(--color-text-primary)" }}>
            New Group
          </span>
          <button
            type="button"
            onClick={onClose}
            className="image-preview-close"
            style={{ color: "var(--color-text-muted)" }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Group name */}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Group name"
            className="image-caption-input"
            style={{
              background: "var(--color-input-bg)",
              borderColor: "var(--color-input-border)",
              color: "var(--color-text-primary)",
              width: "100%",
            }}
            maxLength={50}
            autoFocus
          />

          {/* Member list */}
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--color-text-muted)" }}
            >
              Add Members ({selectedIds.size} selected)
            </p>
            <div
              className="overflow-y-auto"
              style={{
                maxHeight: 240,
                borderRadius: 10,
                border: "1px solid var(--color-border)",
              }}
            >
              {users.map((user) => {
                const isSelected = selectedIds.has(user._id);

                return (
                  <button
                    key={user._id}
                    type="button"
                    onClick={() => toggleMember(user._id)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-all hover:opacity-80"
                    style={{
                      background: isSelected ? "var(--color-accent-glow)" : "transparent",
                      borderBottom: "1px solid var(--color-divider)",
                    }}
                  >
                    {/* Avatar */}
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.fullName}
                        className="h-8 w-8 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-semibold shrink-0"
                        style={{ background: "var(--color-input-bg)", color: "var(--color-text-primary)" }}
                      >
                        {getInitials(user.fullName)}
                      </div>
                    )}

                    <span
                      className="flex-1 text-sm truncate"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {user.fullName}
                    </span>

                    {/* Checkbox */}
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-md border transition-all shrink-0"
                      style={{
                        borderColor: isSelected ? "var(--color-accent)" : "var(--color-border)",
                        background: isSelected ? "var(--color-accent)" : "transparent",
                        color: "#fff",
                      }}
                    >
                      {isSelected && <CheckIcon />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid var(--color-divider)",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={handleCreate}
            disabled={!name.trim() || selectedIds.size === 0 || isCreating}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: "var(--color-accent)", color: "#fff" }}
          >
            {isCreating ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              "Create Group"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupModal;
