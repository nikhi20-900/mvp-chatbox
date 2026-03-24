import { create } from "zustand";

const TOAST_DURATION = 3200;
const THEME_STORAGE_KEY = "chat-app-theme";

const getInitialTheme = () => {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);

  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const applyThemeToDOM = (theme) => {
  const root = document.documentElement;

  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
};

/* Apply theme on module load so there's no flash */
const initialTheme = getInitialTheme();
applyThemeToDOM(initialTheme);

const useUIStore = create((set, get) => ({
  toasts: [],
  theme: initialTheme,

  toggleTheme: () => {
    const nextTheme = get().theme === "dark" ? "light" : "dark";
    applyThemeToDOM(nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    set({ theme: nextTheme });
  },

  showToast: ({ type = "info", message }) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    set((state) => ({
      toasts: [...state.toasts, { id, type, message }],
    }));

    window.setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((toast) => toast.id !== id),
      }));
    }, TOAST_DURATION);
  },

  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));

export default useUIStore;
