"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/context/SocketContext";
import { useNotification } from "@/context/NotificationContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

/**
 * Listens for global socket events and fires *coalesced* notifications.
 * Also checks for unread messages on app load so the bell has a count
 * even before any real-time events fire.
 */
export default function GlobalNotifications() {
  const { socket } = useSocket();
  const { addNotification } = useNotification();
  const { user, token } = useAuth();
  const router = useRouter();

  const unreadChatsRef = useRef<Set<string>>(new Set());
  const bargainChatsRef = useRef<Set<string>>(new Set());
  const loadedRef = useRef(false);

  // On login, fetch unread count once and seed the notification bell
  useEffect(() => {
    if (!user || !token || loadedRef.current) return;
    loadedRef.current = true;
    api<{ unreadCount: number }>("/chats/unread-count", { token })
      .then(({ unreadCount }) => {
        if (unreadCount > 0) {
          addNotification({
            key: "unread-messages",
            type: "info",
            title: unreadCount === 1 ? "You have an unread message" : `${unreadCount} chats have unread messages`,
            message: "Tap to view your chats",
            duration: 0, // stay until dismissed
            href: "/chats",
          });
        }
      })
      .catch(() => {/* non-critical */});
  }, [user, token, addNotification]);

  // Reset loadedRef on logout
  useEffect(() => {
    if (!user) loadedRef.current = false;
  }, [user]);

  useEffect(() => {
    if (!socket || !user) return;

    const handleMessage = (data: { senderName: string; message: string; chatId: string }) => {
      unreadChatsRef.current.add(data.chatId);
      const n = unreadChatsRef.current.size;
      addNotification({
        key: "unread-messages",
        type: "info",
        title: n === 1 ? `New message from ${data.senderName}` : `${n} chats have new messages`,
        message: n === 1 ? data.message : "Tap to view your chats",
        browser: true,
        duration: 5000,
        href: n === 1 ? `/chats/${data.chatId}` : "/chats",
      });
    };

    const handleBargain = (data: { chatId: string; title?: string; detail?: string }) => {
      bargainChatsRef.current.add(data.chatId);
      const n = bargainChatsRef.current.size;
      addNotification({
        key: "bargain-progress",
        type: "warning",
        title: n === 1 ? (data.title || "Bargain update") : `${n} bargains have updates`,
        message: data.detail || "Tap to view negotiation progress",
        browser: true,
        duration: 6000,
        href: n === 1 ? `/chats/${data.chatId}` : "/chats",
      });
    };

    const handleMention = (data: {
      authorName: string;
      listingTitle: string;
      content: string;
      listingId: string;
    }) => {
      addNotification({
        type: "warning",
        title: `${data.authorName} mentioned you`,
        message: `"${data.content}" — in ${data.listingTitle}`,
        browser: true,
        duration: 7000,
        href: `/listings/${data.listingId}`,
      });
    };

    socket.on("message-notification", handleMessage);
    socket.on("mention-notification", handleMention);
    socket.on("bargain-notification", handleBargain);

    return () => {
      socket.off("message-notification", handleMessage);
      socket.off("mention-notification", handleMention);
      socket.off("bargain-notification", handleBargain);
    };
  }, [socket, user, addNotification, router]);

  // Reset counters when user visits /chats
  useEffect(() => {
    const reset = () => {
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/chats")) {
        unreadChatsRef.current.clear();
        bargainChatsRef.current.clear();
      }
    };
    reset();
    window.addEventListener("popstate", reset);
    return () => window.removeEventListener("popstate", reset);
  }, []);

  return null;
}
