// LanguageContext.tsx
import React, { createContext, useContext, useState } from "react";

type Language = "en" | "te";

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const translations: Record<Language, Record<string, string>> = {
  en: {
    addInvestment: "Add Investment",
    totalAmount: "Total Amount",
    splitSheet: "Split Sheet",
    save: "Save",
    cancel: "Cancel",
    share: "Share",
    equal: "Equal",
    manual: "Manual",
  },
  te: {
    addInvestment: "మొత్తం పెట్టుబడి",
    totalAmount: "మొత్తం మొత్తం",
    splitSheet: "షేర్ షీట్",
    save: "సేవ్ చేయి",
    cancel: "రద్దు",
    share: "షేర్",
    equal: "సమానంగా",
    manual: "మాన్యువల్",
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>("en");

  const toggleLanguage = () => setLanguage((prev) => (prev === "en" ? "te" : "en"));
  const t = (key: string) => translations[language][key] || key;

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
};
