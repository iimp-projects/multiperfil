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
  deleteNotification: (id: string, userKey: string) => Promise<void>;
  markMessageAsRead: (id: string, userKey: string) => Promise<void>;
  markAllMessagesAsRead: (event: string, userKey: string) => Promise<void>;
  toggleArchiveMessage: (id: string, userKey: string, undo?: boolean) => Promise<void>;
  deleteMessage: (id: string, userKey: string) => Promise<void>;
  deletePermanentMessage: (id: string, userKey: string) => Promise<void>;
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

  deleteNotification: async (id, userKey) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
    try {
      await fetch("/api/portal/alerts/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId: id, userKey }),
      });
    } catch (error) {
      console.error("Error deleting notification", error);
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
  
  toggleArchiveMessage: async (id, userKey, undo = false) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, isArchived: !undo } : m
      ),
    }));
    try {
      await fetch("/api/portal/messages/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: id, userKey, undo }),
      });
    } catch (error) {
      console.error("Error toggling archive", error);
    }
  },

  deleteMessage: async (id, userKey) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, isDeleted: true } : m
      ),
    }));
    try {
      await fetch("/api/portal/messages/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: id, userKey }),
      });
    } catch (error) {
      console.error("Error deleting message", error);
    }
  },

  deletePermanentMessage: async (id, userKey) => {
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== id),
    }));
    try {
      await fetch("/api/portal/messages/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: id, userKey, permanent: true }),
      });
    } catch (error) {
      console.error("Error permanent deleting message", error);
    }
  },
}));
