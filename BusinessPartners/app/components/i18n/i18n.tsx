import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// 🔤 Define translations
const resources = {
  en: {
    translation: {
      settings: "Settings",
      appLock: "App Lock",
      language: "Language",
      english: "English",
      telugu: "Telugu",
      YourBusinesses : "Your Businesses",
    },
  },
  te: {
    translation: {
      settings: "సెట్టింగ్స్",
      appLock: "యాప్ లాక్",
      language: "భాష",
      english: "ఇంగ్లీష్",
      telugu: "తెలుగు",
      YourBusinesses : "మీ వ్యాపారాలు",
    },
  },
};

// ⚙️ Initialize i18n
i18n.use(initReactI18next).init({
  resources,
  lng: "en", // default
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
