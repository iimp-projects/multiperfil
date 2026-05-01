import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Vertical } from "@nrivera-iimp/ui-kit-iimp";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

interface AdminAuthState {
  admin: AdminUser | null;
  selectedEvent: string | null;
  selectedVertical: Vertical | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  
  setAdminAuth: (admin: AdminUser, event: string, vertical: Vertical) => void;
  setSelectedEvent: (event: string, vertical: Vertical) => void;
  logoutAdmin: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      admin: null,
      selectedEvent: null,
      selectedVertical: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setAdminAuth: (admin, event, vertical) =>
        set({ admin, selectedEvent: event, selectedVertical: vertical, isAuthenticated: true }),
        
      setSelectedEvent: (event, vertical) =>
        set({ selectedEvent: event, selectedVertical: vertical }),
        
      logoutAdmin: () =>
        set({ admin: null, selectedEvent: null, selectedVertical: null, isAuthenticated: false }),
        
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: "admin-auth-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
