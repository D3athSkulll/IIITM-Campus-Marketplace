"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Home,
  PlusCircle,
  MessageCircle,
  User,
  Shield,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/listings/new", label: "Sell", icon: PlusCircle, authRequired: true },
  { href: "/chats", label: "Chats", icon: MessageCircle, authRequired: true },
  { href: "/profile", label: "Profile", icon: User, authRequired: true },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Don't show on auth pages
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/onboarding")
  ) {
    return null;
  }

  // Don't show on individual chat pages (has its own input at bottom)
  if (pathname.match(/^\/chats\/[^/]+$/)) {
    return null;
  }

  const items = NAV_ITEMS.filter((item) => !item.authRequired || user);

  // Add admin link if user is admin
  if (user && (user as any).role === "admin") {
    items.push({ href: "/admin", label: "Admin", icon: Shield, authRequired: true });
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {items.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${
                isActive
                  ? "text-[var(--navy)]"
                  : "text-muted-foreground"
              }`}
            >
              <Icon
                className={`w-5 h-5 ${isActive ? "stroke-[2.5px]" : ""}`}
              />
              <span className="text-[10px] font-medium leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
