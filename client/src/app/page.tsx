"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import ListingCard from "@/components/ListingCard";
import DemandCard from "@/components/DemandCard";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Laptop,
  BookOpen,
  Shirt,
  Sofa,
  Pencil,
  Trophy,
  Backpack,
  Package,
  Search,
  ClipboardList,
  Handshake,
} from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  { value: "all", label: "All", icon: ShoppingBag },
  { value: "electronics", label: "Electronics", icon: Laptop },
  { value: "books", label: "Books", icon: BookOpen },
  { value: "clothing", label: "Clothing", icon: Shirt },
  { value: "furniture", label: "Furniture", icon: Sofa },
  { value: "stationery", label: "Stationery", icon: Pencil },
  { value: "sports", label: "Sports", icon: Trophy },
  { value: "accessories", label: "Accessories", icon: Backpack },
  { value: "other", label: "Other", icon: Package },
];

type Tab = "listings" | "demands";

function HomePageInner() {
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
    if (tab === "demands") fetchDemands(category, demandPage);
  }, [tab, category, demandPage, fetchDemands]);

  const handleSearch = (q: string) => { setSearch(q); setListingPage(1); };
  const handleCategory = (cat: string) => { setCategory(cat); setListingPage(1); setDemandPage(1); };

  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      <Navbar onSearch={handleSearch} searchValue={search} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-5 space-y-5">

        {/* Hero */}
        <div className="rounded-md bg-[var(--surface)] border-2 border-[#1D3557] shadow-[6px_6px_0px_0px_#1D3557] px-6 py-8 sm:py-10 text-[#1D3557] animate-fade-up">
          <div>
            <div className="inline-block mb-3">
              <span className="font-accent text-[10px] font-bold uppercase tracking-widest bg-[var(--surface-soft)] text-[#1D3557] px-2 py-1 border border-[#1D3557] rounded-sm">
                ABV-IIITM Gwalior
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 leading-tight tracking-tight text-[#1D3557]">
              Buy &amp; Sell<br className="sm:hidden" /> on Campus
            </h1>
            <p className="text-[#1D3557] text-sm mb-5 max-w-sm font-medium">
              Alien identities. Bargaining cards. Fair ratings. Only for IIITM students.
            </p>
            {!isLoading && (
              user ? (
                <Link href="/listings/new">
                  <Button className="font-black gap-2 shadow-[4px_4px_0px_0px_#1D3557]">
                    <PlusCircle className="w-4 h-4" /> List Something
                  </Button>
                </Link>
              ) : (
                <Link href="/register">
                  <Button className="font-black shadow-[4px_4px_0px_0px_#1D3557]">
                    Join Now
                  </Button>
                </Link>
              )
            )}
          </div>
          <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#1D3557]">
            <ShoppingBag className="w-4 h-4" />
            Trusted student-only marketplace
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 pb-3 mt-6 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-thin scrollbar-thumb-[#F9C74F] scrollbar-track-[var(--surface)]">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => handleCategory(cat.value)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-black transition-all border-2 whitespace-nowrap
                ${category === cat.value
                  ? "bg-[var(--surface-soft)] text-[#1D3557] border-[#1D3557] shadow-[3px_3px_0px_0px_#1D3557]"
                  : "bg-[var(--surface)] text-[#1D3557] border-[#1D3557] hover:bg-[var(--surface-alt)] shadow-[2px_2px_0px_0px_#1D3557]"
                }`}
            >
              <cat.icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-2 border-[#1D3557] rounded-md overflow-hidden w-fit shadow-[3px_3px_0px_0px_#1D3557]">
          {(["listings", "demands"] as Tab[]).map((t, idx) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-5 py-2 text-sm font-black transition-colors ${idx > 0 ? "border-l-2 border-[#1D3557]" : ""}
                ${tab === t
                  ? "bg-[var(--main)] text-[#1D3557]"
                  : "bg-[var(--surface-alt)] text-[#1D3557] hover:bg-[var(--surface)]"
                }`}
            >
              <span className="inline-flex items-center gap-1.5">
                {t === "listings" ? <Package className="w-3.5 h-3.5" /> : <Search className="w-3.5 h-3.5" />}
                {t === "listings" ? "Listings" : "Buyer Demands"}
              </span>
            </button>
          ))}
        </div>

        {/* Listings grid */}
        {tab === "listings" && (
          <>
            {loadingListings ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="rounded-md bg-[var(--surface-alt)] animate-shimmer aspect-[3/4] border-2 border-[#1D3557]" />
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-16 border-2 border-[#1D3557] rounded-md bg-[var(--surface)] shadow-[4px_4px_0px_0px_#1D3557]">
                <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-black text-lg">No listings found</p>
                <p className="text-sm text-[#1D3557] mt-1 font-medium">Try a different category or search term</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {listings.map((listing) => (
                  <ListingCard key={listing._id} listing={listing} />
                ))}
              </div>
            )}
            {listingPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button variant="outline" size="sm" disabled={listingPage === 1} onClick={() => setListingPage((p) => p - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-black">Page {listingPage} of {listingPages}</span>
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
              <p className="text-sm font-bold text-[#1D3557] inline-flex items-center gap-1.5"><Handshake className="w-4 h-4" />Sellers: see what buyers need</p>
              {user && (
                <Link href="/demands/new">
                  <Button size="sm" variant="outline" className="gap-1.5 font-black">
                    <PlusCircle className="w-3.5 h-3.5" /> Post demand
                  </Button>
                </Link>
              )}
            </div>
            {loadingDemands ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-md bg-[var(--surface-alt)] animate-shimmer h-28 border-2 border-[#1D3557]" />
                ))}
              </div>
            ) : demands.length === 0 ? (
              <div className="text-center py-16 border-2 border-[#1D3557] rounded-md bg-[var(--surface)] shadow-[4px_4px_0px_0px_#1D3557]">
                <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-black text-lg">No buyer demands yet</p>
                {user && <p className="text-sm text-[#1D3557] mt-1 font-medium">Post what you&apos;re looking for!</p>}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {demands.map((demand) => (
                  <DemandCard key={demand._id} demand={demand} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense>
      <HomePageInner />
    </Suspense>
  );
}

