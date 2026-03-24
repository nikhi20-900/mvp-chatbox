import useUIStore from "../store/uiStore";

const toneClasses = {
  success: "border-emerald-400/25 bg-emerald-400/12 text-emerald-50",
  error: "border-rose-400/25 bg-rose-400/12 text-rose-50",
  info: "border-sky-400/25 bg-sky-400/12 text-sky-50",
};

const ToastStack = () => {
  const { toasts, dismissToast } = useUIStore();

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-soft backdrop-blur ${
            toneClasses[toast.type] || toneClasses.info
          }`}
        >
          <div className="flex items-start gap-3">
            <p className="flex-1 text-sm leading-6">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="text-xs font-semibold uppercase tracking-[0.2em] text-current/70 transition hover:text-current"
            >
              Close
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ToastStack;
