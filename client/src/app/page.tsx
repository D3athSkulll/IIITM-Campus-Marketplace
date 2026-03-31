"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import ListingCard from "@/components/ListingCard";
import DemandCard from "@/components/DemandCard";
import { Button } from "@/components/ui/button";
import { PlusCircle, ChevronLeft, ChevronRight, Download } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  { value: "all", label: "All", emoji: "🛍️" },
  { value: "electronics", label: "Electronics", emoji: "💻" },
  { value: "books", label: "Books", emoji: "📚" },
  { value: "clothing", label: "Clothing", emoji: "👕" },
  { value: "furniture", label: "Furniture", emoji: "🪑" },
  { value: "stationery", label: "Stationery", emoji: "✏️" },
  { value: "sports", label: "Sports", emoji: "⚽" },
  { value: "accessories", label: "Accessories", emoji: "🎒" },
  { value: "other", label: "Other", emoji: "📦" },
];

type Tab = "listings" | "demands";

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<Tab>("listings");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [listings, setListings] = useState<any[]>([]);
  const [demands, setDemands] = useState<any[]>([]);
  const [listingPage, setListingPage] = useState(1);
  const [listingPages, setListingPages] = useState(1);
  const [demandPage, setDemandPage] = useState(1);
  const [demandPages, setDemandPages] = useState(1);
  const [loadingListings, setLoadingListings] = useState(true);
  const [loadingDemands, setLoadingDemands] = useState(false);

  const fetchListings = useCallback(async (cat: string, q: string, page: number) => {
    setLoadingListings(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (cat !== "all") params.set("category", cat);
      if (q) params.set("search", q);
      const data = await api<any>(`/listings?${params}`);
      setListings(data.listings);
      setListingPages(data.pagination.pages || 1);
    } catch {
      toast.error("Failed to load listings");
    } finally {
      setLoadingListings(false);
    }
  }, []);

  const fetchDemands = useCallback(async (cat: string, page: number) => {
    setLoadingDemands(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (cat !== "all") params.set("category", cat);
      const data = await api<any>(`/demands?${params}`);
      setDemands(data.demands);
      setDemandPages(data.pagination.pages || 1);
    } catch {
      toast.error("Failed to load demands");
    } finally {
      setLoadingDemands(false);
    }
  }, []);

  useEffect(() => {
    fetchListings(category, search, listingPage);
  }, [category, search, listingPage, fetchListings]);

  useEffect(() => {
    if (tab === "demands") {
      fetchDemands(category, demandPage);
    }
  }, [tab, category, demandPage, fetchDemands]);

  const handleSearch = (q: string) => {
    setSearch(q);
    setListingPage(1);
  };

  const handleCategory = (cat: string) => {
    setCategory(cat);
    setListingPage(1);
    setDemandPage(1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar onSearch={handleSearch} searchValue={search} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 space-y-6">
        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[var(--navy-dark)] via-[var(--navy)] to-[var(--navy-light)] px-6 py-8 sm:py-10 text-white animate-fade-up">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvc3ZnPg==')] opacity-60" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium bg-white/15 px-2.5 py-1 rounded-full backdrop-blur-sm">ABV-IIITM Gwalior</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-1.5 leading-tight">Buy & Sell on Campus</h2>
            <p className="text-white/60 text-sm mb-5 max-w-md">Trusted student marketplace — anonymous identity, bargaining cards, and fair ratings.</p>
            <div className="flex flex-wrap gap-2">
              {!isLoading && (
                user ? (
                  <Link href="/listings/new">
                    <Button className="bg-[var(--gold)] hover:bg-[var(--gold-dark)] text-[var(--navy-dark)] font-semibold gap-2 shadow-lg shadow-black/20">
                      <PlusCircle className="w-4 h-4" /> List Something
                    </Button>
                  </Link>
                ) : (
                  <Link href="/register">
                    <Button className="bg-[var(--gold)] hover:bg-[var(--gold-dark)] text-[var(--navy-dark)] font-semibold shadow-lg shadow-black/20">
                      Join Now
                    </Button>
                  </Link>
                )
              )}
            </div>
          </div>
          <div className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 text-7xl sm:text-8xl opacity-10 select-none animate-float">🎓</div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => handleCategory(cat.value)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all border whitespace-nowrap
                ${category === cat.value
                  ? "bg-[var(--navy)] text-white border-[var(--navy)] shadow-sm"
                  : "bg-white text-foreground border-border hover:border-[var(--navy)] hover:text-[var(--navy)]"
                }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg w-fit">
          {(["listings", "demands"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${
                tab === t ? "bg-white shadow-sm text-[var(--navy)]" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "listings" ? "Listings" : "Buyer Demands"}
            </button>
          ))}
        </div>

        {/* Listings */}
        {tab === "listings" && (
          <>
            {loadingListings ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="rounded-xl bg-muted animate-pulse aspect-[3/4]" />
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <div className="text-5xl mb-3">🕵️</div>
                <p className="font-medium">No listings found</p>
                <p className="text-sm mt-1">Try a different category or search term</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {listings.map((listing) => (
                  <ListingCard key={listing._id} listing={listing} />
                ))}
              </div>
            )}
            {listingPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <Button variant="outline" size="sm" disabled={listingPage === 1} onClick={() => setListingPage((p) => p - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">Page {listingPage} of {listingPages}</span>
                <Button variant="outline" size="sm" disabled={listingPage === listingPages} onClick={() => setListingPage((p) => p + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* Demands */}
        {tab === "demands" && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Sellers: see what buyers are looking for</p>
              {user && (
                <Link href="/demands/new">
                  <Button size="sm" variant="outline" className="gap-1.5 border-[var(--navy)] text-[var(--navy)]">
                    <PlusCircle className="w-3.5 h-3.5" /> Post demand
                  </Button>
                </Link>
              )}
            </div>
            {loadingDemands ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-xl bg-muted animate-pulse h-28" />
                ))}
              </div>
            ) : demands.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <div className="text-5xl mb-3">📋</div>
                <p className="font-medium">No buyer demands yet</p>
                {user && <p className="text-sm mt-1">Post what you're looking for!</p>}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {demands.map((demand) => (
                  <DemandCard key={demand._id} demand={demand} />
                ))}
              </div>
            )}
            {demandPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <Button variant="outline" size="sm" disabled={demandPage === 1} onClick={() => setDemandPage((p) => p - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">Page {demandPage} of {demandPages}</span>
                <Button variant="outline" size="sm" disabled={demandPage === demandPages} onClick={() => setDemandPage((p) => p + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
