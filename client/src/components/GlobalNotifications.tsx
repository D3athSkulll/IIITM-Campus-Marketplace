"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/context/SocketContext";
import { useNotification } from "@/context/NotificationContext";
import { useAuth } from "@/context/AuthContext";

/**
 * Mounts invisibly in the layout. Listens for global socket events
 * (new messages, @mentions) and fires banner + browser notifications.
 */
export default function GlobalNotifications() {
  const { socket } = useSocket();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!socket || !user) return;

    const handleMessage = (data: {
      senderName: string;
      message: string;
      chatId: string;
    }) => {
      addNotification({
        type: "info",
        title: `${data.senderName} sent a message`,
        message: data.message,
        browser: true,
        duration: 5000,
        href: `/chats/${data.chatId}`,
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

    return () => {
      socket.off("message-notification", handleMessage);
      socket.off("mention-notification", handleMention);
    };
  }, [socket, user, addNotification, router]);

  return null;
}
