"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

export default function GoogleTranslateScripts() {
  const [enabled] = useState(() => {
    // Determine initial enabled state on first client render.
    // This avoids setState inside useEffect (lint rule).
    try {
      if (typeof window === "undefined") return false;
      if (sessionStorage.getItem("iimp_disable_translate") === "1") return false;
      const match = document.cookie.match(/(?:^|;\s*)googtrans=\/es\/(\w+)/);
      const target = match?.[1]?.toLowerCase() || null;
      return Boolean(target && target !== "es");
    } catch {
      return false;
    }
  });

  useEffect(() => {
    // Nothing to do. This component is intentionally static.
  }, []);

  if (!enabled) return null;

  return (
    <>
      <Script
        id="google-translate-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            function googleTranslateElementInit() {
              try {
                new google.translate.TranslateElement({
                  pageLanguage: 'es',
                  includedLanguages: 'en,es',
                  layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                  autoDisplay: false
                }, 'google_translate_element');

                // Keep the top bar hidden
                const hideGoogleBar = () => {
                  const banner = document.querySelector('.goog-te-banner-frame');
                  const skipTranslate = document.querySelector('.skiptranslate');

                  if (banner) {
                    banner.remove();
                    document.body.style.top = '0px';
                  }

                  if (skipTranslate && skipTranslate.tagName === 'IFRAME') {
                    skipTranslate.style.display = 'none';
                    skipTranslate.style.visibility = 'hidden';
                    document.body.style.top = '0px';
                  }
                };

                const observer = new MutationObserver(hideGoogleBar);
                observer.observe(document.body, { childList: true, subtree: true });
                setInterval(hideGoogleBar, 1000);
              } catch (e) {
                // Avoid breaking the whole app if translate fails.
                console.warn('[translate] init failed', e);
              }
            }
          `,
        }}
      />
      <Script
        id="google-translate-script"
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
    </>
  );
}
