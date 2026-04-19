"use client";

import { useEffect, useState } from "react";

export function LanguageSwitcher() {
  const [lang, setLang] = useState("es");

  useEffect(() => {
    // Check for existing google translation cookie
    const checkCookie = () => {
      const match = document.cookie.match(/googtrans=\/es\/(\w+)/);
      if (match && match[1]) {
        setLang(match[1].toLowerCase());
      }
    };
    checkCookie();
  }, []);

  const changeLanguage = (newLang: string) => {
    if (lang === newLang) return;
    setLang(newLang);

    // Google Translate uses a cookie to track the selected language: /source/target
    document.cookie = `googtrans=/es/${newLang}; path=/; domain=${window.location.hostname}`;
    document.cookie = `googtrans=/es/${newLang}; path=/`;

    window.location.reload();
  };

  return (
    <div className="flex items-center">
      {/* Hidden element required by Google Translate */}
      <div id="google_translate_element" className="hidden" />

      <div className="flex bg-slate-100 p-1 rounded-full notranslate skiptranslate border border-slate-200/50 shadow-inner">
        <button
          onClick={() => changeLanguage("es")}
          className={`cursor-pointer px-4 py-1 rounded-full text-sm font-bold transition-all duration-300 h-auto border-none ${
            lang === "es"
              ? "bg-white text-primary shadow-sm"
              : "bg-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          ES
        </button>
        <button
          onClick={() => changeLanguage("en")}
          className={`cursor-pointer px-4 py-1 rounded-full text-sm font-bold transition-all duration-300 h-auto border-none ${
            lang === "en"
              ? "bg-white text-primary shadow-sm"
              : "bg-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          EN
        </button>
      </div>
    </div>
  );
}
