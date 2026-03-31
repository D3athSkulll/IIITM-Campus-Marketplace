"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag,
  PlusCircle,
  MessageCircle,
  User,
  LogOut,
  Menu,
  X,
  Search,
  Shield,
} from "lucide-react";

interface NavbarProps {
  onSearch?: (q: string) => void;
  searchValue?: string;
}

export default function Navbar({ onSearch, searchValue = "" }: NavbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(searchValue);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch(searchInput);
    else router.push(`/?search=${encodeURIComponent(searchInput)}`);
  };

  const initials = user
    ? (user.showRealIdentity ? user.realName : user.anonymousNickname)
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-50 bg-[var(--navy)] shadow-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[var(--gold)] flex items-center justify-center">
            <span className="text-xs font-black text-[var(--navy-dark)]">CM</span>
          </div>
          <span className="hidden sm:block font-bold text-white text-lg leading-tight">
            Campus<br className="hidden" />
            <span className="text-[var(--gold)]">Market</span>
          </span>
        </Link>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search listings…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/10 text-white placeholder:text-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:bg-white/15 text-sm"
            />
          </div>
        </form>

        <div className="flex-1 md:hidden" />

        {/* Desktop nav */}
        {user ? (
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/listings/new">
              <Button size="sm" className="bg-[var(--gold)] hover:bg-[var(--gold-dark)] text-[var(--navy-dark)] font-semibold gap-1.5">
                <PlusCircle className="w-4 h-4" /> Sell
              </Button>
            </Link>
            <Link href="/chats">
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 gap-1.5">
                <MessageCircle className="w-4 h-4" /> Chats
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 gap-1.5">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-[10px] bg-[var(--gold)] text-[var(--navy-dark)]">{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden lg:inline">
                  {user.showRealIdentity ? user.realName.split(" ")[0] : user.anonymousNickname}
                </span>
                {user.isRatingVisible && user.averageRating && (
                  <Badge className="bg-[var(--gold)] text-[var(--navy-dark)] text-[10px] px-1 py-0 h-4">
                    ★ {user.averageRating}
                  </Badge>
                )}
              </Button>
            </Link>
            {(user as any).role === "admin" && (
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 gap-1.5">
                  <Shield className="w-4 h-4" /> Admin
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </nav>
        ) : (
          <nav className="hidden md:flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-[var(--gold)] hover:bg-[var(--gold-dark)] text-[var(--navy-dark)] font-semibold">Register</Button>
            </Link>
          </nav>
        )}

        {/* Mobile menu toggle */}
        <button
          className="md:hidden text-white/80 hover:text-white p-1"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[var(--navy-dark)] border-t border-white/10 px-4 py-3 space-y-2">
          {/* Mobile search */}
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search listings…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/10 text-white placeholder:text-white/50 border border-white/20 focus:outline-none text-sm"
              />
            </div>
          </form>
          {user ? (
            <>
              <Link href="/listings/new" onClick={() => setMobileOpen(false)}>
                <Button className="w-full bg-[var(--gold)] text-[var(--navy-dark)] font-semibold gap-2 justify-start">
                  <PlusCircle className="w-4 h-4" /> Sell Something
                </Button>
              </Link>
              <Link href="/chats" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full text-white/80 justify-start gap-2">
                  <MessageCircle className="w-4 h-4" /> My Chats
                </Button>
              </Link>
              <Link href="/profile" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full text-white/80 justify-start gap-2">
                  <User className="w-4 h-4" /> Profile
                </Button>
              </Link>
              {(user as any).role === "admin" && (
                <Link href="/admin" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full text-white/80 justify-start gap-2">
                    <Shield className="w-4 h-4" /> Admin Panel
                  </Button>
                </Link>
              )}
              <Button variant="ghost" onClick={handleLogout} className="w-full text-white/60 justify-start gap-2">
                <LogOut className="w-4 h-4" /> Sign out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full text-white/80 justify-start">Sign in</Button>
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)}>
                <Button className="w-full bg-[var(--gold)] text-[var(--navy-dark)] font-semibold">Register</Button>
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
