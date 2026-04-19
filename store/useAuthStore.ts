import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User } from "../types/auth";
import CryptoJS from "crypto-js";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setAuth: (user: User) => void;
  updateUser: (data: Partial<User>) => void;
  setHasHydrated: (state: boolean) => void;
  logout: () => void;
}

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_AUTH_SECRET || "iimp-secure-key-2026";

const encryptedStorage = {
  getItem: (name: string): string | null => {
    const value = localStorage.getItem(name);
    if (!value) return null;

    // Si los datos parecen no estar cifrados (comienzan con '{' de JSON),
    // los manejamos limpiando el storage para evitar errores.
    if (value.startsWith("{")) {
      console.warn("Auth state is not encrypted or corrupted, clearing storage...");
      localStorage.removeItem(name);
      return null;
    }

    try {
      const bytes = CryptoJS.AES.decrypt(value, ENCRYPTION_KEY);
      const decoded = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decoded) {
        throw new Error("Empty decryption result");
      }
      
      return decoded;
    } catch (error) {
      console.error("Error decrypting auth state:", error);
      // Si el descifrado falla (ej. Malformed UTF-8), limpiamos para evitar bucles de error
      localStorage.removeItem(name);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    const encrypted = CryptoJS.AES.encrypt(value, ENCRYPTION_KEY).toString();
    localStorage.setItem(name, encrypted);
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,
      setAuth: (user: User) => set({ user, isAuthenticated: true }),
      updateUser: (data: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...data },
          });
        }
      },
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => encryptedStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
