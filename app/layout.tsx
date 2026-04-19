import React, { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { VerticalProvider } from "@nrivera-iimp/ui-kit-iimp";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import Script from "next/script";
import DynamicMetadata from "@/components/DynamicMetadata";
import { TranslateErrorBoundary } from "@/components/TranslateErrorBoundary";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const saved = localStorage.getItem('iimp-vertical');
                  const urlParams = new URLSearchParams(window.location.search);
                  const themeParam = urlParams.get('theme');
                  
                  // Vertical por defecto: 'gess', 'proexplo' o 'wmc'
                  const vertical = themeParam || saved || 'proexplo'; 
                  
                  document.documentElement.classList.add('vert-' + vertical);
                  document.documentElement.setAttribute('data-vertical', vertical);

                  // FIX for Google Translate removeChild crash in React apps
                  if (typeof Node !== 'undefined' && Node.prototype) {
                    const originalRemoveChild = Node.prototype.removeChild;
                    Node.prototype.removeChild = function(child) {
                      if (child.parentNode !== this) {
                        return child;
                      }
                      return originalRemoveChild.apply(this, arguments);
                    };

                    const originalInsertBefore = Node.prototype.insertBefore;
                    Node.prototype.insertBefore = function(newNode, referenceNode) {
                      if (referenceNode && referenceNode.parentNode !== this) {
                        return originalInsertBefore.apply(this, [newNode, null]);
                      }
                      return originalInsertBefore.apply(this, arguments);
                    };
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <Script
          id="google-translate-config"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              function googleTranslateElementInit() {
                new google.translate.TranslateElement({
                  pageLanguage: 'es',
                  includedLanguages: 'en,es',
                  layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                  autoDisplay: false
                }, 'google_translate_element');

                // Advanced trick to keep the top bar hidden
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
              }
            `,
          }}
        />
        <Script
          id="google-translate-script"
          src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Toaster position="top-right" richColors closeButton />
          <VerticalProvider defaultVertical="proexplo">
            <Suspense fallback={null}>
              <DynamicMetadata />
            </Suspense>
            <TranslateErrorBoundary>
              {children}
            </TranslateErrorBoundary>
          </VerticalProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
