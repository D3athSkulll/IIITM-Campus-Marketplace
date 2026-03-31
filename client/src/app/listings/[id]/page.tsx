"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  MessageCircle,
  ExternalLink,
  ArrowLeft,
  Star,
  Eye,
  Heart,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const CONDITION_LABELS: Record<string, { label: string; color: string }> = {
  "like-new": { label: "Like New", color: "bg-green-100 text-green-800" },
  good: { label: "Good", color: "bg-blue-100 text-blue-800" },
  fair: { label: "Fair", color: "bg-yellow-100 text-yellow-800" },
  poor: { label: "Poor", color: "bg-red-100 text-red-800" },
};

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, token } = useAuth();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imageIdx, setImageIdx] = useState(0);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const data = await api<any>(`/listings/${id}`);
        setListing(data.listing);
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
    if (!user) {
      toast.error("Sign in to chat with the seller");
      router.push("/login");
      return;
    }
    setChatLoading(true);
    try {
      const data = await api<any>("/chats", {
        method: "POST",
        body: { listingId: id },
        token,
      });
      router.push(`/chats/${data.chat._id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to start chat");
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-80 bg-muted rounded-2xl" />
            <div className="h-6 bg-muted rounded w-2/3" />
            <div className="h-4 bg-muted rounded w-1/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) return null;

  const auctionSuggested = Boolean(listing.shouldSuggestAuction && user?._id === listing.seller._id);
  const isSeller = user?._id === listing.seller._id;
  const cond = CONDITION_LABELS[listing.condition] || { label: listing.condition, color: "bg-gray-100 text-gray-700" };
  const sellerInitials = listing.seller.displayName
    .split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to listings
        </Link>

        {/* Auction suggestion banner */}
        {auctionSuggested && (
          <div className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <Zap className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="flex-1 text-sm">
              <span className="font-semibold text-amber-800">High interest detected!</span>{" "}
              <span className="text-amber-700">3+ buyers want this. Consider enabling Auction Mode for maximum price.</span>
            </div>
            <Link href={`/listings/${id}/auction`}>
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white shrink-0">
                Enable Auction
              </Button>
            </Link>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image gallery */}
          <div className="space-y-3">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
              {listing.images[imageIdx] ? (
                <img
                  src={listing.images[imageIdx]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl text-muted-foreground/30">📦</div>
              )}
              {listing.images.length > 1 && (
                <>
                  <button
                    onClick={() => setImageIdx((i) => (i - 1 + listing.images.length) % listing.images.length)}
                    aria-label="Previous image"
                    title="Previous image"
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setImageIdx((i) => (i + 1) % listing.images.length)}
                    aria-label="Next image"
                    title="Next image"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {listing.images.map((_: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setImageIdx(i)}
                    aria-label={`Go to image ${i + 1}`}
                    title={`Go to image ${i + 1}`}
                    className={`w-2 h-2 rounded-full transition-colors ${i === imageIdx ? "bg-white" : "bg-white/50"}`}
                  />
                ))}
              </div>
            </div>
            {listing.images.length > 1 && (
              <div className="flex gap-2">
                {listing.images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setImageIdx(i)}
                    aria-label={`Select image ${i + 1}`}
                    title={`Select image ${i + 1}`}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === imageIdx ? "border-[var(--navy)]" : "border-transparent"}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${cond.color}`}>
                  {cond.label}
                </span>
                {listing.auctionMode && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[var(--gold)] text-[var(--navy-dark)]">
                    🔨 Auction
                  </span>
                )}
                <Badge variant="outline" className="text-xs capitalize">{listing.category}</Badge>
              </div>
              <h1 className="text-2xl font-bold text-foreground leading-tight">{listing.title}</h1>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-[var(--navy)]">₹{listing.price.toLocaleString()}</span>
                {listing.auctionMode && listing.auctionDeposit && (
                  <span className="text-sm text-muted-foreground">Deposit: ₹{listing.auctionDeposit}</span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {listing.viewCount} views</span>
              <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> {listing.interestCount} interested</span>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">Description</h3>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{listing.description}</p>
            </div>

            {/* Price reference */}
            {listing.priceReferenceLink && (
              <a
                href={listing.priceReferenceLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                Compare price online
              </a>
            )}

            <Separator />

            {/* Seller info */}
            <Card className="bg-muted/40">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-[var(--navy)] text-white text-sm">{sellerInitials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{listing.seller.displayName}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {listing.seller.hostelBlock && <span>{listing.seller.hostelBlock}</span>}
                      {listing.seller.isRatingVisible && listing.seller.averageRating && (
                        <span className="flex items-center gap-0.5 text-amber-600 font-medium">
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
              </CardContent>
            </Card>

            {/* CTA */}
            {listing.status === "active" ? (
              isSeller ? (
                <div className="flex gap-2">
                  <Link href={`/listings/${id}/edit`} className="flex-1">
                    <Button variant="outline" className="w-full">Edit Listing</Button>
                  </Link>
                </div>
              ) : (
                <Button
                  onClick={handleStartChat}
                  disabled={chatLoading}
                  className="w-full bg-[var(--navy)] hover:bg-[var(--navy-dark)] text-white gap-2 py-6 text-base"
                >
                  <MessageCircle className="w-5 h-5" />
                  {chatLoading ? "Starting chat…" : "Chat with Seller"}
                </Button>
              )
            ) : (
              <div className="w-full py-3 text-center rounded-xl bg-muted text-muted-foreground font-medium capitalize">
                This listing is {listing.status}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
