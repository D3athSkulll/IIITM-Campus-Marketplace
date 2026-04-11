"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { useNotification, type Notification } from "@/context/NotificationContext";

function timeAgo(iso?: string) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

const iconMap: Record<Notification["type"], React.ReactNode> = {
  success: <CheckCircle className="w-4 h-4 text-[#2A9D8F]" />,
  error: <AlertCircle className="w-4 h-4 text-[#E63946]" />,
  info: <Info className="w-4 h-4 text-[#457B9D]" />,
  warning: <AlertTriangle className="w-4 h-4 text-[#F3722C]" />,
};

export default function NotificationBell() {
  const { history, clearHistory, removeHistoryItem } = useNotification();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const count = history.length;

  const handleClick = (n: Notification) => {
    if (n.href) {
      router.push(n.href);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((p) => !p)}
        className="relative p-2 rounded-md border-2 border-[#1D3557] bg-[var(--surface)] hover:bg-[var(--surface-alt)] shadow-[2px_2px_0px_0px_#1D3557] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all text-[#1D3557]"
      >
        <Bell className="w-4 h-4" />
        {count > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E63946] text-white text-[10px] font-black flex items-center justify-center border-2 border-[var(--surface)]">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-[var(--surface)] border-2 border-[#1D3557] rounded-md shadow-[4px_4px_0px_0px_#1D3557] z-50 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b-2 border-[#1D3557] bg-[var(--surface-soft)]">
            <span className="font-black text-sm text-[#1D3557]">Notifications</span>
            {count > 0 && (
              <button
                type="button"
                onClick={clearHistory}
                className="text-[10px] font-black text-[#E63946] hover:underline uppercase tracking-wide"
              >
                Clear All
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {count === 0 ? (
              <div className="px-4 py-8 text-center text-xs font-medium text-[#1D3557]/60">
                No notifications yet
              </div>
            ) : (
              history.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-2 px-3 py-2.5 border-b border-[#1D3557]/20 hover:bg-[var(--surface-alt)] transition-colors group"
                >
                  <div className="shrink-0 mt-0.5">{iconMap[n.type]}</div>
                  <button
                    type="button"
                    onClick={() => handleClick(n)}
                    className="flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <div className="font-black text-xs text-[#1D3557] truncate">{n.title}</div>
                    <div className="text-[11px] font-medium text-[#1D3557]/70 line-clamp-2">{n.message}</div>
                    <div className="text-[9px] font-bold text-[#1D3557]/50 uppercase mt-0.5">{timeAgo(n.createdAt)} ago</div>
                  </button>
                  <button
                    type="button"
                    aria-label="Dismiss notification"
                    onClick={() => removeHistoryItem(n.id)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 p-1 hover:bg-[#E63946]/20 rounded transition-opacity text-[#E63946]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
