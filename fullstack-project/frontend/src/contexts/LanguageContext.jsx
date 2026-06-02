import { createContext, useContext, useEffect, useMemo, useState } from "react";
import en from "../locales/en.json";
import hi from "../locales/hi.json";
import gu from "../locales/gu.json";

const LANGUAGE_STORAGE_KEY = "society_language_v1";
const SUPPORTED_LOCALES = { en, hi, gu };
const LANGUAGE_LABELS = {
  en: "English",
  hi: "हिन्दी",
  gu: "ગુજરાતી",
};

function resolveLocale(value) {
  const locale = String(value || "").toLowerCase();
  return Object.keys(SUPPORTED_LOCALES).includes(locale) ? locale : "en";
}

function loadSavedLocale() {
  if (typeof window === "undefined") {
    return "en";
  }

  const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return resolveLocale(saved || window.navigator.language?.slice(0, 2));
}

function getTranslation(locale, key) {
  const tree = SUPPORTED_LOCALES[resolveLocale(locale)];
  if (!key || typeof key !== "string") return undefined;

  return key.split(".").reduce((current, segment) => {
    if (current && typeof current === "object" && segment in current) {
      return current[segment];
    }
    return undefined;
  }, tree);
}

function interpolate(template, params = {}) {
  return String(template).replace(/\{\{(\w+)\}\}/g, (match, paramName) => {
    if (Object.prototype.hasOwnProperty.call(params, paramName)) {
      return String(params[paramName]);
    }
    return match;
  });
}

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(loadSavedLocale);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, locale);
  }, [locale]);

  const setLocale = (nextLocale) => {
    setLocaleState(resolveLocale(nextLocale));
  };

  const t = useMemo(
    () => (key, options) => {
      const value = getTranslation(locale, key);
      const fallback = Array.isArray(options) || typeof options === "string" ? options : undefined;
      const params = options && !Array.isArray(options) && typeof options === "object" ? options : undefined;

      if (value === undefined && locale !== "en") {
        const fallbackValue = getTranslation("en", key);
        if (fallbackValue !== undefined) {
          return typeof fallbackValue === "string"
            ? interpolate(fallbackValue, params)
            : fallbackValue;
        }
      }

      if (value === undefined) {
        return fallback !== undefined ? fallback : key;
      }

      return typeof value === "string" ? interpolate(value, params) : value;
    },
    [locale]
  );

  const languageOptions = useMemo(
    () => Object.entries(LANGUAGE_LABELS).map(([code, label]) => ({ code, label })),
    []
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, languageOptions }),
    [locale, setLocale, t, languageOptions]
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
