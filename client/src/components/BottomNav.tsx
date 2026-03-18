"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Home, PlusCircle, MessageCircle, User, Shield } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/listings/new", label: "Sell", icon: PlusCircle, authRequired: true },
  { href: "/chats", label: "Chats", icon: MessageCircle, authRequired: true },
  { href: "/profile", label: "Profile", icon: User, authRequired: true },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Hide on auth pages and individual chat pages
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/onboarding") ||
    pathname.match(/^\/chats\/[^/]+$/)
  ) return null;

  const items = NAV_ITEMS.filter((item) => !item.authRequired || user);
  if (user && (user as any).role === "admin") {
    items.push({ href: "/admin", label: "Admin", icon: Shield, authRequired: true });
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--surface-soft)] border-t-2 border-[#1D3557] safe-area-bottom shadow-[0px_-4px_0px_0px_#1D3557]">
      <div className="flex items-stretch h-14">
        {items.map((item, idx) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors
                ${isActive
                  ? "bg-[var(--surface-alt)] text-[#1D3557]"
                  : "text-[#1D3557] hover:bg-[var(--surface)]"
                }
                ${idx < items.length - 1 ? "border-r-2 border-[#1D3557]" : ""}
              `}
            >
              <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5px]" : ""}`} />
              <span className="text-[9px] font-black uppercase tracking-wide">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

