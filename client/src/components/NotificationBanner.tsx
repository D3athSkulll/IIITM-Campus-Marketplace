"use client";

import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { useNotification } from "@/context/NotificationContext";

export default function NotificationBanner() {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  const iconMap = {
    success: <CheckCircle className="w-4 h-4" />,
    error: <AlertCircle className="w-4 h-4" />,
    info: <Info className="w-4 h-4" />,
    warning: <AlertTriangle className="w-4 h-4" />,
  };

  const bgMap = {
    success: "bg-[#A8DADC] border-[#2A9D8F]",
    error: "bg-[#E63946] border-[#E63946] text-[#F1FAEE]",
    info: "bg-[#2A9D8F] border-[#2A9D8F] text-[#F1FAEE]",
    warning: "bg-[#F9C74F] border-[#F9C74F] text-[#1D3557]",
  };

  return (
    <div className="fixed top-20 left-0 right-0 z-50 px-4 py-2 space-y-2 pointer-events-none">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`flex items-start gap-3 max-w-md mx-auto border-2 border-[#1D3557] rounded-md px-4 py-3 shadow-[3px_3px_0px_0px_#1D3557] pointer-events-auto ${
            bgMap[notif.type]
          } animate-slide-down`}
        >
          <div className="shrink-0 mt-0.5">{iconMap[notif.type]}</div>
          <div className="flex-1 min-w-0">
            <div className="font-black text-sm">{notif.title}</div>
            <div className="text-xs font-medium mt-0.5 opacity-90">{notif.message}</div>
          </div>
          <button
            type="button"
            onClick={() => removeNotification(notif.id)}
            className="shrink-0 hover:opacity-70 transition-opacity"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
