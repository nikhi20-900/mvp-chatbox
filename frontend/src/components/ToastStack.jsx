import useUIStore from "../store/uiStore";

const toneStyles = {
  success: {
    borderColor: "rgba(34, 197, 94, 0.25)",
    background: "rgba(34, 197, 94, 0.1)",
    color: "#22c55e",
  },
  error: {
    borderColor: "rgba(239, 68, 68, 0.25)",
    background: "rgba(239, 68, 68, 0.1)",
    color: "#ef4444",
  },
  info: {
    borderColor: "var(--color-accent-glow)",
    background: "var(--color-accent-glow)",
    color: "var(--color-accent)",
  },
};

const ToastStack = () => {
  const { toasts, dismissToast } = useUIStore();

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2.5">
      {toasts.map((toast) => {
        const style = toneStyles[toast.type] || toneStyles.info;

        return (
          <div
            key={toast.id}
            className="pointer-events-auto animate-slide-up rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm"
            style={{
              ...style,
              backdropFilter: "blur(8px)",
            }}
          >
            <div className="flex items-start gap-3">
              <p className="flex-1 text-sm leading-6">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="shrink-0 text-xs font-semibold uppercase tracking-wider opacity-70 transition hover:opacity-100"
                style={{ color: style.color }}
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ToastStack;
