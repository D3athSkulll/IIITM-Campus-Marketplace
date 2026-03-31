"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface Seller {
  _id: string;
  displayName: string;
  hostelBlock?: string;
  isRatingVisible?: boolean;
  averageRating?: number | null;
}

interface Listing {
  _id: string;
  title: string;
  price: number;
  condition: string;
  category: string;
  images: string[];
  interestCount: number;
  viewCount: number;
  shouldSuggestAuction?: boolean;
  auctionMode?: boolean;
  seller: Seller;
  createdAt: string;
}

const CONDITION_COLORS: Record<string, string> = {
  "like-new": "bg-green-100 text-green-800",
  good: "bg-blue-100 text-blue-800",
  fair: "bg-yellow-100 text-yellow-800",
  poor: "bg-red-100 text-red-800",
};

export default function ListingCard({ listing }: { listing: Listing }) {
  const conditionLabel = listing.condition.replace("-", " ");
  const timeAgo = getTimeAgo(listing.createdAt);

  return (
    <Link href={`/listings/${listing._id}`} className="group block">
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 border border-border hover:-translate-y-0.5">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {listing.images[0] ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--navy)] to-[var(--navy-light)]">
              <span className="text-4xl text-white/30">📦</span>
            </div>
          )}
          {/* Condition badge */}
          <span className={`absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${CONDITION_COLORS[listing.condition] || "bg-gray-100 text-gray-700"}`}>
            {conditionLabel}
          </span>
          {/* Auction badge */}
          {listing.auctionMode && (
            <span className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--gold)] text-[var(--navy-dark)]">
              🔨 Auction
            </span>
          )}
          {/* Hot badge */}
          {!listing.auctionMode && listing.shouldSuggestAuction && (
            <span className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white">
              🔥 Hot
            </span>
          )}
        </div>

        {/* Details */}
        <div className="p-3 space-y-1.5">
          <h3 className="font-semibold text-foreground line-clamp-2 text-sm leading-tight group-hover:text-[var(--navy)]">
            {listing.title}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-[var(--navy)]">₹{listing.price.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{listing.seller.displayName}</span>
            {listing.seller.hostelBlock && (
              <span className="bg-muted px-1.5 py-0.5 rounded text-xs">{listing.seller.hostelBlock}</span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
