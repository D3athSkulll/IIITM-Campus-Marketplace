"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useSocket } from "@/context/SocketContext";
import { api } from "@/lib/api";
import { uploadImage } from "@/lib/uploadImage";
import Navbar from "@/components/Navbar";
import ImageLightbox from "@/components/ImageLightbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, Send, Zap, CheckCircle, XCircle, CreditCard, Info, X, Camera, Loader2
} from "lucide-react";

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useRequireAuth();
  const { socket } = useSocket();

  const [chat, setChat] = useState<any>(null);
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [offerAmount, setOfferAmount] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showNegotiatePrompt, setShowNegotiatePrompt] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [showInfoBanner, setShowInfoBanner] = useState(true);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Prevent duplicate fetches when socket fires while a fetch is in-flight
  const fetchingRef = useRef(false);

  const fetchChat = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const data = await api<any>(`/chats/${id}`, { token });
      setChat(data.chat);
      setRole(data.role);
      setQuickReplies(data.quickReplies || []);

      if (data.chat?.negotiation?.outcome === "accepted") {
        try {
          const txData = await api<any>(`/transactions/by-chat/${id}`, { token });
          setTransactionId(txData.transaction?._id || null);
        } catch {
          setTransactionId(null);
        }
      } else {
        setTransactionId(null);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load chat");
      router.push("/chats");
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [id, token, router]);

  // Initial load — wait for auth first
  useEffect(() => {
    if (authLoading || !user || !token) return;
    fetchChat();
  }, [authLoading, user, token, fetchChat]);

  // ── Socket: join room & listen for real-time updates ───────────────────────
  useEffect(() => {
    if (!socket || !id) return;

    socket.emit("join-chat", id);

    const handleUpdate = (payload: { type: string; message?: any }) => {
      if (payload.type === "message" && payload.message) {
        setChat((prev: any) => {
          if (!prev) return prev;
          // Already present by _id
          if (prev.messages.some((m: any) => m._id === payload.message._id)) return prev;
          // Match a pending temp message from the same sender with identical content.
          // Race: the socket event may arrive before the POST response, which would
          // leave two copies — one temp, one real — until a refresh.
          const incomingSenderId = payload.message.sender?._id || payload.message.sender;
          const tempIdx = prev.messages.findIndex((m: any) => {
            if (typeof m._id !== "string" || !m._id.startsWith("temp-")) return false;
            const mSenderId = m.sender?._id || m.sender;
            return mSenderId === incomingSenderId && m.content === payload.message.content && m.type === payload.message.type;
          });
          if (tempIdx !== -1) {
            const newMessages = [...prev.messages];
            newMessages[tempIdx] = payload.message;
            return { ...prev, messages: newMessages, lastMessageAt: payload.message.createdAt };
          }
          return {
            ...prev,
            messages: [...prev.messages, payload.message],
            lastMessageAt: payload.message.createdAt,
          };
        });
      } else {
        // Negotiation state change — full refetch is safest
        fetchChat();
      }
    };

    const handleUserTyping = () => {
      setOtherUserTyping(true);
    };

    const handleUserStoppedTyping = () => {
      setOtherUserTyping(false);
    };

    socket.on("chat:updated", handleUpdate);
    socket.on("user-typing", handleUserTyping);
    socket.on("user-stopped-typing", handleUserStoppedTyping);

    return () => {
      socket.emit("leave-chat", id);
      socket.off("chat:updated", handleUpdate);
      socket.off("user-typing", handleUserTyping);
      socket.off("user-stopped-typing", handleUserStoppedTyping);
    };
  }, [socket, id, fetchChat]);

  // Scroll to bottom when messages change + mark this chat as read up to the last message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    if (!chat?.messages?.length || !id) return;
    const lastMsgId = chat.messages[chat.messages.length - 1]?._id;
    if (!lastMsgId) return;
    try {
      const raw = localStorage.getItem("chat-last-read-v1");
      const map = raw ? JSON.parse(raw) : {};
      map[id] = lastMsgId;
      localStorage.setItem("chat-last-read-v1", JSON.stringify(map));
    } catch {
      // ignore
    }
  }, [chat?.messages, id]);

  const handleTextChange = (value: string) => {
    setText(value);

    if (socket && id) {
      if (value.trim() && !isTyping) {
        setIsTyping(true);
        socket.emit("typing", id);
      } else if (!value.trim() && isTyping) {
        setIsTyping(false);
        socket.emit("stop-typing", id);
      }

      // Clear typing timeout and set a new one
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socket.emit("stop-typing", id);
      }, 1500);
    }
  };

  const sendMessage = async (content: string, type: "text" | "quick-reply" = "text") => {
    if (!content.trim()) return;
    setSendingMsg(true);
    setIsTyping(false);
    if (socket && id) socket.emit("stop-typing", id);

    const tempMessage = {
      _id: `temp-${Date.now()}`,
      sender: user,
      type,
      content,
      createdAt: new Date().toISOString(),
    };

    // Optimistically add message to UI
    setChat((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: [...prev.messages, tempMessage],
        lastMessageAt: tempMessage.createdAt,
      };
    });

    try {
      const result = await api<any>(`/chats/${id}/message`, { method: "POST", body: { content, type }, token });
      setText("");
      if (result?.message) {
        setChat((prev: any) => {
          if (!prev) return prev;
          // If socket already placed the real message (replacing or appending), just drop the temp
          const alreadyReal = prev.messages.some((m: { _id: string }) => m._id === result.message._id);
          if (alreadyReal) {
            return { ...prev, messages: prev.messages.filter((m: { _id: string }) => m._id !== tempMessage._id) };
          }
          return {
            ...prev,
            messages: prev.messages.map((m: { _id: string }) => (m._id === tempMessage._id ? result.message : m)),
          };
        });
      }
    } catch (err: unknown) {
      // Remove optimistic message on error
      setChat((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.filter((m: any) => m._id !== tempMessage._id),
        };
      });
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSendingMsg(false);
    }
  };

  const sendPhoto = async (file: File) => {
    if (!token) { toast.error("Sign in required"); return; }
    setUploadingPhoto(true);
    try {
      const url = await uploadImage(file, token);

      // Optimistically add photo message
      const tempMessage = {
        _id: `temp-${Date.now()}`,
        sender: user,
        type: "image",
        content: "Photo",
        imageUrl: url,
        createdAt: new Date().toISOString(),
      };

      setChat((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, tempMessage],
          lastMessageAt: tempMessage.createdAt,
        };
      });

      const photoResult = await api<any>(`/chats/${id}/message`, {
        method: "POST",
        body: { content: "Photo", type: "image", imageUrl: url },
        token,
      });
      if (photoResult?.message) {
        setChat((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: prev.messages.map((m: any) =>
              m._id === tempMessage._id ? photoResult.message : m
            ),
          };
        });
      }
      toast.success("Photo sent!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send photo");
      // Fetch to remove optimistic message on error
      await fetchChat();
    } finally {
      setUploadingPhoto(false);
    }
  };

  const startNegotiation = async () => {
    try {
      await api<any>(`/chats/${id}/negotiate`, { method: "POST", token });
      setShowNegotiatePrompt(false);
      toast.success("Negotiation started! You have 3 bargaining cards.");
      await fetchChat();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to start negotiation");
    }
  };

  const submitOffer = async () => {
    const amount = Number(offerAmount);
    if (!amount || amount <= 0) { toast.error("Enter a valid offer amount"); return; }
    const listingPrice = chat?.listing?.price;
    if (listingPrice && amount >= listingPrice) {
      toast.error(`Offer must be below asking price ₹${listingPrice.toLocaleString("en-IN")}.`);
      return;
    }
    // After a rejection the next offer must be higher than the last rejected one
    const lastOffer = neg?.offers?.[neg.offers.length - 1];
    if (lastOffer?.status === "rejected" && amount <= lastOffer.amount) {
      toast.error(`Seller rejected ₹${lastOffer.amount.toLocaleString("en-IN")}. Offer more than that.`);
      return;
    }
    try {
      await api<any>(`/chats/${id}/offer`, { method: "POST", body: { amount }, token });
      setOfferAmount("");
      await fetchChat();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to submit offer");
    }
  };

  const respondToOffer = async (accepted: boolean) => {
    try {
      await api<any>(`/chats/${id}/respond`, { method: "POST", body: { accepted }, token });
      if (accepted) toast.success("Deal accepted.");
      await fetchChat();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to respond");
    }
  };

  const createTransaction = async () => {
    try {
      const data = await api<any>("/transactions", { method: "POST", body: { chatId: id }, token });
      setTransactionId(data.transaction._id);
      toast.success("Transaction created! Proceed to payment.");
      router.push(`/transactions/${data.transaction._id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create transaction");
    }
  };

  // Show skeleton while auth or chat is loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-transparent">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
          <div className="h-12 bg-[var(--surface-alt)] rounded-md animate-shimmer border-2 border-[#1D3557]" />
          <div className="h-96 bg-[var(--surface-alt)] rounded-md animate-shimmer border-2 border-[#1D3557]" />
        </div>
      </div>
    );
  }

  if (!chat) return null;

  const other = role === "buyer" ? chat.seller : chat.buyer;
  const neg = chat.negotiation;
  const isNegActive = chat.isNegotiationActive;
  const lastOffer = neg?.offers?.[neg.offers.length - 1];
  const hasPendingOffer = lastOffer?.status === "pending";
  const cardsRemaining = neg ? neg.maxRounds - neg.offers.length : 3;
  const listingPrice = chat.listing?.price;
  const isGeneralChat = chat.chatType === "general" || !chat.listing;

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <Navbar />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label="Take or choose a photo to send"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) sendPhoto(file);
          e.target.value = "";
        }}
      />

      <div className="flex-1 max-w-2xl w-full mx-auto px-4 py-4 flex flex-col gap-3">

        {/* Header */}
        <div className="flex items-center gap-3 bg-[var(--surface)] border-2 border-[#1D3557] rounded-md p-3 shadow-[3px_3px_0px_0px_#1D3557]">
          <Link href="/chats">
            <Button type="button" variant="outline" size="icon-sm" aria-label="Back to chats">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="w-9 h-9 rounded-md bg-[#F9C74F] border-2 border-[#1D3557] overflow-hidden shrink-0">
            {other.avatarUrl
              ? <img src={other.avatarUrl} alt={other.displayName} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center font-black text-sm">{other.displayName[0]?.toUpperCase()}</div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="font-black text-sm truncate cursor-help"
              title={other.showRealIdentity && other.realName ? other.realName : "Identity hidden"}
            >
              {other.displayName}
            </div>
            {!isGeneralChat && (
              <div className="text-xs text-[#1D3557] font-medium truncate">{chat.listing?.title}</div>
            )}
            {isGeneralChat && (
              <div className="text-xs text-[#1D3557]/60 font-medium truncate">Direct message</div>
            )}
          </div>
          {!isGeneralChat && (
            <div className="text-right shrink-0">
              <div className="text-sm font-black text-[#1D3557]">₹{listingPrice?.toLocaleString("en-IN")}</div>
              {chat.mode === "negotiation" && (
                <span className="text-[10px] font-black bg-[#F9C74F] border border-[#1D3557] px-1.5 py-0.5 rounded-sm">
                  NEGOTIATING
                </span>
              )}
            </div>
          )}
        </div>

        {/* Info banner */}
        {showInfoBanner && !isGeneralChat && (
          <div className="flex items-start gap-2 bg-[#F9C74F] border-2 border-[#1D3557] rounded-md p-3 shadow-[3px_3px_0px_0px_#1D3557]">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs font-bold">
              <span className="font-black">You&apos;re chatting with the {role === "buyer" ? "seller" : "buyer"}.</span>{" "}
              {role === "buyer"
                ? "Ask questions, share photos of damage concerns, then use bargaining cards to negotiate the price down."
                : "Answer questions, share photos of the item, and respond to offers. Accepting an offer locks the deal."
              }
            </div>
            <button type="button" aria-label="Dismiss info banner" onClick={() => setShowInfoBanner(false)} className="text-[#1D3557] hover:text-[#1D3557] shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Negotiation status */}
        {!isGeneralChat && chat.mode === "negotiation" && neg && (
          <div className={`border-2 border-[#1D3557] rounded-md p-3 shadow-[3px_3px_0px_0px_#1D3557] ${
            neg.outcome === "accepted" ? "bg-[#D8E2DC]" :
            neg.outcome === "rejected" ? "bg-[#D8E2DC]" : "bg-[#F9C74F]"
          }`}>
            {neg.outcome === "accepted" ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-black">
                  <CheckCircle className="w-5 h-5" />
                  Deal at ₹{neg.agreedPrice?.toLocaleString("en-IN")}
                </div>
                <p className="text-xs font-bold">
                  {role === "buyer"
                    ? "Tap below to confirm and pay — this reserves the item for you."
                    : "Waiting for buyer to confirm payment."}
                </p>
                {role === "buyer" && !transactionId && (
                  <Button type="button" size="sm" onClick={createTransaction} className="gap-1.5 font-black">
                    <CreditCard className="w-3.5 h-3.5" /> Confirm &amp; Pay
                  </Button>
                )}
                {transactionId && (
                  <Button type="button" size="sm" variant="outline" onClick={() => router.push(`/transactions/${transactionId}`)} className="gap-1.5 font-black">
                    <CreditCard className="w-3.5 h-3.5" /> Open Transaction
                  </Button>
                )}
              </div>
            ) : neg.outcome === "rejected" ? (
              <div className="flex items-center gap-2 font-black text-[#1D3557]">
                <XCircle className="w-5 h-5" />
                All 3 cards used — negotiation closed.
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase">Bargaining in Progress</span>
                  <span className="text-xs font-black">{cardsRemaining}/3 cards left</span>
                </div>
                <div className="flex gap-1.5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className={`flex-1 h-2.5 rounded-sm border border-[#1D3557] ${i < cardsRemaining ? "bg-[#A8DADC]" : "bg-[#F1FAEE]/60"}`} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-0 max-h-[45vh] pr-1">
          {chat.messages.map((msg: any) => {
            const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
            const isSystem = msg.type === "system";
            if (isSystem) {
              return (
                <div key={msg._id} className="flex justify-center">
                  <span className="text-xs font-bold bg-[var(--surface-alt)] border border-[#1D3557] px-3 py-1 rounded-sm text-[#1D3557]">
                    {msg.content}
                  </span>
                </div>
              );
            }
            if (msg.type === "image" && msg.imageUrl) {
              return (
                <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <button
                    type="button"
                    onClick={() => setLightboxSrc(msg.imageUrl)}
                    className="rounded-md border-2 border-[#1D3557] overflow-hidden shadow-[2px_2px_0px_0px_#1D3557] max-w-[60%] cursor-zoom-in hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                    aria-label="Open photo"
                  >
                    <img src={msg.imageUrl} alt="Shared photo" className="w-full max-h-48 object-cover" loading="lazy" />
                    <div className={`text-[10px] font-bold px-2 py-1 text-left ${isMe ? "bg-[#2A9D8F] text-[#F1FAEE]" : "bg-[var(--surface-alt)] text-[#1D3557]"}`}>
                      Photo · tap to view
                    </div>
                  </button>
                </div>
              );
            }
            return (
              <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-md px-3 py-2 text-sm font-medium border-2 border-[#1D3557]
                  [overflow-wrap:anywhere] [word-break:break-word] whitespace-pre-wrap
                  ${msg.type === "offer"
                    ? "bg-[#F9C74F] text-[#1D3557] font-black"
                    : isMe
                      ? "bg-[#2A9D8F] text-[#F1FAEE]"
                      : "bg-[var(--surface)] text-[#1D3557]"
                  }`}
                >
                  {msg.type === "offer" && <div className="text-[10px] font-black uppercase mb-0.5">Bargain Offer</div>}
                  {msg.content}
                </div>
              </div>
            );
          })}
          {otherUserTyping && (
            <div className="flex justify-start">
              <div className="text-xs font-bold text-[#1D3557] italic py-1 px-2">
                {other.displayName} is typing…
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Seller: pending offer response */}
        {!isGeneralChat && role === "seller" && isNegActive && hasPendingOffer && (
          <div className="bg-[#F9C74F] border-2 border-[#1D3557] rounded-md p-3 shadow-[3px_3px_0px_0px_#1D3557] space-y-2">
            <div className="text-sm font-black">
              Buyer offers ₹{lastOffer.amount.toLocaleString("en-IN")} (Card {lastOffer.round}/3)
            </div>
            <p className="text-xs font-bold text-[#1D3557]">
              Original price: ₹{listingPrice?.toLocaleString("en-IN")} — discount: ₹{(listingPrice - lastOffer.amount).toLocaleString("en-IN")}
            </p>
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={() => respondToOffer(true)} className="flex-1 bg-[#2A9D8F] text-[#F1FAEE] border-[#1D3557] hover:bg-[#21867A] gap-1 font-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[3px_3px_0px_0px_#1D3557]">
                <CheckCircle className="w-4 h-4" /> Accept Deal
              </Button>
              <Button type="button" size="sm" onClick={() => respondToOffer(false)} className="flex-1 bg-[#E63946] text-[#F1FAEE] border-[#1D3557] hover:bg-[#C92D39] gap-1 font-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[3px_3px_0px_0px_#1D3557]">
                <XCircle className="w-4 h-4" /> Reject
              </Button>
            </div>
          </div>
        )}

        {/* Buyer: negotiation actions */}
        {!isGeneralChat && role === "buyer" && chat.status === "active" && (
          <>
            {chat.mode === "normal" && !showNegotiatePrompt && (
              <button type="button" onClick={() => setShowNegotiatePrompt(true)} className="text-xs font-black text-[#1D3557] hover:underline flex items-center gap-1 w-fit">
                <Zap className="w-3 h-3" /> Use bargaining cards to negotiate price
              </button>
            )}
            {showNegotiatePrompt && (
              <div className="bg-[var(--surface)] border-2 border-[#1D3557] rounded-md p-3 shadow-[3px_3px_0px_0px_#1D3557] space-y-2">
                <div className="font-black text-sm">Start Bargaining?</div>
                <p className="text-xs font-medium text-[#1D3557]">
                  You get <strong>3 bargaining cards</strong>. Each card = one offer. Your offers must go <strong>lower</strong> than the asking price (₹{listingPrice?.toLocaleString("en-IN")}). Seller can accept or reject each one.
                </p>
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={startNegotiation} className="font-black">Start!</Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setShowNegotiatePrompt(false)}>Cancel</Button>
                </div>
              </div>
            )}
            {isNegActive && !hasPendingOffer && (
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder={
                    lastOffer?.status === "rejected"
                      ? `More than ₹${lastOffer.amount.toLocaleString("en-IN")}, below ₹${listingPrice?.toLocaleString("en-IN") ?? "asking"}`
                      : `Offer below ₹${listingPrice?.toLocaleString("en-IN") ?? "asking price"}`
                  }
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  className="flex-1"
                  min={lastOffer?.status === "rejected" ? lastOffer.amount + 1 : 1}
                  max={listingPrice ? listingPrice - 1 : undefined}
                  aria-label="Offer amount"
                />
                <Button type="button" onClick={submitOffer} disabled={cardsRemaining === 0} className="shrink-0 font-black gap-1">
                  Play Card ({cardsRemaining} left)
                </Button>
              </div>
            )}
          </>
        )}

        {/* Quick replies */}
        {chat.status === "active" && quickReplies.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {quickReplies.map((qr: string) => (
              <button
                key={qr}
                type="button"
                onClick={() => sendMessage(qr, "quick-reply")}
                className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-sm border-2 border-[#1D3557] bg-[var(--surface-alt)] hover:bg-[#F9C74F] transition-colors whitespace-nowrap shadow-[2px_2px_0px_0px_#1D3557] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
              >
                {qr}
              </button>
            ))}
          </div>
        )}

        {/* Text + Camera input row */}
        {chat.status === "active" && (
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(text); }} className="flex gap-2">
            <button
              type="button"
              title="Send a photo"
              aria-label="Send a photo"
              onClick={() => cameraInputRef.current?.click()}
              disabled={uploadingPhoto || sendingMsg}
              className="shrink-0 w-10 h-10 flex items-center justify-center border-2 border-[#1D3557] rounded-md bg-[var(--surface-alt)] hover:bg-[#F9C74F] shadow-[2px_2px_0px_0px_#1D3557] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50"
            >
              {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
            <Input
              placeholder="Type a message…"
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              className="flex-1"
              disabled={sendingMsg || uploadingPhoto}
              aria-label="Message text"
            />
            <Button type="submit" disabled={!text.trim() || sendingMsg || uploadingPhoto} className="shrink-0" aria-label="Send message">
              {sendingMsg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        )}

        {chat.status !== "active" && chat.negotiation?.outcome !== "accepted" && (
          <div className="text-center text-sm font-black text-[#1D3557] py-2 border-2 border-[#1D3557] rounded-md bg-[var(--surface)]">
            This chat is closed.
          </div>
        )}
      </div>
      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}
