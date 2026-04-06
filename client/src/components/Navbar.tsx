"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
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
  Settings,
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

  const avatarUrl = user?.avatarUrl || "";
  const displayName = user
    ? (user.showRealIdentity ? user.realName : user.anonymousNickname)
    : "";
  const shortName = displayName.split(" ")[0] || "";

  return (
    <header className="sticky top-0 z-50 bg-[#0a1628] border-b-2 border-[#0a0a0a]">
      {/* Main bar */}
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-md bg-[#f5c518] border-2 border-[#0a0a0a] flex items-center justify-center shadow-[2px_2px_0px_0px_#0a0a0a]">
            <span className="text-xs font-black text-[#0a0a0a]">CM</span>
          </div>
          <span className="hidden sm:block font-black text-white text-base leading-tight tracking-tight">
            Campus<span className="text-[#f5c518]">Market</span>
          </span>
        </Link>

        {/* Search bar — desktop */}
        <form onSubmit={handleSearch} className="flex-1 max-w-lg hidden md:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888]" />
            <input
              type="text"
              placeholder="Search listings…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-md bg-white border-2 border-[#0a0a0a] text-sm font-medium placeholder:text-[#999] focus:outline-none shadow-[2px_2px_0px_0px_#0a0a0a] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all"
            />
          </div>
        </form>

        <div className="flex-1 md:hidden" />

        {/* Desktop nav */}
        {user ? (
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/listings/new">
              <Button size="sm" className="gap-1.5 bg-[#f5c518] text-[#0a0a0a] border-2 border-[#0a0a0a] font-black shadow-[3px_3px_0px_0px_#0a0a0a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
                <PlusCircle className="w-4 h-4" /> Sell
              </Button>
            </Link>
            <Link href="/chats">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 border-transparent gap-1.5">
                <MessageCircle className="w-4 h-4" /> Chats
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 border-transparent gap-1.5">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-6 h-6 rounded-sm border border-white/30 object-cover" />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span className="hidden lg:inline max-w-[80px] truncate">{shortName}</span>
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" size="icon-sm" className="text-white/60 hover:text-white hover:bg-white/10 border-transparent">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
            {(user as any).role === "admin" && (
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="text-[#f5c518] hover:bg-white/10 border-transparent gap-1">
                  <Shield className="w-4 h-4" /> Admin
                </Button>
              </Link>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleLogout}
              className="text-white/50 hover:text-white hover:bg-white/10 border-transparent"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </nav>
        ) : (
          <nav className="hidden md:flex items-center gap-2">
            <Link href="/login">
              <Button variant="outline" size="sm" className="bg-transparent text-white border-white/40 hover:bg-white/10 shadow-none">
                Sign in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Register</Button>
            </Link>
          </nav>
        )}

        {/* Mobile menu toggle */}
        <button
          className="md:hidden text-white p-1.5 rounded-md border border-white/20 hover:bg-white/10"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#06101d] border-t-2 border-[#0a0a0a] px-4 py-4 space-y-2">
          {/* Mobile search */}
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888]" />
              <input
                type="text"
                placeholder="Search listings…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-md bg-white border-2 border-[#0a0a0a] text-sm font-medium placeholder:text-[#999] focus:outline-none"
              />
            </div>
          </form>
          {user ? (
            <div className="space-y-1.5 pt-1">
              <Link href="/listings/new" onClick={() => setMobileOpen(false)}>
                <Button className="w-full justify-start gap-2 font-black">
                  <PlusCircle className="w-4 h-4" /> Sell Something
                </Button>
              </Link>
              <Link href="/chats" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full justify-start gap-2 text-white bg-transparent border-white/30 hover:bg-white/10 shadow-none">
                  <MessageCircle className="w-4 h-4" /> My Chats
                </Button>
              </Link>
              <Link href="/profile" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full justify-start gap-2 text-white bg-transparent border-white/30 hover:bg-white/10 shadow-none">
                  <User className="w-4 h-4" /> Profile
                </Button>
              </Link>
              <Link href="/settings" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full justify-start gap-2 text-white bg-transparent border-white/30 hover:bg-white/10 shadow-none">
                  <Settings className="w-4 h-4" /> Settings
                </Button>
              </Link>
              {(user as any).role === "admin" && (
                <Link href="/admin" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full justify-start gap-2 text-[#f5c518] bg-transparent border-[#f5c518]/40 hover:bg-white/10 shadow-none">
                    <Shield className="w-4 h-4" /> Admin Panel
                  </Button>
                </Link>
              )}
              <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-2 text-white/50 hover:text-white border-transparent">
                <LogOut className="w-4 h-4" /> Sign out
              </Button>
            </div>
          ) : (
            <div className="space-y-1.5 pt-1">
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full text-white bg-transparent border-white/30 hover:bg-white/10 shadow-none">
                  Sign in
                </Button>
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)}>
                <Button className="w-full font-black">Register</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
