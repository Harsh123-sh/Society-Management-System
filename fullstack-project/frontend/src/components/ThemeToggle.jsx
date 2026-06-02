import { useThemeEngine } from "../contexts/ThemeContext";

export default function ThemeToggle() {
  const { preferences, setThemeMode } = useThemeEngine();
  const theme = preferences.themeMode || "light";

  const toggleTheme = () => {
    setThemeMode(theme === "dark" ? "light" : "dark");
  };

  return (
    <button
      className="inline-flex items-center gap-2 rounded-md border px-3 py-1 text-sm shadow-sm backdrop-blur transition"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--border)",
        color: "var(--text)"
      }}
    >
      {theme === "dark" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 1v6m0 6v6m11-11h-6m-6 0H1m15.657-1.657l-4.243 4.243m-3.428 0l-4.243-4.243M4.343 19.657l4.243-4.243m3.428 0l4.243 4.243" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
      <span className="text-xs font-medium">{theme === "dark" ? "Light" : "Dark"}</span>
    </button>
  );
}
