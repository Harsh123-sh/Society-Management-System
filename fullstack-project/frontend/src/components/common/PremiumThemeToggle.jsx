import { useThemeEngine } from "../../contexts/ThemeContext";
import themePremiumIcon from "../../assets/ui/theme-premium-icon.png";
import "./premium-controls.css";

function currentDocumentTheme() {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" || document.body.dataset.theme === "dark" ? "dark" : "light";
}

export default function PremiumThemeToggle({ className = "" }) {
  const { preferences, setThemeMode } = useThemeEngine();
  const mode = preferences.themeMode === "dark" || preferences.themeMode === "light" ? preferences.themeMode : currentDocumentTheme();
  const isDark = mode === "dark";
  const nextMode = isDark ? "light" : "dark";
  const label = `Switch to ${nextMode} theme`;

  function toggleTheme() {
    setThemeMode(nextMode);
    if (typeof window !== "undefined") {
      localStorage.setItem("theme-mode", nextMode);
      localStorage.setItem("staffTheme", nextMode);
      window.dispatchEvent(new CustomEvent("theme-mode-changed", { detail: { themeMode: nextMode } }));
    }
  }

  return (
    <button
      type="button"
      className={`premium-circle-button premium-theme-toggle ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      <img className="premium-control-icon" src={themePremiumIcon} alt="" aria-hidden="true" />
    </button>
  );
}
