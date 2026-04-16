"use client";

import React, { createContext, useContext, useCallback, useEffect, useState } from "react";

export interface Notification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
  duration?: number; // ms, 0 = no auto-dismiss
  browser?: boolean; // Show browser notification
  href?: string; // Optional link to navigate on click
  createdAt?: string;
  /** Stable dedup key — if set, replaces any existing history entry with the same key. */
  key?: string;
}

interface NotificationContextType {
  notifications: Notification[]; // transient banner notifications (auto-dismiss)
  history: Notification[]; // persistent notification history
  addNotification: (notification: Omit<Notification, "id">) => string;
  removeNotification: (id: string) => void;
  clearHistory: () => void;
  removeHistoryItem: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const HISTORY_KEY = "campus-market-notifications-v1";
const MAX_HISTORY = 50;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [history, setHistory] = useState<Notification[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  // Poll localStorage for logout (removeItem in same tab won't fire 'storage')
  useEffect(() => {
    const interval = setInterval(() => {
      if (!localStorage.getItem(HISTORY_KEY) && history.length > 0) {
        setHistory([]);
        setNotifications([]);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [history.length]);

  // Persist history whenever it changes (skip if logged out)
  useEffect(() => {
    try {
      if (history.length > 0) {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      }
    } catch {
      // ignore
    }
  }, [history]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, "id">) => {
    const id = `notif-${Date.now()}-${Math.random()}`;
    const fullNotification: Notification = {
      ...notification,
      id,
      createdAt: new Date().toISOString(),
    };

    if (notification.browser && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(notification.title, {
          body: notification.message,
          icon: "/app_logo.png",
          tag: "marketplace-notification",
        });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification(notification.title, {
              body: notification.message,
              icon: "/app_logo.png",
              tag: "marketplace-notification",
            });
          }
        });
      }
    }

    setNotifications((prev) => [...prev, fullNotification]);
    // Add to persistent history (newest first), trim to max size.
    // If a `key` is provided, replace any existing entry with that key.
    setHistory((prev) => {
      const filtered = notification.key ? prev.filter((n) => n.key !== notification.key) : prev;
      return [fullNotification, ...filtered].slice(0, MAX_HISTORY);
    });

    if (notification.duration !== 0) {
      const timeout = notification.duration || 5000;
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, timeout);
    }

    return id;
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
    // Mark unread-messages notification as dismissed so it won't re-seed on reload
    localStorage.setItem("cm-unread-notif-dismissed", "1");
  }, []);

  const removeHistoryItem = useCallback((id: string) => {
    setHistory((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        history,
        addNotification,
        removeNotification,
        clearHistory,
        removeHistoryItem,
      }}
    >
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
