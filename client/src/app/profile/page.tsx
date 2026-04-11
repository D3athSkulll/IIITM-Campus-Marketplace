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
import { Star, Package, ShoppingBag, Lock, Plus, Settings, Handshake, Trash2, MessageSquare } from "lucide-react";

export default function ProfilePage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [myListings, setMyListings] = useState<any[]>([]);
  const [myDemands, setMyDemands] = useState<any[]>([]);
  const [tradeHistory, setTradeHistory] = useState<any[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [loadingDemands, setLoadingDemands] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [tab, setTab] = useState<"listings" | "demands" | "history">("listings");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.replace("/login"); return; }

    api<any>("/listings/my", { token })
      .then((d) => setMyListings(d.listings))
      .catch(() => toast.error("Failed to load your listings"))
      .finally(() => setLoadingListings(false));

    api<any>("/demands/my", { token })
      .then((d) => setMyDemands(d.demands))
      .catch(() => {})
      .finally(() => setLoadingDemands(false));

    api<any>("/transactions/history", { token })
      .then((d) => setTradeHistory(d.transactions))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [user, token, isLoading]);

  const handleDeleteListing = async (e: React.MouseEvent, listingId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this listing? If there are active chats, you'll need to close them first.")) return;
    setDeletingId(listingId);
    try {
      await api<any>(`/listings/${listingId}`, { method: "DELETE", token });
      setMyListings((prev) => prev.filter((l) => l._id !== listingId));
      toast.success("Listing deleted");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete listing");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteDemand = async (e: React.MouseEvent, demandId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this demand request?")) return;
    setDeletingId(demandId);
    try {
      await api<any>(`/demands/${demandId}`, { method: "DELETE", token });
      setMyDemands((prev) => prev.filter((d) => d._id !== demandId));
      toast.success("Demand deleted");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete demand");
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading || !user) return null;

  const displayName = user.showRealIdentity ? user.realName : user.anonymousNickname;
  const avatarUrl = user.avatarUrl || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(user.anonymousNickname)}&backgroundColor=1D3557`;

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Profile hero card */}
        <div className="rounded-md border-2 border-[#1D3557] shadow-[6px_6px_0px_0px_#1D3557] bg-[var(--surface)] text-[#1D3557] p-5">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-md border-2 border-[#1D3557] overflow-hidden bg-[var(--main)] shrink-0">
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black truncate">{displayName}</h2>
              {user.showRealIdentity && (
                <p className="text-[#1D3557] text-xs font-bold mt-0.5">{user.anonymousNickname}</p>
              )}
              <div className="flex items-center gap-3 mt-1.5 text-xs text-[#1D3557] font-bold">
                {user.hostelBlock && <span>{user.hostelBlock}</span>}
                <span>{user.totalTrades ?? 0} trade{user.totalTrades !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>

          {/* Rating row */}
          <div className="mt-4 pt-4 border-t border-[#1D3557]/20">
            {user.isRatingVisible && user.averageRating ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${s <= Math.round(user.averageRating!) ? "fill-[#FFD166] stroke-[#C58B00]" : "stroke-[#1D3557]/30"}`}
                    />
                  ))}
                </div>
                <span className="font-black text-[#1D3557]">{user.averageRating}</span>
                <span className="text-[#1D3557] text-xs font-medium">avg rating</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[#1D3557] text-xs font-bold">
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
        <div className="flex border-2 border-[#1D3557] rounded-md overflow-x-auto w-full sm:w-fit shadow-[3px_3px_0px_0px_#1D3557]">
          {(["listings", "demands", "history"] as const).map((t, idx) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-xs sm:text-sm font-black transition-colors whitespace-nowrap ${idx > 0 ? "border-l-2 border-[#1D3557]" : ""}
                ${tab === t ? "bg-[var(--main)] text-[#1D3557]" : "bg-[var(--surface-alt)] text-[#1D3557] hover:bg-[var(--surface)]"}`}
            >
              <span className="inline-flex items-center gap-1.5">
                {t === "listings" ? <Package className="w-3.5 h-3.5" /> : t === "demands" ? <MessageSquare className="w-3.5 h-3.5" /> : <Handshake className="w-3.5 h-3.5" />}
                {t === "listings" ? "My Listings" : t === "demands" ? "My Demands" : "Trade History"}
              </span>
            </button>
          ))}
        </div>

        {/* My Listings */}
        {tab === "listings" && (
          <>
            {loadingListings ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-md border-2 border-[#1D3557] bg-[var(--surface-alt)] animate-shimmer" />
                ))}
              </div>
            ) : myListings.length === 0 ? (
              <div className="text-center py-14 border-2 border-[#1D3557] rounded-md bg-[var(--surface)] shadow-[4px_4px_0px_0px_#1D3557]">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="font-black">Nothing listed yet</p>
                <p className="text-sm text-[#1D3557] font-medium mt-1">Be the first to sell something!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {myListings.map((listing) => (
                  <Link key={listing._id} href={`/listings/${listing._id}`} className="block">
                    <Card className="hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none cursor-pointer transition-all">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="w-14 h-14 rounded-md border-2 border-[#1D3557] overflow-hidden bg-[var(--surface-alt)] shrink-0">
                          {listing.images?.[0] ? (
                            <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-[#1D3557]" /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-black text-sm truncate">{listing.title}</div>
                          <div className="text-sm font-black text-[#1D3557]">₹{listing.price?.toLocaleString()}</div>
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
                        {listing.status !== "sold" && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteListing(e, listing._id)}
                            disabled={deletingId === listing._id}
                            className="shrink-0 p-2 rounded-md border-2 border-[#E63946] text-[#E63946] bg-[var(--surface)] hover:bg-[#E63946] hover:text-white transition-colors disabled:opacity-50"
                            aria-label="Delete listing"
                            title="Delete listing"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* My Demands */}
        {tab === "demands" && (
          <>
            {loadingDemands ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 rounded-md border-2 border-[#1D3557] bg-[var(--surface-alt)] animate-shimmer" />
                ))}
              </div>
            ) : myDemands.length === 0 ? (
              <div className="text-center py-14 border-2 border-[#1D3557] rounded-md bg-[var(--surface)] shadow-[4px_4px_0px_0px_#1D3557]">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="font-black">No demands posted</p>
                <p className="text-sm text-[#1D3557] font-medium mt-1">Post what you're looking for!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {myDemands.map((demand) => (
                  <Card key={demand._id}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-black text-sm truncate">{demand.title}</div>
                        <div className="text-xs text-[#1D3557] font-bold capitalize">{demand.category}</div>
                        {(demand.budgetMin || demand.budgetMax) && (
                          <div className="text-xs text-[#1D3557] font-bold">
                            ₹{demand.budgetMin?.toLocaleString() ?? "?"} – ₹{demand.budgetMax?.toLocaleString() ?? "?"}
                          </div>
                        )}
                      </div>
                      <Badge
                        variant={demand.status === "open" ? "success" : "secondary"}
                        className="capitalize shrink-0 text-xs"
                      >
                        {demand.status}
                      </Badge>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteDemand(e, demand._id)}
                        disabled={deletingId === demand._id}
                        className="shrink-0 p-2 rounded-md border-2 border-[#E63946] text-[#E63946] bg-[var(--surface)] hover:bg-[#E63946] hover:text-white transition-colors disabled:opacity-50"
                        aria-label="Delete demand"
                        title="Delete demand"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </CardContent>
                  </Card>
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
                  <div key={i} className="h-20 rounded-md border-2 border-[#1D3557] bg-[var(--surface-alt)] animate-shimmer" />
                ))}
              </div>
            ) : tradeHistory.length === 0 ? (
              <div className="text-center py-14 border-2 border-[#1D3557] rounded-md bg-[var(--surface)] shadow-[4px_4px_0px_0px_#1D3557]">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="font-black">No trades yet</p>
                <p className="text-sm text-[#1D3557] font-medium mt-1">Start buying or selling!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {tradeHistory.map((tx) => {
                  const isBuyer = tx.buyer._id === user._id;
                  const other = isBuyer ? tx.seller : tx.buyer;
                  return (
                    <Link key={tx._id} href={`/transactions/${tx._id}`} className="block">
                      <Card className="hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none cursor-pointer transition-all">
                        <CardContent className="p-3 flex items-center gap-3">
                          <div className="w-14 h-14 rounded-md border-2 border-[#1D3557] overflow-hidden bg-[var(--surface-alt)] shrink-0">
                            {tx.listing?.images?.[0] ? (
                              <img src={tx.listing.images[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-[#1D3557]" /></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-black text-sm truncate">{tx.listing?.title}</div>
                            <div className="text-xs text-[#1D3557] font-bold">
                              {isBuyer ? "Bought from" : "Sold to"} {other?.displayName ?? "Unknown"}
                            </div>
                            <div className="text-sm font-black text-[#1D3557]">₹{tx.agreedPrice?.toLocaleString()}</div>
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

