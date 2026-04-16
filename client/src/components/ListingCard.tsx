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
  rentalDetails?: { pricePerDay?: number; depositAmount?: number; maxRentalDays?: number };
  images: string[];
  interestCount: number;
  viewCount: number;
  shouldSuggestAuction?: boolean;
  auctionMode?: boolean;
  seller: Seller;
  createdAt: string;
}

const CONDITION_COLORS: Record<string, string> = {
  "like-new": "bg-[#A8DADC] text-[#1D3557]",
  good: "bg-[#D8E2DC] text-[#1D3557]",
  fair: "bg-[#F9C74F] text-[#1D3557]",
  poor: "bg-[#E63946] text-[#F1FAEE]",
};

export default function ListingCard({ listing }: { listing: Listing }) {
  const conditionLabel = listing.condition.replace("-", " ");
  const timeAgo = getTimeAgo(listing.createdAt);
  const isRent = listing.listingType === "rent";

  return (
    <Link href={`/listings/${listing._id}`} className="group block">
      {/* Neobrutalism card: bold border + hard shadow, lifts on hover */}
      <div className="bg-[var(--surface)] border-2 border-[#1D3557] rounded-md shadow-[4px_4px_0px_0px_#1D3557] transition-all duration-150 group-hover:shadow-[6px_6px_0px_0px_#1D3557] group-hover:-translate-x-[1px] group-hover:-translate-y-[1px] overflow-hidden">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-[var(--surface-alt)] overflow-hidden border-b-2 border-[#1D3557]">
          {listing.images[0] ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#F9C74F]">
              <Package className="w-10 h-10 text-[#1D3557]" />
            </div>
          )}

          {/* Condition badge — top left */}
          <span className={`absolute top-2 left-2 text-[10px] font-black px-1.5 py-0.5 rounded-sm border border-[#1D3557] capitalize ${CONDITION_COLORS[listing.condition] || "bg-[var(--surface-soft)] text-[#1D3557]"}`}>
            {conditionLabel}
          </span>

          {/* Right badges */}
          {listing.auctionMode && (
            <span className="absolute top-2 right-2 text-[10px] font-black px-1.5 py-0.5 rounded-sm border border-[#1D3557] bg-[#F9C74F] text-[#1D3557]">
              <span className="inline-flex items-center gap-1"><Gavel className="w-3 h-3" />AUCTION</span>
            </span>
          )}
          {!listing.auctionMode && listing.shouldSuggestAuction && (
            <span className="absolute top-2 right-2 text-[10px] font-black px-1.5 py-0.5 rounded-sm border border-[#E63946] bg-[#E63946]/20 text-[#1D3557]">
              <span className="inline-flex items-center gap-1"><Flame className="w-3 h-3" />HOT</span>
            </span>
          )}
          {isRent && (
            <span className="absolute bottom-2 left-2 text-[10px] font-black px-1.5 py-0.5 rounded-sm border border-[#1D3557] bg-[#A8DADC] text-[#1D3557]">
              RENT
            </span>
          )}
        </div>

        {/* Details */}
        <div className="p-3 space-y-1">
          <h3 className="font-black text-sm leading-tight line-clamp-2 text-[#1D3557] group-hover:text-[#1D3557]">
            {listing.title}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-base font-black text-[#1D3557]">
              {isRent && listing.rentalDetails?.pricePerDay
                ? <>₹{listing.rentalDetails.pricePerDay.toLocaleString("en-IN")}<span className="text-[10px] font-bold">/day</span></>
                : <>₹{listing.price.toLocaleString("en-IN")}</>
              }
            </span>
            <span className="text-[10px] text-[#1D3557] font-medium">{timeAgo}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#1D3557]">
            <span className="truncate font-medium">{listing.seller.displayName}</span>
            {listing.seller.hostelBlock && (
              <span className="border border-[#1D3557] rounded-sm px-1 py-0.5 font-bold bg-[var(--surface-alt)] shrink-0">
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

