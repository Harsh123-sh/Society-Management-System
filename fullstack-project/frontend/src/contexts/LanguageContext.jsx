import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useTranslation as useI18nextTranslation } from "react-i18next";
import i18n, { LANGUAGE_STORAGE_KEY, languages, resolveLocale } from "../i18n";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const { t: i18nT } = useI18nextTranslation();
  const [locale, setLocaleState] = useState(resolveLocale(i18n.language));

  useEffect(() => {
    const handleLanguageChanged = (nextLocale) => setLocaleState(resolveLocale(nextLocale));
    i18n.on("languageChanged", handleLanguageChanged);
    return () => i18n.off("languageChanged", handleLanguageChanged);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, locale);
    }

    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
      document.documentElement.dir = languages[locale]?.dir || "ltr";
      document.body.dataset.locale = locale;
    }
  }, [locale]);

  const setLocale = (nextLocale) => {
    const resolved = resolveLocale(nextLocale);
    i18n.changeLanguage(resolved);
    setLocaleState(resolved);
  };

  const t = useMemo(
    () => (key, options) => {
      const fallback = Array.isArray(options) || typeof options === "string" ? options : undefined;
      const params = options && !Array.isArray(options) && typeof options === "object" ? options : undefined;
      return i18nT(key, { defaultValue: fallback, ...(params || {}) });
    },
    [i18nT]
  );

  const languageOptions = useMemo(
    () => Object.entries(languages).map(([code, meta]) => ({ code, label: meta.nativeName })),
    []
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, languageOptions, i18n }),
    [locale, t, languageOptions]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within LanguageProvider");
  }

  return context;
}
