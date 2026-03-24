import useUIStore from "../store/uiStore";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useUIStore();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface px-3 py-2 text-sm font-medium text-text transition hover:border-accent/30 hover:text-accent"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor">
          <circle cx="10" cy="10" r="3.5" strokeWidth="1.6" />
          <path d="M10 2.2v2.1M10 15.7v2.1M17.8 10h-2.1M4.3 10H2.2M15.5 4.5l-1.5 1.5M6 14l-1.5 1.5M15.5 15.5 14 14M6 6 4.5 4.5" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor">
          <path d="M15.5 12.8A6.8 6.8 0 0 1 7.2 4.5a7 7 0 1 0 8.3 8.3Z" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      <span>{isDark ? "Light" : "Dark"}</span>
    </button>
  );
};

export default ThemeToggle;
