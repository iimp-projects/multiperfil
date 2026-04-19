"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Error boundary that catches hydration and DOM mismatch errors
 * often caused by browser extensions or translation tools.
 */
export class TranslateErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    void error;
    return { hasError: true };
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
      // Return a simple fallback. On next navigation, React will try to recover.
      // We don't want to show a scary screen for a simple text-node-missing error.
      return (
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center">
          <p className="text-sm text-slate-500">
            Contenido temporalmente no disponible por traducción automática. 
            <button 
              onClick={() => window.location.reload()} 
              className="ml-2 text-primary hover:underline font-bold"
            >
              Recargar
            </button>
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
