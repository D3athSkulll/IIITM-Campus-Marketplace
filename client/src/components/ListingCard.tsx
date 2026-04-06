"use client";

import Link from "next/link";
import { Flame, Gavel, Package } from "lucide-react";

interface Seller {
  _id: string;
  displayName: string;
  hostelBlock?: string;
  isRatingVisible?: boolean;
  averageRating?: number | null;
  avatarUrl?: string;
}

interface Listing {
  _id: string;
  title: string;
  price: number;
  condition: string;
  category: string;
  listingType?: string;
  images: string[];
  interestCount: number;
  viewCount: number;
  shouldSuggestAuction?: boolean;
  auctionMode?: boolean;
  seller: Seller;
  createdAt: string;
}

const CONDITION_COLORS: Record<string, string> = {
  "like-new": "bg-green-400 text-[#0a0a0a]",
  good: "bg-blue-400 text-white",
  fair: "bg-yellow-400 text-[#0a0a0a]",
  poor: "bg-red-400 text-white",
};

export default function ListingCard({ listing }: { listing: Listing }) {
  const conditionLabel = listing.condition.replace("-", " ");
  const timeAgo = getTimeAgo(listing.createdAt);
  const isRent = listing.listingType === "rent";

  return (
    <Link href={`/listings/${listing._id}`} className="group block">
      {/* Neobrutalism card: bold border + hard shadow, lifts on hover */}
      <div className="bg-white border-2 border-[#0a0a0a] rounded-md shadow-[4px_4px_0px_0px_#0a0a0a] transition-all duration-150 group-hover:shadow-[6px_6px_0px_0px_#0a0a0a] group-hover:-translate-x-[1px] group-hover:-translate-y-[1px] overflow-hidden">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-[#e8e8e8] overflow-hidden border-b-2 border-[#0a0a0a]">
          {listing.images[0] ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#f5c518]">
              <Package className="w-10 h-10 text-[#0a0a0a]/60" />
            </div>
          )}

          {/* Condition badge — top left */}
          <span className={`absolute top-2 left-2 text-[10px] font-black px-1.5 py-0.5 rounded-sm border border-[#0a0a0a] capitalize ${CONDITION_COLORS[listing.condition] || "bg-gray-300 text-[#0a0a0a]"}`}>
            {conditionLabel}
          </span>

          {/* Right badges */}
          {listing.auctionMode && (
            <span className="absolute top-2 right-2 text-[10px] font-black px-1.5 py-0.5 rounded-sm border border-[#0a0a0a] bg-[#f5c518] text-[#0a0a0a]">
              <span className="inline-flex items-center gap-1"><Gavel className="w-3 h-3" />AUCTION</span>
            </span>
          )}
          {!listing.auctionMode && listing.shouldSuggestAuction && (
            <span className="absolute top-2 right-2 text-[10px] font-black px-1.5 py-0.5 rounded-sm border border-[#0a0a0a] bg-orange-400 text-white">
              <span className="inline-flex items-center gap-1"><Flame className="w-3 h-3" />HOT</span>
            </span>
          )}
          {isRent && (
            <span className="absolute bottom-2 left-2 text-[10px] font-black px-1.5 py-0.5 rounded-sm border border-[#0a0a0a] bg-purple-400 text-white">
              RENT
            </span>
          )}
        </div>

        {/* Details */}
        <div className="p-3 space-y-1">
          <h3 className="font-black text-sm leading-tight line-clamp-2 text-[#0a0a0a] group-hover:text-[#0a1628]">
            {listing.title}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-base font-black text-[#0a1628]">
              ₹{listing.price.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] text-[#888] font-medium">{timeAgo}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#555]">
            <span className="truncate font-medium">{listing.seller.displayName}</span>
            {listing.seller.hostelBlock && (
              <span className="border border-[#0a0a0a] rounded-sm px-1 py-0.5 font-bold bg-[#e8e8e8] shrink-0">
                {listing.seller.hostelBlock}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
