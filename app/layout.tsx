import React, { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { VerticalProvider } from "@nrivera-iimp/ui-kit-iimp";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import DynamicMetadata from "@/components/DynamicMetadata";
import { TranslateErrorBoundary } from "@/components/TranslateErrorBoundary";
import GoogleTranslateScripts from "@/components/GoogleTranslateScripts";
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
            <GoogleTranslateScripts />
            <TranslateErrorBoundary>
              {children}
            </TranslateErrorBoundary>
          </VerticalProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
