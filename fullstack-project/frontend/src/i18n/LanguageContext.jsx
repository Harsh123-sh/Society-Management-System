import { createContext, useContext, useState } from "react";
import { translations } from "./translations";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(localStorage.getItem("language") || "en");

  function changeLanguage(lang) {
    setLanguage(lang);
    localStorage.setItem("language", lang);
  }

  function t(key) {
    return key.split(".").reduce((obj, part) => obj?.[part], translations[language]) || key;
  }

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}