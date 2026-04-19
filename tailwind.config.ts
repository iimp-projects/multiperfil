// tailwind.config.ts
import type { Config } from "tailwindcss";
import iimpPreset from "@nrivera-iimp/ui-kit-iimp/preset";

const config: Config = {
  // El preset añade las variables HSL y la configuración de shadcn/ui
  presets: [iimpPreset],
  content: [
    "./app/**/*.{ts,tsx}",
    "./node_modules/@nrivera-iimp/ui-kit-iimp/dist/**/*.{js,mjs}",
  ],
  // ... resto de tu configuración
};

export default config;
