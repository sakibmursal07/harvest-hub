import { createContext, useContext, useState, useEffect } from "react";
import { TRANSLATIONS } from "../lib/translations";

const LanguageContext = createContext();

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", short: "EN" },
  { code: "hi", label: "हिंदी", short: "हिं" },
  { code: "mr", label: "मराठी", short: "मरा" },
];

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("harvest_hub_lang");
      if (saved && TRANSLATIONS[saved]) {
        setLanguageState(saved);
      }
    } catch (e) {
      console.warn("Could not read saved language:", e);
    }
  }, []);

  const setLanguage = (langCode) => {
    if (TRANSLATIONS[langCode]) {
      setLanguageState(langCode);
      try {
        localStorage.setItem("harvest_hub_lang", langCode);
      } catch (e) {}
    }
  };

  const t = (key) => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS["en"]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fallback if used outside provider
    return {
      language: "en",
      setLanguage: () => {},
      t: (k) => TRANSLATIONS["en"]?.[k] || k,
      languages: SUPPORTED_LANGUAGES,
    };
  }
  return ctx;
}
