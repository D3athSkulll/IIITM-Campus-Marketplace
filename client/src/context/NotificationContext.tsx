"use client";

import React, { createContext, useContext, useCallback, useState } from "react";

export interface Notification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
  duration?: number; // ms, 0 = no auto-dismiss
  browser?: boolean; // Show browser notification
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id">) => string;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, "id">) => {
    const id = `notif-${Date.now()}-${Math.random()}`;
    const fullNotification: Notification = { ...notification, id };

    // Request browser notification permission if needed
    if (notification.browser && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(notification.title, {
          body: notification.message,
          icon: "/logo.png",
          tag: "marketplace-notification",
        });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification(notification.title, {
              body: notification.message,
              icon: "/logo.png",
              tag: "marketplace-notification",
            });
          }
        });
      }
    }

    setNotifications((prev) => [...prev, fullNotification]);

    // Auto-dismiss after duration (default 5s for banner notifications)
    if (notification.duration !== 0) {
      const timeout = notification.duration || 5000;
      setTimeout(() => {
        removeNotification(id);
      }, timeout);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
}
