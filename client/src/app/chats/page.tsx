"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useSocket } from "@/context/SocketContext";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";

const READ_MAP_KEY = "chat-last-read-v1";

function loadReadMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(READ_MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export default function ChatsListPage() {
  const { user, token, isLoading: authLoading } = useRequireAuth();
  const { socket } = useSocket();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [readMap, setReadMap] = useState<Record<string, string>>({});
  // track joined rooms so we don't re-join on every render
  const joinedRooms = useRef<Set<string>>(new Set());

  // Load read map on mount and re-check when window regains focus
  useEffect(() => {
    setReadMap(loadReadMap());
    const onFocus = () => setReadMap(loadReadMap());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

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

  // Join new chat rooms and listen for updates
  useEffect(() => {
    if (!socket || !chats.length) return;

    // Join only rooms we haven't joined yet
    chats.forEach((c) => {
      if (!joinedRooms.current.has(c._id)) {
        socket.emit("join-chat", c._id);
        joinedRooms.current.add(c._id);
      }
    });

    const handleUpdate = (payload: { chatId: string; message?: any; senderId?: string }) => {
      setChats((prev) => {
        const idx = prev.findIndex((c) => c._id === payload.chatId);
        if (idx === -1) {
          fetchChats();
          return prev;
        }
        const updated = { ...prev[idx] };
        if (payload.message) {
          updated.messages = [...(updated.messages || []), payload.message];
          updated.lastMessageAt = payload.message.createdAt || new Date().toISOString();
        }
        const rest = prev.filter((_, i) => i !== idx);
        return [updated, ...rest];
      });
    };

    socket.on("chat:updated", handleUpdate);
    return () => {
      socket.off("chat:updated", handleUpdate);
    };
  }, [socket, chats.length, fetchChats, user]);

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
          <div className="flex flex-col gap-3">
            {chats.map((chat) => {
              const other = user._id === chat.buyer._id ? chat.seller : chat.buyer;
              const lastMsg = chat.messages[chat.messages.length - 1];
              // A chat is unread if:
              //  - it has a last message from the OTHER user
              //  - AND the last read id in localStorage doesn't match the last message id
              const lastMsgSenderId = lastMsg?.sender?._id || lastMsg?.sender;
              const isFromOther = lastMsg && lastMsgSenderId && lastMsgSenderId !== user._id;
              const hasUnread = isFromOther && readMap[chat._id] !== lastMsg._id;
              return (
                <Link
                  key={chat._id}
                  href={`/chats/${chat._id}`}
                  className="block"
                >
                  <div className={`flex items-center gap-3 p-4 rounded-xl border-2 bg-[var(--surface)] hover:shadow-sm transition-shadow cursor-pointer ${hasUnread ? "border-[#E63946] shadow-[2px_2px_0px_0px_#E63946]" : "border-[#1D3557]"}`}>
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-[var(--navy)] flex items-center justify-center text-[#1D3557] text-sm font-bold border border-[#1D3557]">
                        {other.avatarUrl
                          ? <img src={other.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                          : other.displayName[0].toUpperCase()
                        }
                      </div>
                      {hasUnread && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#E63946] rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold text-sm ${hasUnread ? "text-[#E63946]" : ""}`}>{other.displayName}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(chat.lastMessageAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{chat.listing?.title}</p>
                      {lastMsg && (
                        <p className={`text-xs truncate mt-0.5 ${hasUnread ? "font-semibold text-[#1D3557]" : "text-muted-foreground/80"}`}>{lastMsg.content}</p>
                      )}
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      {chat.mode === "negotiation" && (
                        <Badge className="bg-[var(--gold)] text-[#1D3557] text-[10px]">Negotiating</Badge>
                      )}
                      {chat.status === "completed" && (
                        <Badge variant="outline" className="text-[#1D3557] border-[#D8E2DC] text-[10px]">Deal ✓</Badge>
                      )}
                      {hasUnread && (
                        <Badge className="bg-[#E63946] text-white text-[10px]">New</Badge>
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
