export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
}

export interface PrivacySettings {
  profileVisibility: "public" | "private";
  contactPermission: "everyone" | "participants" | "none";
  whatsappVisible: boolean;
}

export interface LoginSession {
  id: string;
  date: string;
  time: string;
  ip: string;
  device?: string;
}

export interface UserSettings {
  preferences: {
    notifications: NotificationPreferences;
  };
  privacy: PrivacySettings;
  loginHistory: LoginSession[];
}
