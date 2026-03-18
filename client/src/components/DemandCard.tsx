"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { Backpack, BookOpen, Laptop, Package, Pencil, Shirt, Sofa, Trophy } from "lucide-react";

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

const CATEGORY_ICON: Record<string, ComponentType<{ className?: string }>> = {
  books: BookOpen,
  electronics: Laptop,
  clothing: Shirt,
  furniture: Sofa,
  stationery: Pencil,
  sports: Trophy,
  accessories: Backpack,
  other: Package,
};

export default function DemandCard({ demand }: { demand: Demand }) {
  const [daysLeft, setDaysLeft] = useState(0);
  useEffect(() => {
    const compute = () => {
      const now = new Date().getTime();
      setDaysLeft(Math.max(0, Math.ceil((new Date(demand.expiresAt).getTime() - now) / 86400000)));
    };
    compute();
  }, [demand.expiresAt]);

  const isUrgent = daysLeft <= 3;
  const Icon = CATEGORY_ICON[demand.category] || Package;

  return (
    <div className="rounded-md border-2 border-[#1D3557] shadow-[4px_4px_0px_0px_#1D3557] bg-[var(--surface)] p-4 space-y-3 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-black text-sm leading-tight line-clamp-2 flex-1">{demand.title}</h3>
        <span className="shrink-0 text-[10px] font-black uppercase tracking-wide px-2 py-1 border-2 border-[#1D3557] rounded-sm bg-[var(--surface-alt)] capitalize">
          <span className="inline-flex items-center gap-1">
            <Icon className="w-3 h-3" />
            {demand.category}
          </span>
        </span>
      </div>

      {demand.description && (
        <p className="text-xs text-[#1D3557] font-medium line-clamp-2">{demand.description}</p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm font-black text-[#1D3557]">
          {demand.budgetRange || "Flexible budget"}
        </span>
        <span className={`text-[10px] font-black px-2 py-0.5 border-2 rounded-sm ${
          isUrgent
            ? "border-[#D8E2DC] bg-[#D8E2DC] text-[#1D3557]"
            : "border-[#1D3557] bg-[var(--surface-alt)] text-[#1D3557]"
        }`}>
          {daysLeft === 0 ? "Expires today" : `${daysLeft}d left`}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs border-t-2 border-[#1D3557]/20 pt-2">
        <span className="font-bold text-[#1D3557]">{demand.buyer.displayName}</span>
        <div className="flex items-center gap-2">
          {demand.buyer.hostelBlock && (
            <span className="px-1.5 py-0.5 border border-[#2A9D8F] rounded text-[10px] font-bold text-[#1D3557] bg-[#F9C74F]">
              {demand.buyer.hostelBlock}
            </span>
          )}
          {demand.responseCount > 0 && (
            <span className="text-[10px] font-black text-[#1D3557] bg-[#F9C74F] px-1.5 py-0.5 border border-[#1D3557] rounded-sm">
              {demand.responseCount} response{demand.responseCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

