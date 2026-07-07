import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "../contexts/LanguageContext";

const premiumLanguageLabels = {
  en: { label: "English", dropdownLabel: "English 🇺🇸" },
  hi: { label: "Hindi", dropdownLabel: "हिन्दी 🇮🇳" },
  gu: { label: "Gujarati", dropdownLabel: "ગુજરાતી 🇮🇳" },
};

function LanguageIcon({ name = "globe" }) {
  const paths = {
    globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3.6 9h16.8M3.6 15h16.8M12 3c2.1 2.2 3.2 5.2 3.2 9S14.1 18.8 12 21M12 3C9.9 5.2 8.8 8.2 8.8 12s1.1 6.8 3.2 9",
    chevron: "m6 9 6 6 6-6",
    check: "M20 6 9 17l-5-5",
  };

  return (
    <svg className="premium-control-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}

export default function LanguageSelector({ className = "", supportedCodes, variant = "default" }) {
  const { locale, setLocale, languageOptions, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const visibleOptions = useMemo(() => {
    const options = Array.isArray(supportedCodes) && supportedCodes.length > 0
      ? languageOptions.filter((option) => supportedCodes.includes(option.code))
      : languageOptions;

    return options.map((option) => ({
      ...option,
      label: premiumLanguageLabels[option.code]?.label || option.label,
      dropdownLabel: premiumLanguageLabels[option.code]?.dropdownLabel || option.label,
    }));
  }, [languageOptions, supportedCodes]);
  const selectedValue = visibleOptions.some((option) => option.code === locale) ? locale : visibleOptions[0]?.code || locale;
  const selectedOption = visibleOptions.find((option) => option.code === selectedValue) || visibleOptions[0];

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
      <div className={`premium-language-control ${className}`} ref={dropdownRef}>
        <button
          type="button"
          className="premium-language-trigger"
          onClick={() => setOpen((value) => !value)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={t("common.language", "Language")}
        >
          <span className="premium-language-globe">
            <LanguageIcon />
          </span>
          <span className="premium-language-label">{selectedOption?.label || "English"}</span>
          <span className="premium-language-chevron">
            <LanguageIcon name="chevron" />
          </span>
        </button>

        {open ? (
          <div className="premium-control-menu premium-language-menu" role="menu">
            {visibleOptions.map((option) => {
              const selected = selectedValue === option.code;
              return (
                <button
                  key={option.code}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  className={selected ? "is-selected" : ""}
                  onClick={() => {
                    setLocale(option.code);
                    setOpen(false);
                  }}
                >
                  <span>{option.dropdownLabel}</span>
                  <span className="premium-menu-check">
                    {selected ? <LanguageIcon name="check" /> : null}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`language-selector enterprise-language-selector ${className}`}>
      <label htmlFor="language-selector" className="sr-only">
        {t("common.language")}
      </label>
      <span className="enterprise-language-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" role="img">
          <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
          <path d="M3.6 9h16.8M3.6 15h16.8M12 3c2.1 2.2 3.2 5.2 3.2 9S14.1 18.8 12 21M12 3C9.9 5.2 8.8 8.2 8.8 12s1.1 6.8 3.2 9" />
        </svg>
      </span>
      <select
        id="language-selector"
        value={selectedValue}
        onChange={(event) => setLocale(event.target.value)}
        className="enterprise-select"
        aria-label={t("common.language", "Language")}
      >
        {visibleOptions.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="enterprise-language-chevron" aria-hidden="true">
        <svg viewBox="0 0 20 20" role="img">
          <path d="m5 7.5 5 5 5-5" />
        </svg>
      </span>
    </div>
  );
}
