import { create } from "zustand";
import { AppNotification } from "@/components/dashboard/DashboardLayout";

// Extrayendo el Message interface de MailboxView para reutilizarlo o creando uno nuevo
export interface PortalMessage {
  id: string;
  sender: string;
  senderRole: string;
  subject: string;
  preview: string;
  content: string;
  date: string;
  time: string;
  isRead: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  favicon?: string;
  avatar?: string;
}

interface PortalState {
  notifications: AppNotification[];
  messages: PortalMessage[];
  isLoading: boolean;
  fetchNotifications: (event?: string, userKey?: string) => Promise<void>;
  fetchMessages: (event?: string, userKey?: string) => Promise<void>;
  markNotificationAsRead: (id: string, userKey: string) => Promise<void>;
  markAllNotificationsAsRead: (event: string, userKey: string) => Promise<void>;
  markMessageAsRead: (id: string, userKey: string) => Promise<void>;
  markAllMessagesAsRead: (event: string, userKey: string) => Promise<void>;
}

export const usePortalStore = create<PortalState>((set) => ({
  notifications: [],
  messages: [],
  isLoading: false,

  fetchNotifications: async (event?: string, userKey?: string) => {
    set({ isLoading: true });
    try {
      const url = new URL("/api/portal/alerts", window.location.origin);
      if (event) url.searchParams.append("event", event);
      if (userKey) url.searchParams.append("userKey", userKey);
      
      const res = await fetch(url.toString());
      const json = await res.json();
      if (json.success) {
        set({ notifications: json.data });
      }
    } catch (error) {
      console.error("Error fetching notifications", error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMessages: async (event?: string, userKey?: string) => {
    set({ isLoading: true });
    try {
      const url = new URL("/api/portal/messages", window.location.origin);
      if (event) url.searchParams.append("event", event);
      if (userKey) url.searchParams.append("userKey", userKey);

      const res = await fetch(url.toString());
      const json = await res.json();
      if (json.success) {
        set({ messages: json.data });
      }
    } catch (error) {
      console.error("Error fetching messages", error);
    } finally {
      set({ isLoading: false });
    }
  },

  markNotificationAsRead: async (id, userKey) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
    }));
    try {
      await fetch("/api/portal/alerts/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId: id, userKey }),
      });
    } catch (error) {
      console.error("Error marking notification as read", error);
    }
  },

  markAllNotificationsAsRead: async (event, userKey) => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
    }));
    try {
      await fetch("/api/portal/alerts/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true, event, userKey }),
      });
    } catch (error) {
      console.error("Error marking all notifications as read", error);
    }
  },

  markMessageAsRead: async (id, userKey) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, isRead: true } : m
      ),
    }));
    try {
      await fetch("/api/portal/messages/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: id, userKey }),
      });
    } catch (error) {
      console.error("Error marking message as read", error);
    }
  },

  markAllMessagesAsRead: async (event, userKey) => {
    set((state) => ({
      messages: state.messages.map((m) => ({ ...m, isRead: true })),
    }));
    try {
      await fetch("/api/portal/messages/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true, event, userKey }),
      });
    } catch (error) {
      console.error("Error marking all messages as read", error);
    }
  },
}));
