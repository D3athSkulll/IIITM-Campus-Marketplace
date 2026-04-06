"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Package, ShoppingBag, Lock, Plus, Settings } from "lucide-react";

export default function ProfilePage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [myListings, setMyListings] = useState<any[]>([]);
  const [tradeHistory, setTradeHistory] = useState<any[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [tab, setTab] = useState<"listings" | "history">("listings");

  useEffect(() => {
    if (!user) { router.replace("/login"); return; }

    api<any>("/listings/my", { token })
      .then((d) => setMyListings(d.listings))
      .catch(() => toast.error("Failed to load your listings"))
      .finally(() => setLoadingListings(false));

    api<any>("/transactions/history", { token })
      .then((d) => setTradeHistory(d.transactions))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [user, token]);

  if (!user) return null;

  const displayName = user.showRealIdentity ? user.realName : user.anonymousNickname;
  const avatarUrl = user.avatarUrl || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(user.anonymousNickname)}&backgroundColor=0a1628`;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Profile hero card */}
        <div className="rounded-md border-2 border-[#0a0a0a] shadow-[6px_6px_0px_0px_#0a0a0a] bg-[#0a1628] text-white p-5">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-md border-2 border-[#f5c518] overflow-hidden bg-[#1a2a48] shrink-0">
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black truncate">{displayName}</h2>
              {user.showRealIdentity && (
                <p className="text-white/50 text-xs font-bold mt-0.5">{user.anonymousNickname}</p>
              )}
              <div className="flex items-center gap-3 mt-1.5 text-xs text-white/60 font-bold">
                {user.hostelBlock && <span>{user.hostelBlock}</span>}
                <span>{user.totalTrades ?? 0} trade{user.totalTrades !== 1 ? "s" : ""}</span>
              </div>
            </div>
            <Link href="/settings">
              <button
                type="button"
                className="w-9 h-9 flex items-center justify-center border-2 border-white/30 rounded-md hover:border-[#f5c518] hover:text-[#f5c518] text-white/60 transition-colors"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </Link>
          </div>

          {/* Rating row */}
          <div className="mt-4 pt-4 border-t border-white/10">
            {user.isRatingVisible && user.averageRating ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${s <= Math.round(user.averageRating!) ? "fill-[#f5c518] stroke-[#f5c518]" : "stroke-white/30"}`}
                    />
                  ))}
                </div>
                <span className="font-black text-[#f5c518]">{user.averageRating}</span>
                <span className="text-white/50 text-xs font-medium">avg rating</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-white/50 text-xs font-bold">
                <Lock className="w-3.5 h-3.5" />
                <span>
                  Rating hidden —{" "}
                  {(user.tradesUntilRatingVisible ?? 5) > 0
                    ? `${user.tradesUntilRatingVisible ?? 5} more trade${(user.tradesUntilRatingVisible ?? 5) !== 1 ? "s" : ""} to unlock`
                    : "complete a trade to unlock"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-3">
          <Link href="/listings/new" className="flex-1">
            <Button className="w-full font-black gap-2">
              <Plus className="w-4 h-4" /> New Listing
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="outline" className="font-black gap-2">
              <Settings className="w-4 h-4" /> Settings
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex border-2 border-[#0a0a0a] rounded-md overflow-hidden w-fit shadow-[3px_3px_0px_0px_#0a0a0a]">
          {(["listings", "history"] as const).map((t, idx) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-5 py-2 text-sm font-black transition-colors ${idx > 0 ? "border-l-2 border-[#0a0a0a]" : ""}
                ${tab === t ? "bg-[#0a1628] text-white" : "bg-white text-[#0a0a0a] hover:bg-[#f5f5f5]"}`}
            >
              {t === "listings" ? "📦 My Listings" : "🤝 Trade History"}
            </button>
          ))}
        </div>

        {/* My Listings */}
        {tab === "listings" && (
          <>
            {loadingListings ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-md border-2 border-[#0a0a0a] bg-[#e8e8e8] animate-shimmer" />
                ))}
              </div>
            ) : myListings.length === 0 ? (
              <div className="text-center py-14 border-2 border-[#0a0a0a] rounded-md bg-white shadow-[4px_4px_0px_0px_#0a0a0a]">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="font-black">Nothing listed yet</p>
                <p className="text-sm text-[#555] font-medium mt-1">Be the first to sell something!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {myListings.map((listing) => (
                  <Link key={listing._id} href={`/listings/${listing._id}`}>
                    <Card className="hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none cursor-pointer transition-all">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="w-14 h-14 rounded-md border-2 border-[#0a0a0a] overflow-hidden bg-[#e8e8e8] shrink-0">
                          {listing.images?.[0] ? (
                            <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-black text-sm truncate">{listing.title}</div>
                          <div className="text-sm font-black text-[#0a1628]">₹{listing.price?.toLocaleString()}</div>
                        </div>
                        <Badge
                          variant={
                            listing.status === "active" ? "success" :
                            listing.status === "sold" ? "secondary" : "default"
                          }
                          className="capitalize shrink-0 text-xs"
                        >
                          {listing.status}
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* Trade History */}
        {tab === "history" && (
          <>
            {loadingHistory ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 rounded-md border-2 border-[#0a0a0a] bg-[#e8e8e8] animate-shimmer" />
                ))}
              </div>
            ) : tradeHistory.length === 0 ? (
              <div className="text-center py-14 border-2 border-[#0a0a0a] rounded-md bg-white shadow-[4px_4px_0px_0px_#0a0a0a]">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="font-black">No trades yet</p>
                <p className="text-sm text-[#555] font-medium mt-1">Start buying or selling!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tradeHistory.map((tx) => {
                  const isBuyer = tx.buyer._id === user._id;
                  const other = isBuyer ? tx.seller : tx.buyer;
                  return (
                    <Link key={tx._id} href={`/transactions/${tx._id}`}>
                      <Card className="hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none cursor-pointer transition-all">
                        <CardContent className="p-3 flex items-center gap-3">
                          <div className="w-14 h-14 rounded-md border-2 border-[#0a0a0a] overflow-hidden bg-[#e8e8e8] shrink-0">
                            {tx.listing?.images?.[0] ? (
                              <img src={tx.listing.images[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-black text-sm truncate">{tx.listing?.title}</div>
                            <div className="text-xs text-[#555] font-bold">
                              {isBuyer ? "Bought from" : "Sold to"} {other?.displayName ?? "Unknown"}
                            </div>
                            <div className="text-sm font-black text-[#0a1628]">₹{tx.agreedPrice?.toLocaleString()}</div>
                          </div>
                          <Badge
                            variant={
                              tx.status === "completed" ? "success" :
                              tx.status === "disputed" ? "destructive" : "default"
                            }
                            className="capitalize shrink-0 text-xs"
                          >
                            {tx.status?.replace("-", " ")}
                          </Badge>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
