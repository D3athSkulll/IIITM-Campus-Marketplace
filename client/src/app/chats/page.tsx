"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useSocket } from "@/context/SocketContext";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";

export default function ChatsListPage() {
  const { user, token, isLoading: authLoading } = useRequireAuth();
  const { socket } = useSocket();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = useCallback(async () => {
    if (!token) return;
    try {
      const d = await api<any>("/chats", { token });
      setChats(d.chats);
    } catch {
      toast.error("Failed to load chats");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (authLoading || !user || !token) return;
    fetchChats();
  }, [authLoading, user, token, fetchChats]);

  // Re-sort chats list when any chat gets a new message
  useEffect(() => {
    if (!socket || !chats.length) return;

    // Join all chat rooms to receive updates
    chats.forEach((c) => socket.emit("join-chat", c._id));

    const handleUpdate = (payload: { chatId: string; message?: any }) => {
      setChats((prev) => {
        const idx = prev.findIndex((c) => c._id === payload.chatId);
        if (idx === -1) {
          // Unknown chat — full refresh
          fetchChats();
          return prev;
        }
        const updated = { ...prev[idx] };
        if (payload.message) {
          updated.messages = [...(updated.messages || []), payload.message];
          updated.lastMessageAt = payload.message.createdAt || new Date().toISOString();
        }
        const rest = prev.filter((_, i) => i !== idx);
        return [updated, ...rest]; // bubble to top
      });
    };

    socket.on("chat:updated", handleUpdate);
    return () => {
      socket.off("chat:updated", handleUpdate);
    };
  }, [socket, chats.length, fetchChats]);


  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-[var(--surface-alt)] rounded-xl animate-shimmer border-2 border-[#1D3557]" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-[#1D3557] mb-4">My Chats</h1>
        {chats.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No chats yet. Browse listings to start chatting!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {chats.map((chat) => {
              const other = user._id === chat.buyer._id ? chat.seller : chat.buyer;
              const lastMsg = chat.messages[chat.messages.length - 1];
              return (
                <Link key={chat._id} href={`/chats/${chat._id}`}>
                  <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-[#1D3557] bg-[var(--surface)] hover:shadow-sm transition-shadow cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-[var(--navy)] flex items-center justify-center text-[#1D3557] text-sm font-bold shrink-0 border border-[#1D3557]">
                      {other.avatarUrl
                        ? <img src={other.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                        : other.displayName[0].toUpperCase()
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{other.displayName}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(chat.lastMessageAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{chat.listing?.title}</p>
                      {lastMsg && (
                        <p className="text-xs text-muted-foreground/80 truncate mt-0.5">{lastMsg.content}</p>
                      )}
                    </div>
                    <div className="shrink-0">
                      {chat.mode === "negotiation" && (
                        <Badge className="bg-[var(--gold)] text-[#1D3557] text-[10px]">Negotiating</Badge>
                      )}
                      {chat.status === "completed" && (
                        <Badge variant="outline" className="text-[#1D3557] border-[#D8E2DC] text-[10px]">Deal ✓</Badge>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
