"use client";

interface Buyer {
  _id: string;
  displayName: string;
  hostelBlock?: string;
}

interface Demand {
  _id: string;
  title: string;
  description?: string;
  category: string;
  budgetRange?: string;
  responseCount: number;
  buyer: Buyer;
  createdAt: string;
  expiresAt: string;
}

const CATEGORY_EMOJI: Record<string, string> = {
  books: "📚", electronics: "💻", clothing: "👕", furniture: "🪑",
  stationery: "✏️", sports: "⚽", accessories: "🎒", other: "📦",
};

export default function DemandCard({ demand }: { demand: Demand }) {
  const daysLeft = Math.max(0, Math.ceil((new Date(demand.expiresAt).getTime() - Date.now()) / 86400000));
  const isUrgent = daysLeft <= 3;
  const emoji = CATEGORY_EMOJI[demand.category] || "📦";

  return (
    <div className="rounded-md border-2 border-[#0a0a0a] shadow-[4px_4px_0px_0px_#0a0a0a] bg-white p-4 space-y-3 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-black text-sm leading-tight line-clamp-2 flex-1">{demand.title}</h3>
        <span className="shrink-0 text-[10px] font-black uppercase tracking-wide px-2 py-1 border-2 border-[#0a0a0a] rounded-sm bg-[#f5f5f5] capitalize">
          {emoji} {demand.category}
        </span>
      </div>

      {demand.description && (
        <p className="text-xs text-[#555] font-medium line-clamp-2">{demand.description}</p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm font-black text-[#0a1628]">
          {demand.budgetRange || "Flexible budget"}
        </span>
        <span className={`text-[10px] font-black px-2 py-0.5 border-2 rounded-sm ${
          isUrgent
            ? "border-red-500 bg-red-50 text-red-700"
            : "border-[#0a0a0a] bg-[#f5f5f5] text-[#555]"
        }`}>
          {daysLeft === 0 ? "Expires today" : `${daysLeft}d left`}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs border-t-2 border-[#f5f5f5] pt-2">
        <span className="font-bold text-[#555]">{demand.buyer.displayName}</span>
        <div className="flex items-center gap-2">
          {demand.buyer.hostelBlock && (
            <span className="px-1.5 py-0.5 border border-[#ccc] rounded text-[10px] font-bold text-[#555]">
              {demand.buyer.hostelBlock}
            </span>
          )}
          {demand.responseCount > 0 && (
            <span className="text-[10px] font-black text-[#0a1628] bg-[#f5c518] px-1.5 py-0.5 border border-[#0a0a0a] rounded-sm">
              {demand.responseCount} response{demand.responseCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
