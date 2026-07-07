import { useEffect, useRef, useState } from "react";
import { useTranslation } from "../contexts/LanguageContext";
import { useThemeEngine } from "../contexts/ThemeContext";

const modes = [
  { key: "light", icon: "sun", labelKey: "theme.light", fallback: "Light" },
  { key: "dark", icon: "moon", labelKey: "theme.dark", fallback: "Dark" },
  { key: "auto", icon: "monitor", labelKey: "theme.system", fallback: "System" },
];

function ThemeIcon({ name }) {
  const paths = {
    sun: "M12 4V2m0 20v-2m8-8h2M2 12h2m14.95-6.95 1.41-1.41M3.64 20.36l1.41-1.41m0-13.9L3.64 3.64m16.72 16.72-1.41-1.41M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
    moon: "M20.2 14.2A7.6 7.6 0 0 1 9.8 3.8 8.2 8.2 0 1 0 20.2 14.2Z",
    monitor: "M4 5h16a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 20 17H4a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 4 5Zm5 16h6m-3-4v4",
    check: "M20 6 9 17l-5-5",
  };

  return (
    <svg className="premium-control-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}

export default function ThemeSwitcher({ compact = false, variant = "default", className = "" }) {
  const { preferences, setThemeMode } = useThemeEngine();
  const { t } = useTranslation();
  const currentMode = preferences.themeMode || "auto";
  const current = modes.find((mode) => mode.key === currentMode) || modes[2];
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (variant === "premium") {
    return (
      <div className={`premium-theme-control ${className}`} ref={dropdownRef}>
        <button
          type="button"
          className="premium-theme-trigger"
          onClick={() => setOpen((value) => !value)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={t("theme.title", "Theme")}
          title={t(current.labelKey, current.fallback)}
        >
          <ThemeIcon name={current.icon} />
        </button>

        {open ? (
          <div className="premium-control-menu premium-theme-menu" role="menu">
            <div className="premium-menu-title">{t("theme.title", "Theme")}</div>
            {modes.map((mode) => {
              const selected = currentMode === mode.key;
              return (
                <button
                  key={mode.key}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  className={selected ? "is-selected" : ""}
                  onClick={() => {
                    setThemeMode(mode.key);
                    setOpen(false);
                  }}
                >
                  <span className="premium-menu-option-icon">
                    <ThemeIcon name={mode.icon} />
                  </span>
                  <span>{t(mode.labelKey, mode.fallback)}</span>
                  <span className="premium-menu-check">
                    {selected ? <ThemeIcon name="check" /> : null}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  }

  if (compact) {
    return (
      <button
        type="button"
        className={`premium-theme-trigger enterprise-theme-icon-toggle ${className}`}
        onClick={() => {
          const next = currentMode === "light" ? "dark" : currentMode === "dark" ? "auto" : "light";
          setThemeMode(next);
        }}
        aria-label={`${t("theme.title", "Theme")}: ${t(current.labelKey, current.fallback)}`}
        title={`${t("theme.title", "Theme")}: ${t(current.labelKey, current.fallback)}`}
      >
        <ThemeIcon name={current.icon} />
        <span className="sr-only">{t(current.labelKey, current.fallback)}</span>
      </button>
    );
  }

  return (
    <div className={`enterprise-theme-switcher ${className}`} role="group" aria-label={t("theme.title", "Theme")}>
      <span className="enterprise-control-label">{t("theme.title", "Theme")}</span>
      <div className="enterprise-segmented">
        {modes.map((mode) => (
          <button
            key={mode.key}
            type="button"
            className={currentMode === mode.key ? "is-active" : ""}
            onClick={() => setThemeMode(mode.key)}
            title={t(mode.labelKey, mode.fallback)}
            aria-pressed={currentMode === mode.key}
          >
            <span aria-hidden="true">
              <ThemeIcon name={mode.icon} />
            </span>
            <strong>{t(mode.labelKey, mode.fallback)}</strong>
          </button>
        ))}
      </div>
    </div>
  );
}
