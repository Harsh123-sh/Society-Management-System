import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../locales/en.json";
import hi from "../locales/hi.json";
import gu from "../locales/gu.json";
import mr from "../locales/mr.json";
import ta from "../locales/ta.json";
import te from "../locales/te.json";
import bn from "../locales/bn.json";

const LANGUAGE_STORAGE_KEY = "society_language_v1";

export const languages = {
  en: { nativeName: "English", dir: "ltr" },
  hi: { nativeName: "हिन्दी", dir: "ltr" },
  gu: { nativeName: "ગુજરાતી", dir: "ltr" },
  mr: { nativeName: "मराठी", dir: "ltr" },
  ta: { nativeName: "தமிழ்", dir: "ltr" },
  te: { nativeName: "తెలుగు", dir: "ltr" },
  bn: { nativeName: "বাংলা", dir: "ltr" },
};

export function resolveLocale(value) {
  const locale = String(value || "").toLowerCase();
  return Object.keys(languages).includes(locale) ? locale : "en";
}

const savedLocale =
  typeof window !== "undefined"
    ? window.localStorage.getItem(LANGUAGE_STORAGE_KEY) || window.navigator.language?.slice(0, 2)
    : "en";

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      gu: { translation: gu },
      mr: { translation: mr },
      ta: { translation: ta },
      te: { translation: te },
      bn: { translation: bn },
    },
    lng: resolveLocale(savedLocale),
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    returnObjects: true,
    supportedLngs: Object.keys(languages),
    react: { useSuspense: false },
  });
}

export { LANGUAGE_STORAGE_KEY };
export default i18n;
