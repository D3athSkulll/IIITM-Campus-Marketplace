"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  ExternalLink,
  ArrowLeft,
  Star,
  Heart,
  Zap,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Package,
  Gavel,
  Repeat2,
  Flame,
  Trash2,
  Send,
  MessageSquare,
  X,
} from "lucide-react";

const CONDITION_CONFIG: Record<string, { label: string; bg: string; border: string; text: string }> = {
  "like-new": { label: "Like New", bg: "bg-[#A8DADC]", border: "border-[#1D3557]", text: "text-[#1D3557]" },
  good: { label: "Good", bg: "bg-[#D8E2DC]", border: "border-[#1D3557]", text: "text-[#1D3557]" },
  fair: { label: "Fair", bg: "bg-[#F9C74F]", border: "border-[#1D3557]", text: "text-[#1D3557]" },
  poor: { label: "Poor", bg: "bg-[#E63946]", border: "border-[#1D3557]", text: "text-[#F1FAEE]" },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function renderMentions(content: string) {
  const parts = content.split(/(@[\w-]+)/g);
  return parts.map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} className="font-black text-[#2A9D8F]">{part}</span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, token } = useAuth();

  // Listing state
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imageIdx, setImageIdx] = useState(0);

  // Interaction state
  const [chatLoading, setChatLoading] = useState(false);
  const [interested, setInterested] = useState(false);
  const [interestCount, setInterestCount] = useState(0);
  const [interestLoading, setInterestLoading] = useState(false);
  const [requestedAuction, setRequestedAuction] = useState(false);
  const [requestingAuction, setRequestingAuction] = useState(false);
  const [withdrawingAuction, setWithdrawingAuction] = useState(false);

  // Comments state
  const [comments, setComments] = useState<any[]>([]);
  const [commentTotal, setCommentTotal] = useState(0);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [deletingComment, setDeletingComment] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<any[]>([]);
  const mentionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const data = await api<any>(`/listings/${id}`, token ? { token } : undefined);
        setListing(data.listing);
        setInterestCount(data.listing.interestCount ?? 0);
        setInterested(data.listing.isInterested ?? false);
        setRequestedAuction(data.listing.hasRequestedAuction ?? false);
      } catch {
        toast.error("Listing not found");
        router.push("/");
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id, token, router]);

  const fetchComments = useCallback(async () => {
    setCommentLoading(true);
    try {
      const data = await api<any>(`/listings/${id}/comments`, token ? { token } : undefined);
      setComments(data.comments);
      setCommentTotal(data.total);
    } catch {
      // silent — comments are non-critical
    } finally {
      setCommentLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleStartChat = async () => {
    if (!user) { toast.error("Sign in to chat with the seller"); router.push("/login"); return; }
    setChatLoading(true);
    try {
      const data = await api<any>("/chats", { method: "POST", body: { listingId: id }, token });
      router.push(`/chats/${data.chat._id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to start chat");
    } finally {
      setChatLoading(false);
    }
  };

  const handleInterest = async () => {
    if (!user) { toast.error("Sign in to mark interest"); router.push("/login"); return; }
    setInterestLoading(true);
    try {
      const data = await api<any>(`/listings/${id}/interest`, { method: "POST", token });
      setInterested(data.interested);
      setInterestCount(data.interestCount);
      toast.success(data.interested ? "Marked as interested!" : "Removed interest");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setInterestLoading(false);
    }
  };

  const handleAuctionRequest = async () => {
    if (!user) { toast.error("Sign in to request auction mode"); router.push("/login"); return; }
    setRequestingAuction(true);
    try {
      const data = await api<any>(`/listings/${id}/auction-request`, { method: "POST", token });
      setRequestedAuction(true);
      setInterestCount(data.interestCount ?? interestCount);
      setInterested(true);
      setListing((prev: any) => {
        if (!prev) return prev;
        return { ...prev, shouldSuggestAuction: data.shouldSuggestAuction, manualAuctionRequestCount: data.manualAuctionRequestCount, hasRequestedAuction: true };
      });
      toast.success(data.message || "Auction request sent to seller");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to request auction mode");
    } finally {
      setRequestingAuction(false);
    }
  };

  const handleWithdrawAuction = async () => {
    if (!user) return;
    setWithdrawingAuction(true);
    try {
      const data = await api<any>(`/listings/${id}/auction-request`, { method: "DELETE", token });
      setRequestedAuction(false);
      setListing((prev: any) => {
        if (!prev) return prev;
        return { ...prev, shouldSuggestAuction: data.shouldSuggestAuction, manualAuctionRequestCount: data.manualAuctionRequestCount, hasRequestedAuction: false };
      });
      toast.success("Auction request withdrawn");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to withdraw request");
    } finally {
      setWithdrawingAuction(false);
    }
  };

  const handleCommentInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCommentText(val);

    const cursor = e.target.selectionStart ?? val.length;
    const before = val.slice(0, cursor);
    const match = before.match(/@([\w-]*)$/);

    if (match && match[1].length >= 1) {
      const q = match[1];
      if (mentionTimerRef.current) clearTimeout(mentionTimerRef.current);
      mentionTimerRef.current = setTimeout(async () => {
        try {
          const data = await api<any>(`/users/search?q=${encodeURIComponent(q)}`, token ? { token } : undefined);
          setMentionResults(data.users || []);
        } catch {
          setMentionResults([]);
        }
      }, 200);
    } else {
      setMentionResults([]);
    }
  };

  const handleSelectMention = (nickname: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const cursor = ta.selectionStart ?? commentText.length;
    const before = commentText.slice(0, cursor);
    const after = commentText.slice(cursor);
    const replaced = before.replace(/@([\w-]*)$/, `@${nickname} `);
    setCommentText(replaced + after);
    setMentionResults([]);
    ta.focus();
  };

  const handlePostComment = async () => {
    if (!user) { toast.error("Sign in to comment"); router.push("/login"); return; }
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      await api(`/listings/${id}/comments`, { method: "POST", body: { content: commentText.trim() }, token });
      setCommentText("");
      setMentionResults([]);
      await fetchComments();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setDeletingComment(commentId);
    try {
      await api(`/listings/${id}/comments/${commentId}`, { method: "DELETE", token });
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      setCommentTotal((prev) => Math.max(0, prev - 1));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete comment");
    } finally {
      setDeletingComment(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
          <div className="h-80 rounded-md border-2 border-[#1D3557] bg-[var(--surface-alt)] animate-shimmer" />
          <div className="h-6 rounded-md bg-[var(--surface-alt)] animate-shimmer w-2/3" />
          <div className="h-4 rounded-md bg-[var(--surface-alt)] animate-shimmer w-1/4" />
        </div>
      </div>
    );
  }

  if (!listing) return null;

  const auctionSuggested = Boolean(listing.shouldSuggestAuction && user?._id === listing.seller._id);
  const manualAuctionRequestCount = Number(listing.manualAuctionRequestCount || 0);
  const isSeller = user?._id === listing.seller._id;
  const cond = CONDITION_CONFIG[listing.condition] || { label: listing.condition, bg: "bg-[var(--surface-soft)]", border: "border-[#1D3557]", text: "text-[#1D3557]" };
  const sellerAvatar = listing.seller.avatarUrl || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(listing.seller.displayName)}&backgroundColor=1D3557`;
  const isRental = listing.listingType === "rent";

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Link href="/" className="inline-flex items-center gap-1 text-sm font-bold text-[#1D3557] hover:text-[#1D3557] mb-5">
          <ArrowLeft className="w-4 h-4" /> Back to listings
        </Link>

        {/* Auction suggestion banner */}
        {auctionSuggested && (
          <div className="mb-4 flex items-center gap-3 border-2 border-[#F3722C] bg-[var(--surface)] rounded-md px-4 py-3 shadow-[4px_4px_0px_0px_#F3722C]">
            <Zap className="w-5 h-5 text-[#1D3557] shrink-0" />
            <div className="flex-1 text-sm">
              <span className="font-black text-[#1D3557]">High interest detected!</span>{" "}
              <span className="text-[#1D3557] font-medium">
                {manualAuctionRequestCount > 0
                  ? `${manualAuctionRequestCount} buyer${manualAuctionRequestCount > 1 ? "s have" : " has"} requested auction mode.`
                  : "2+ buyers want this. Switch to Auction Mode to get the best price."}
              </span>
            </div>
            <Link href={`/listings/${id}/auction`}>
              <Button size="sm" className="font-black shrink-0">Enable Auction</Button>
            </Link>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Image gallery */}
          <div className="space-y-3">
            <div className="relative aspect-square rounded-md overflow-hidden border-2 border-[#1D3557] shadow-[4px_4px_0px_0px_#1D3557] bg-[var(--surface-alt)]">
              {listing.images[imageIdx] ? (
                <img src={listing.images[imageIdx]} alt={listing.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Package className="w-12 h-12 opacity-30" /></div>
              )}
              {listing.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setImageIdx((i) => (i - 1 + listing.images.length) % listing.images.length)}
                    aria-label="Previous image"
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md border-2 border-[#1D3557] bg-[var(--surface-alt)] flex items-center justify-center shadow-[2px_2px_0px_0px_#1D3557] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageIdx((i) => (i + 1) % listing.images.length)}
                    aria-label="Next image"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md border-2 border-[#1D3557] bg-[var(--surface-alt)] flex items-center justify-center shadow-[2px_2px_0px_0px_#1D3557] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
              {listing.images.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {listing.images.map((_: string, i: number) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setImageIdx(i)}
                      aria-label={`Go to image ${i + 1}`}
                      className={`w-2 h-2 rounded-full border border-[#1D3557] transition-colors ${i === imageIdx ? "bg-[#F9C74F]" : "bg-[var(--surface)]/70"}`}
                    />
                  ))}
                </div>
              )}
            </div>
            {listing.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {listing.images.map((img: string, i: number) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setImageIdx(i)}
                    aria-label={`Select image ${i + 1}`}
                    className={`shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                      i === imageIdx ? "border-[#F3722C] shadow-[2px_2px_0px_0px_#1D3557]" : "border-[#2A9D8F] opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details panel */}
          <div className="space-y-4">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-1 border-2 ${cond.border} ${cond.bg} ${cond.text} rounded-sm`}>
                {cond.label}
              </span>
              {isRental && (
                <span className="text-[10px] font-black uppercase tracking-wide px-2 py-1 border-2 border-[#2A9D8F] bg-[#A8DADC] text-[#1D3557] rounded-sm">
                  <span className="inline-flex items-center gap-1"><Repeat2 className="w-3 h-3" />Rent</span>
                </span>
              )}
              {listing.auctionMode && (
                <span className="text-[10px] font-black uppercase tracking-wide px-2 py-1 border-2 border-[#1D3557] bg-[#F9C74F] text-[#1D3557] rounded-sm">
                  <span className="inline-flex items-center gap-1"><Gavel className="w-3 h-3" />Auction</span>
                </span>
              )}
              <span className="text-[10px] font-black uppercase tracking-wide px-2 py-1 border-2 border-[#2A9D8F] bg-[var(--surface-alt)] text-[#1D3557] rounded-sm capitalize">
                {listing.category}
              </span>
            </div>

            <h1 className="text-2xl font-black leading-tight">{listing.title}</h1>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#1D3557]">₹{listing.price.toLocaleString()}</span>
              {listing.auctionMode && listing.auctionDeposit && (
                <span className="text-sm font-medium text-[#1D3557]">Deposit: ₹{listing.auctionDeposit}</span>
              )}
              {listing.auctionMode && listing.auctionHighestBid && (
                <span className="text-sm font-black text-[#1D3557]">Top bid: ₹{Number(listing.auctionHighestBid).toLocaleString()}</span>
              )}
            </div>

            {/* Rental info */}
            {isRental && listing.rentalDetails && (
              <div className="border-2 border-[#2A9D8F] bg-[#A8DADC] rounded-md p-3 space-y-1 shadow-[3px_3px_0px_0px_#2A9D8F]">
                <div className="flex items-center gap-1.5 text-xs font-black text-[#1D3557] mb-2">
                  <Calendar className="w-3.5 h-3.5" /> Rental Details
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-bold">
                  <span className="text-[#1D3557]">Per day:</span>
                  <span className="text-[#1D3557]">₹{listing.rentalDetails.pricePerDay}</span>
                  {listing.rentalDetails.depositAmount && (
                    <>
                      <span className="text-[#1D3557]">Deposit:</span>
                      <span className="text-[#1D3557]">₹{listing.rentalDetails.depositAmount}</span>
                    </>
                  )}
                  {listing.rentalDetails.maxRentalDays && (
                    <>
                      <span className="text-[#1D3557]">Max days:</span>
                      <span className="text-[#1D3557]">{listing.rentalDetails.maxRentalDays} days</span>
                    </>
                  )}
                  {listing.rentalDetails.availableFrom && (
                    <>
                      <span className="text-[#1D3557]">Available:</span>
                      <span className="text-[#1D3557]">
                        {new Date(listing.rentalDetails.availableFrom).toLocaleDateString()} to{" "}
                        {listing.rentalDetails.availableTo ? new Date(listing.rentalDetails.availableTo).toLocaleDateString() : "open"}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs font-bold text-[#1D3557]">
              {interestCount >= 2
                ? <span className="inline-flex items-center gap-1"><Flame className="w-3 h-3" />High demand. Seller may switch to auction.</span>
                : "Mark interest to notify the seller you want this."}
              {manualAuctionRequestCount > 0 && (
                <span className="inline-flex items-center gap-1"><Gavel className="w-3.5 h-3.5" />{manualAuctionRequestCount} auction request{manualAuctionRequestCount > 1 ? "s" : ""}</span>
              )}
              {listing.auctionMode && (
                <span className="inline-flex items-center gap-1"><Gavel className="w-3.5 h-3.5" />{listing.auctionBidCount || 0} bids by {listing.auctionUniqueBidderCount || 0} bidder{(listing.auctionUniqueBidderCount || 0) !== 1 ? "s" : ""}</span>
              )}
              <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {interestCount} interested</span>
            </div>

            {/* Description */}
            <div className="border-t-2 border-[#1D3557] pt-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#1D3557] mb-2">Description</h3>
              <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap text-[#1D3557]">{listing.description}</p>
            </div>

            {/* Price reference */}
            {listing.priceReferenceLink && (
              <a
                href={listing.priceReferenceLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-black text-[#1D3557] border-2 border-[#A8DADC] px-2 py-1 rounded-sm bg-[#A8DADC] hover:bg-[#F1FAEE] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Compare price online
              </a>
            )}

            {/* Seller card */}
            <div className="border-2 border-[#1D3557] rounded-md p-3 shadow-[3px_3px_0px_0px_#1D3557] bg-[var(--surface)] flex items-center gap-3">
              <div className="w-10 h-10 rounded-md border-2 border-[#1D3557] overflow-hidden bg-[var(--surface-alt)] shrink-0">
                <img src={sellerAvatar} alt="Seller" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-sm truncate">{listing.seller.displayName}</div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-[#1D3557] flex-wrap">
                  {listing.seller.hostelBlock && <span>{listing.seller.hostelBlock}</span>}
                  {listing.seller.isRatingVisible && listing.seller.averageRating && (
                    <span className="flex items-center gap-0.5 text-[#1D3557]">
                      <Star className="w-3 h-3 fill-[#F1FAEE] stroke-[#F1FAEE]" />
                      {listing.seller.averageRating}
                    </span>
                  )}
                  {listing.seller.totalTrades > 0 && (
                    <span>{listing.seller.totalTrades} trades</span>
                  )}
                </div>
              </div>
            </div>

            {/* CTAs */}
            {listing.status === "active" ? (
              isSeller ? (
                <div className="flex gap-2">
                  <Link href={`/listings/${id}/edit`} className="flex-1">
                    <Button variant="outline" className="w-full font-black">Edit Listing</Button>
                  </Link>
                  <Link href={`/listings/${id}/auction`}>
                    <Button variant="outline" className="font-black gap-1.5">
                      <Zap className="w-4 h-4" /> {listing.auctionMode ? "Manage Auction" : "Auction"}
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {listing.auctionMode && (
                    <Link href={`/listings/${id}/auction`} className="block">
                      <Button variant="outline" className="w-full font-black gap-2 py-6 text-base">
                        <Gavel className="w-5 h-5" /> Join Live Auction
                      </Button>
                    </Link>
                  )}
                  <Button
                    onClick={handleStartChat}
                    disabled={chatLoading}
                    className="w-full font-black gap-2 py-6 text-base"
                  >
                    <MessageCircle className="w-5 h-5" />
                    {chatLoading ? "Starting chat…" : "Chat with Seller"}
                  </Button>
                  <button
                    type="button"
                    onClick={handleInterest}
                    disabled={interestLoading}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border-2 border-[#1D3557] text-sm font-black transition-all
                      ${interested
                        ? "bg-[#F9C74F] text-[#1D3557] shadow-[3px_3px_0px_0px_#1D3557] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none"
                        : "bg-[var(--surface-alt)] text-[#1D3557] shadow-[3px_3px_0px_0px_#1D3557] hover:bg-[#F9C74F] hover:text-[#1D3557] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none"
                      }`}
                  >
                    <Heart className={`w-4 h-4 ${interested ? "fill-current" : ""}`} />
                    {interestLoading ? "Loading" : interested ? `Interested (${interestCount})` : `Mark Interest (${interestCount})`}
                  </button>

                  {/* Auction request / withdraw */}
                  {!listing.auctionMode && (
                    requestedAuction ? (
                      <div className="flex gap-2">
                        <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border-2 border-[#1D3557] text-sm font-black bg-[#A8DADC] text-[#1D3557] shadow-[3px_3px_0px_0px_#1D3557]">
                          <Gavel className="w-4 h-4" /> Auction Request Sent
                        </div>
                        <button
                          type="button"
                          onClick={handleWithdrawAuction}
                          disabled={withdrawingAuction}
                          title="Withdraw request"
                          className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-md border-2 border-[#E63946] bg-[var(--surface)] text-[#E63946] text-sm font-black shadow-[3px_3px_0px_0px_#E63946] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
                        >
                          <X className="w-4 h-4" />
                          {withdrawingAuction ? "..." : "Withdraw"}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleAuctionRequest}
                        disabled={requestingAuction}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border-2 border-[#1D3557] text-sm font-black transition-all bg-[var(--surface)] text-[#1D3557] shadow-[3px_3px_0px_0px_#1D3557] hover:bg-[#F9C74F] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none"
                      >
                        <Gavel className="w-4 h-4" />
                        {requestingAuction ? "Sending request..." : "Request Seller to Start Auction"}
                      </button>
                    )
                  )}

                  <p className="text-[10px] font-medium text-center text-[#1D3557]">
                    {requestedAuction
                      ? "Seller has been notified of your auction request."
                      : interestCount >= 2
                        ? "High demand. Seller may switch to auction."
                        : "Mark interest to notify the seller you want this."}
                  </p>
                </div>
              )
            ) : (
              <div className="w-full py-4 text-center rounded-md border-2 border-[#2A9D8F] bg-[var(--surface-alt)] text-[#1D3557] font-black capitalize">
                This listing is {listing.status}
              </div>
            )}
          </div>
        </div>

        {/* ─── Comments Section ─────────────────────────────────────────────────── */}
        <div className="mt-10 border-t-2 border-[#1D3557] pt-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-[#1D3557]" />
            <h2 className="text-lg font-black text-[#1D3557]">
              Comments{commentTotal > 0 ? ` (${commentTotal})` : ""}
            </h2>
          </div>

          {/* Comment input */}
          <div className="mb-6 border-2 border-[#1D3557] rounded-md bg-[var(--surface)] shadow-[4px_4px_0px_0px_#1D3557] overflow-visible">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={commentText}
                onChange={handleCommentInput}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handlePostComment();
                  }
                  if (e.key === "Escape") setMentionResults([]);
                }}
                placeholder={user ? "Write a comment… use @nickname to mention someone" : "Sign in to leave a comment"}
                disabled={!user}
                rows={3}
                className="w-full px-4 pt-3 pb-2 text-sm font-medium text-[#1D3557] bg-transparent resize-none focus:outline-none placeholder:text-[#1D3557]/50 disabled:opacity-50"
              />

              {/* @mention dropdown */}
              {mentionResults.length > 0 && (
                <div className="absolute left-2 top-full mt-1 z-30 w-64 border-2 border-[#1D3557] rounded-md bg-[var(--surface)] shadow-[4px_4px_0px_0px_#1D3557] overflow-hidden">
                  {mentionResults.map((u: any) => (
                    <button
                      key={u._id}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); handleSelectMention(u.anonymousNickname); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold text-[#1D3557] hover:bg-[#A8DADC] transition-colors text-left"
                    >
                      <img
                        src={u.avatarUrl || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(u.anonymousNickname)}`}
                        alt=""
                        className="w-6 h-6 rounded-sm border border-[#1D3557] object-cover"
                      />
                      <span>@{u.anonymousNickname}</span>
                      {u.showRealIdentity && u.displayName !== u.anonymousNickname && (
                        <span className="text-[10px] text-[#1D3557]/60 font-medium">({u.displayName})</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-4 pb-3">
              <span className="text-[10px] font-medium text-[#1D3557]/50">
                Ctrl+Enter to submit · @nickname to mention
              </span>
              <Button
                type="button"
                size="sm"
                onClick={handlePostComment}
                disabled={submittingComment || !commentText.trim() || !user}
                className="gap-1.5 font-black"
              >
                <Send className="w-3.5 h-3.5" />
                {submittingComment ? "Posting…" : "Post"}
              </Button>
            </div>
          </div>

          {/* Comments list */}
          {commentLoading && comments.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-md border-2 border-[#1D3557] bg-[var(--surface-alt)] animate-shimmer" />
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-[#1D3557] rounded-md bg-[var(--surface-alt)]">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-bold text-[#1D3557]">No comments yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment: any) => {
                const authorAvatar = comment.author.avatarUrl ||
                  `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(comment.author.displayName || comment.author.anonymousNickname)}&backgroundColor=1D3557`;
                const canDelete = user && (user._id === comment.author._id || (user as any).role === "admin");

                return (
                  <div
                    key={comment._id}
                    className="border-2 border-[#1D3557] rounded-md bg-[var(--surface)] shadow-[3px_3px_0px_0px_#1D3557] px-4 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-md border-2 border-[#1D3557] overflow-hidden bg-[var(--surface-alt)] shrink-0">
                        <img src={authorAvatar} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-[#1D3557]">
                            {comment.author.displayName || comment.author.anonymousNickname}
                          </span>
                          <span className="text-[10px] font-medium text-[#1D3557]/50">{timeAgo(comment.createdAt)}</span>
                        </div>
                        <p className="text-sm font-medium text-[#1D3557] mt-1 leading-relaxed whitespace-pre-wrap break-words">
                          {renderMentions(comment.content)}
                        </p>
                      </div>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(comment._id)}
                          disabled={deletingComment === comment._id}
                          className="shrink-0 p-1.5 rounded-md text-[#E63946] hover:bg-[#E63946]/10 transition-colors"
                          aria-label="Delete comment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
