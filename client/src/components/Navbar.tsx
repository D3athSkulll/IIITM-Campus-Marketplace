"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/NotificationBell";
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
    <header className="sticky top-0 z-50 bg-[var(--surface-soft)] border-b-2 border-[#1D3557] shadow-[0px_3px_0px_0px_#1D3557]">
      {/* Main bar */}
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3 md:grid md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-md border-2 border-[#1D3557] overflow-hidden shadow-[2px_2px_0px_0px_#1D3557] bg-white">
            <img src="/app_logo.png" alt="CampusMarket" className="w-full h-full object-contain" />
          </div>
          <span className="hidden sm:block font-brand font-black text-[#1D3557] text-base leading-tight tracking-tight">
            Campus<span className="text-[#E63946]">Market</span>
          </span>
        </Link>

        {/* Search bar — desktop */}
        <form onSubmit={handleSearch} className="hidden md:block w-full max-w-2xl justify-self-center">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1D3557]" />
            <input
              type="text"
              placeholder="Search listings…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-md bg-[var(--surface-alt)] border-2 border-[#1D3557] text-sm font-medium placeholder:text-[#1D3557] focus:outline-none shadow-[2px_2px_0px_0px_#1D3557] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all"
            />
          </div>
        </form>

        <div className="flex-1 md:hidden" />

        {/* Desktop nav */}
        {user ? (
          <nav className="hidden md:flex items-center gap-1 justify-self-end">
            <Link href="/listings/new">
              <Button size="sm" className="gap-1.5 bg-[#A8DADC] text-[#1D3557] border-2 border-[#1D3557] font-black shadow-[3px_3px_0px_0px_#1D3557] hover:bg-[#D8E2DC] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
                <PlusCircle className="w-4 h-4" /> Sell
              </Button>
            </Link>
            <NotificationBell />
            <Link href="/chats">
              <Button variant="ghost" size="sm" className="text-[#1D3557] hover:bg-[var(--surface-alt)] border-transparent gap-1.5">
                <MessageCircle className="w-4 h-4" /> Chats
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="ghost" size="sm" className="text-[#1D3557] hover:bg-[var(--surface-alt)] border-transparent gap-1.5">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-6 h-6 rounded-sm border border-[#1D3557] object-cover" />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span className="hidden lg:inline max-w-[80px] truncate">{shortName}</span>
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" size="icon-sm" className="text-[#1D3557] hover:bg-[var(--surface-alt)] border-transparent">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
            {(user as any).role === "admin" && (
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="text-[#1D3557] hover:bg-[var(--surface-alt)] border-transparent gap-1">
                  <Shield className="w-4 h-4" /> Admin
                </Button>
              </Link>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleLogout}
              className="text-[#1D3557] hover:bg-[var(--surface-alt)] border-transparent"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </nav>
        ) : (
          <nav className="hidden md:flex items-center gap-2 justify-self-end">
            <Link href="/login">
              <Button variant="outline" size="sm" className="bg-[var(--surface)] text-[#1D3557] border-[#1D3557] hover:bg-[var(--surface-alt)] shadow-none">
                Sign in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Register</Button>
            </Link>
          </nav>
        )}

        {/* Mobile: notification bell + menu toggle */}
        {user && (
          <div className="md:hidden">
            <NotificationBell />
          </div>
        )}
        <button
          type="button"
          className="md:hidden text-[#1D3557] p-1.5 rounded-md border border-[#1D3557] hover:bg-[var(--surface-alt)]"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[var(--surface)] border-t-2 border-[#1D3557] px-4 py-4 space-y-1">
          {/* Mobile search */}
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1D3557]" />
              <input
                type="text"
                placeholder="Search listings…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-md bg-[var(--surface-alt)] border-2 border-[#1D3557] text-sm font-medium placeholder:text-[#1D3557] focus:outline-none"
              />
            </div>
          </form>
          {user ? (
            <div className="space-y-3">
              <Link href="/listings/new" onClick={() => setMobileOpen(false)}>
                <Button className={`w-full justify-start gap-2 font-black border-2 border-[#1D3557] ${pathname === "/listings/new" ? "bg-[#F9C74F] text-[#1D3557] hover:bg-[#F9C74F]" : "bg-[#A8DADC] text-[#1D3557] hover:bg-[#D8E2DC]"}`}>
                  <PlusCircle className="w-4 h-4" /> Sell Something
                </Button>
              </Link>
              <Link href="/chats" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className={`w-full justify-start gap-2 text-[#1D3557] border-[#1D3557] shadow-none ${pathname?.startsWith("/chats") ? "bg-[#F9C74F] hover:bg-[#F9C74F]" : "bg-[var(--surface-alt)] hover:bg-[var(--surface)]"}`}>
                  <MessageCircle className="w-4 h-4" /> My Chats
                </Button>
              </Link>
              <Link href="/profile" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className={`w-full justify-start gap-2 text-[#1D3557] border-[#1D3557] shadow-none ${pathname === "/profile" ? "bg-[#F9C74F] hover:bg-[#F9C74F]" : "bg-[var(--surface-alt)] hover:bg-[var(--surface)]"}`}>
                  <User className="w-4 h-4" /> Profile
                </Button>
              </Link>
              <Link href="/settings" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className={`w-full justify-start gap-2 text-[#1D3557] border-[#1D3557] shadow-none ${pathname === "/settings" ? "bg-[#F9C74F] hover:bg-[#F9C74F]" : "bg-[var(--surface-alt)] hover:bg-[var(--surface)]"}`}>
                  <Settings className="w-4 h-4" /> Settings
                </Button>
              </Link>
              {(user as any).role === "admin" && (
                <Link href="/admin" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className={`w-full justify-start gap-2 text-[#1D3557] border-[#1D3557] shadow-none ${pathname?.startsWith("/admin") ? "bg-[#F9C74F] hover:bg-[#F9C74F]" : "bg-[var(--surface-alt)] hover:bg-[var(--surface)]"}`}>
                    <Shield className="w-4 h-4" /> Admin Panel
                  </Button>
                </Link>
              )}
              <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-2 text-[#1D3557] border-transparent hover:bg-[var(--surface-alt)]">
                <LogOut className="w-4 h-4" /> Sign out
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className={`w-full text-[#1D3557] border-[#1D3557] shadow-none ${pathname === "/login" ? "bg-[#F9C74F] hover:bg-[#F9C74F]" : "bg-[var(--surface-alt)] hover:bg-[var(--surface)]"}`}>
                  Sign in
                </Button>
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)}>
                <Button className={`w-full font-black ${pathname === "/register" ? "bg-[#F9C74F] text-[#1D3557] hover:bg-[#F9C74F]" : ""}`}>Register</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

