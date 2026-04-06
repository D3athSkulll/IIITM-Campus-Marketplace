"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { MessageCircle, ExternalLink, ArrowLeft, Star, Eye, Heart, Zap, ChevronLeft, ChevronRight, Calendar, Package, Gavel, Repeat2, Flame } from "lucide-react";

const CONDITION_CONFIG: Record<string, { label: string; bg: string; border: string; text: string }> = {
  "like-new": { label: "Like New", bg: "bg-green-100", border: "border-green-600", text: "text-green-800" },
  good: { label: "Good", bg: "bg-blue-100", border: "border-blue-600", text: "text-blue-800" },
  fair: { label: "Fair", bg: "bg-yellow-100", border: "border-yellow-600", text: "text-yellow-800" },
  poor: { label: "Poor", bg: "bg-red-100", border: "border-red-600", text: "text-red-800" },
};

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, token } = useAuth();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imageIdx, setImageIdx] = useState(0);
  const [chatLoading, setChatLoading] = useState(false);
  const [interested, setInterested] = useState(false);
  const [interestCount, setInterestCount] = useState(0);
  const [interestLoading, setInterestLoading] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const data = await api<any>(`/listings/${id}`, token ? { token } : undefined);
        setListing(data.listing);
        setInterestCount(data.listing.interestCount ?? 0);
        setInterested(data.listing.isInterested ?? false);
      } catch {
        toast.error("Listing not found");
        router.push("/");
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
          <div className="h-80 rounded-md border-2 border-[#0a0a0a] bg-[#e8e8e8] animate-shimmer" />
          <div className="h-6 rounded-md bg-[#e8e8e8] animate-shimmer w-2/3" />
          <div className="h-4 rounded-md bg-[#e8e8e8] animate-shimmer w-1/4" />
        </div>
      </div>
    );
  }

  if (!listing) return null;

  const auctionSuggested = Boolean(listing.shouldSuggestAuction && user?._id === listing.seller._id);
  const isSeller = user?._id === listing.seller._id;
  const cond = CONDITION_CONFIG[listing.condition] || { label: listing.condition, bg: "bg-gray-100", border: "border-gray-400", text: "text-gray-700" };
  const sellerAvatar = listing.seller.avatarUrl || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(listing.seller.displayName)}&backgroundColor=0a1628`;
  const isRental = listing.listingType === "rent";

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Link href="/" className="inline-flex items-center gap-1 text-sm font-bold text-[#555] hover:text-[#0a0a0a] mb-5">
          <ArrowLeft className="w-4 h-4" /> Back to listings
        </Link>

        {/* Auction suggestion banner */}
        {auctionSuggested && (
          <div className="mb-4 flex items-center gap-3 border-2 border-[#f5c518] bg-[#fffbe6] rounded-md px-4 py-3 shadow-[4px_4px_0px_0px_#f5c518]">
            <Zap className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="flex-1 text-sm">
              <span className="font-black text-[#0a0a0a]">High interest detected!</span>{" "}
              <span className="text-[#555] font-medium">2+ buyers want this. Switch to Auction Mode to get the best price.</span>
            </div>
            <Link href={`/listings/${id}/auction`}>
              <Button size="sm" className="font-black shrink-0">Enable Auction</Button>
            </Link>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Image gallery */}
          <div className="space-y-3">
            <div className="relative aspect-square rounded-md overflow-hidden border-2 border-[#0a0a0a] shadow-[4px_4px_0px_0px_#0a0a0a] bg-[#e8e8e8]">
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
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md border-2 border-[#0a0a0a] bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_#0a0a0a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageIdx((i) => (i + 1) % listing.images.length)}
                    aria-label="Next image"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md border-2 border-[#0a0a0a] bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_#0a0a0a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
              {/* Dot indicators */}
              {listing.images.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {listing.images.map((_: string, i: number) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setImageIdx(i)}
                      aria-label={`Go to image ${i + 1}`}
                      className={`w-2 h-2 rounded-full border border-[#0a0a0a] transition-colors ${i === imageIdx ? "bg-[#f5c518]" : "bg-white/70"}`}
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
                      i === imageIdx ? "border-[#f5c518] shadow-[2px_2px_0px_0px_#0a0a0a]" : "border-[#ccc] opacity-70 hover:opacity-100"
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
                <span className="text-[10px] font-black uppercase tracking-wide px-2 py-1 border-2 border-purple-600 bg-purple-100 text-purple-800 rounded-sm">
                  <span className="inline-flex items-center gap-1"><Repeat2 className="w-3 h-3" />Rent</span>
                </span>
              )}
              {listing.auctionMode && (
                <span className="text-[10px] font-black uppercase tracking-wide px-2 py-1 border-2 border-[#0a0a0a] bg-[#f5c518] text-[#0a0a0a] rounded-sm">
                  <span className="inline-flex items-center gap-1"><Gavel className="w-3 h-3" />Auction</span>
                </span>
              )}
              <span className="text-[10px] font-black uppercase tracking-wide px-2 py-1 border-2 border-[#ccc] bg-[#f5f5f5] text-[#555] rounded-sm capitalize">
                {listing.category}
              </span>
            </div>

            <h1 className="text-2xl font-black leading-tight">{listing.title}</h1>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#0a1628]">₹{listing.price.toLocaleString()}</span>
              {listing.auctionMode && listing.auctionDeposit && (
                <span className="text-sm font-medium text-[#555]">Deposit: ₹{listing.auctionDeposit}</span>
              )}
            </div>

            {/* Rental info */}
            {isRental && listing.rentalDetails && (
              <div className="border-2 border-purple-500 bg-purple-50 rounded-md p-3 space-y-1 shadow-[3px_3px_0px_0px_#7c3aed]">
                <div className="flex items-center gap-1.5 text-xs font-black text-purple-700 mb-2">
                  <Calendar className="w-3.5 h-3.5" /> Rental Details
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-bold">
                  <span className="text-[#555]">Per day:</span>
                  <span className="text-purple-800">₹{listing.rentalDetails.pricePerDay}</span>
                  {listing.rentalDetails.depositAmount && (
                    <>
                      <span className="text-[#555]">Deposit:</span>
                      <span className="text-purple-800">₹{listing.rentalDetails.depositAmount}</span>
                    </>
                  )}
                  {listing.rentalDetails.maxRentalDays && (
                    <>
                      <span className="text-[#555]">Max days:</span>
                      <span className="text-purple-800">{listing.rentalDetails.maxRentalDays} days</span>
                    </>
                  )}
                  {listing.rentalDetails.availableFrom && (
                    <>
                      <span className="text-[#555]">Available:</span>
                      <span className="text-purple-800">
                        {new Date(listing.rentalDetails.availableFrom).toLocaleDateString()} to {" "}
                        {listing.rentalDetails.availableTo ? new Date(listing.rentalDetails.availableTo).toLocaleDateString() : "open"}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
                    {interestLoading ? "Loading" : interested ? `Interested (${interestCount})` : `Mark Interest (${interestCount})`}
            {/* Stats */}
            <div className="flex items-center gap-4 text-xs font-bold text-[#555]">
                    {interestCount >= 2
                      ? <span className="inline-flex items-center gap-1"><Flame className="w-3 h-3" />High demand. Seller may switch to auction.</span>
                      : "Mark interest to notify the seller you want this."}
              <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {interestCount} interested</span>
            </div>

            {/* Description */}
            <div className="border-t-2 border-[#f5f5f5] pt-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#888] mb-2">Description</h3>
              <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap text-[#333]">{listing.description}</p>
            </div>

            {/* Price reference */}
            {listing.priceReferenceLink && (
              <a
                href={listing.priceReferenceLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-black text-blue-700 border-2 border-blue-600 px-2 py-1 rounded-sm bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Compare price online
              </a>
            )}

            {/* Seller card */}
            <div className="border-2 border-[#0a0a0a] rounded-md p-3 shadow-[3px_3px_0px_0px_#0a0a0a] bg-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-md border-2 border-[#0a0a0a] overflow-hidden bg-[#e8e8e8] shrink-0">
                <img src={sellerAvatar} alt="Seller" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-sm truncate">{listing.seller.displayName}</div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-[#555] flex-wrap">
                  {listing.seller.hostelBlock && <span>{listing.seller.hostelBlock}</span>}
                  {listing.seller.isRatingVisible && listing.seller.averageRating && (
                    <span className="flex items-center gap-0.5 text-amber-600">
                      <Star className="w-3 h-3 fill-amber-500 stroke-amber-500" />
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
                  {!listing.auctionMode && (
                    <Link href={`/listings/${id}/auction`}>
                      <Button variant="outline" className="font-black gap-1.5">
                        <Zap className="w-4 h-4" /> Auction
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
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
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border-2 border-[#0a0a0a] text-sm font-black transition-all
                      ${interested
                        ? "bg-[#f5c518] text-[#0a0a0a] shadow-[3px_3px_0px_0px_#0a0a0a] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none"
                        : "bg-white text-[#555] shadow-[3px_3px_0px_0px_#0a0a0a] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none"
                      }`}
                  >
                    <Heart className={`w-4 h-4 ${interested ? "fill-current" : ""}`} />
                    {interestLoading ? "Loading" : interested ? `Interested (${interestCount})` : `Mark Interest (${interestCount})`}
                  </button>
                  <p className="text-[10px] font-medium text-center text-[#888]">
                    {interestCount >= 2 ? "High demand. Seller may switch to auction." : "Mark interest to notify the seller you want this."}
                  </p>
                </div>
              )
            ) : (
              <div className="w-full py-4 text-center rounded-md border-2 border-[#ccc] bg-[#f5f5f5] text-[#888] font-black capitalize">
                This listing is {listing.status}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
