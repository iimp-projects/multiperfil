"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
  isLikelyTranslateError?: boolean;
}

/**
 * Error boundary that catches hydration and DOM mismatch errors
 * often caused by browser extensions or translation tools.
 */
export class TranslateErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    message: undefined,
    isLikelyTranslateError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    const message = error?.message || "";
    const isLikelyTranslateError =
      message.includes("removeChild") ||
      message.includes("insertBefore") ||
      message.includes("NotFoundError") ||
      message.includes("Node") ||
      message.includes("hydration") ||
      message.includes("Hydration");

    return { hasError: true, message, isLikelyTranslateError };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("TranslateErrorBoundary caught an error:", error, errorInfo);
    
    // Check if it's a DOM manipulation error
    const isDOMError = 
      error.message.includes('removeChild') || 
      error.message.includes('insertBefore') ||
      error.message.includes('Node');

    if (isDOMError) {
      console.warn("Detected likely translation/extension DOM crash. Attempting recovery...");
      // For hydration errors, we can sometimes recover by simply resetting state
      // but usually the node is gone. A silent recovery might be possible
      // by forcing a re-render or in extreme cases, a reload.
    }
  }

  public render() {
    if (this.state.hasError) {
      const disableTranslateAndReload = () => {
        try {
          // Disable google translate scripts in this tab.
          sessionStorage.setItem("iimp_disable_translate", "1");

          // Clear google translate cookie (best effort).
          const expire = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
          document.cookie = `googtrans=; path=/; ${expire}`;
          document.cookie = `googtrans=; path=/; domain=${window.location.hostname}; ${expire}`;

          // Also try parent domain (e.g. .sistemasiimp.org.pe)
          const parts = window.location.hostname.split(".");
          if (parts.length >= 3) {
            const parentDomain = "." + parts.slice(-3).join(".");
            document.cookie = `googtrans=; path=/; domain=${parentDomain}; ${expire}`;
          }
        } catch {
          // ignore
        }
        window.location.reload();
      };

      return (
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center">
          <p className="text-sm text-slate-500">
            {this.state.isLikelyTranslateError
              ? "Contenido temporalmente no disponible por traducción automática."
              : "Ocurrió un error en la página."}
          </p>

          {this.state.message ? (
            <p className="mt-2 text-xs text-slate-400 break-words">
              {this.state.message}
            </p>
          ) : null}

          <div className="mt-3 flex items-center justify-center gap-2">
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-3 py-1.5 text-sm rounded-md border border-slate-200 bg-white hover:bg-slate-50"
            >
              Reintentar
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1.5 text-sm rounded-md border border-slate-200 bg-white hover:bg-slate-50"
            >
              Recargar
            </button>
            <button
              onClick={disableTranslateAndReload}
              className="px-3 py-1.5 text-sm rounded-md bg-primary text-white hover:opacity-90"
            >
              Recargar sin traducción
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
