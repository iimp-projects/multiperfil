import { create } from "zustand";
import { PortalRecipientUser } from "@/types/acceso/users";

interface UsersAdminState {
  selectedUsers: PortalRecipientUser[];
  addUser: (user: PortalRecipientUser) => void;
  removeUser: (userId: string) => void;
  clearUsers: () => void;
}

export const useUsersAdminStore = create<UsersAdminState>((set) => ({
  selectedUsers: [],
  addUser: (user) =>
    set((state) => {
      // Avoid duplicates
      if (state.selectedUsers.some((u) => u.id === user.id)) return state;
      return { selectedUsers: [...state.selectedUsers, user] };
    }),
  removeUser: (userId) =>
    set((state) => ({
      selectedUsers: state.selectedUsers.filter((u) => u.id !== userId),
    })),
  clearUsers: () => set({ selectedUsers: [] }),
}));
