"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Crown,
  Gavel,
  Medal,
  Trophy,
  Users,
  Clock3,
  TrendingUp,
  Sparkles,
  RefreshCw,
  Shield,
} from "lucide-react";

type ViewerRole = "seller" | "buyer" | "guest";

interface AuctionLeader {
  rank: number;
  amount: number;
  createdAt: string;
  bidderId: string;
  bidderLabel: string;
  isCurrentUser: boolean;
  showBidderName: boolean;
}

interface AuctionTimelinePoint {
  step: number;
  amount: number;
  createdAt: string;
  bidderId: string;
  bidderLabel: string;
  isCurrentUser: boolean;
}

interface AuctionState {
  enabled: boolean;
  isClosed: boolean;
  isTimedOut: boolean;
  endsAt: string | null;
  closedAt: string | null;
  deposit: number;
  minBid: number | null;
  maxBid: number | null;
  bidCount: number;
  uniqueBidderCount: number;
  highestBid: AuctionLeader | null;
  myHighestBid: number | null;
  myRank: number | null;
  timeLeftMs: number | null;
  leaderboard: AuctionLeader[];
  timeline: AuctionTimelinePoint[];
}

interface AuctionListing {
  _id: string;
  title: string;
  price: number;
  status: string;
  auctionMode: boolean;
  seller: {
    _id: string;
    displayName: string;
  };
  auctionDeposit: number | null;
  auctionMinBid: number | null;
  auctionMaxBid: number | null;
  auctionEndsAt: string | null;
  auctionClosedAt: string | null;
}

interface AuctionPayload {
  listing: AuctionListing;
  auction: AuctionState;
  viewerRole: ViewerRole;
  canConfigureAuction: boolean;
  canBid: boolean;
  isWinner: boolean;
  transactionId: string | null;
}

function toLocalInputValue(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (v: number) => String(v).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatTimeLeft(ms: number | null) {
  if (ms === null) return "No timer";
  if (ms <= 0) return "Ended";

  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

interface GraphProps {
  timeline: AuctionTimelinePoint[];
  graphRange: { min: number; max: number; span: number };
  highestBid: AuctionLeader | null;
}

function BidLineGraph({ timeline, graphRange, highestBid }: GraphProps) {
  const [drawn, setDrawn] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const prevLenRef = useRef(0);

  useEffect(() => {
    if (timeline.length !== prevLenRef.current) {
      prevLenRef.current = timeline.length;
      setDrawn(false);
      const t = setTimeout(() => setDrawn(true), 60);
      return () => clearTimeout(t);
    }
  }, [timeline.length]);

  const W = 560;
  const H = 200;
  const PAD = { l: 56, r: 20, t: 24, b: 36 };
  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;
  const n = timeline.length;

  const getX = (i: number) => PAD.l + (n <= 1 ? cW / 2 : (i / (n - 1)) * cW);
  const getY = (v: number) => {
    if (graphRange.span === 0) return PAD.t + cH / 2;
    return PAD.t + cH - ((v - graphRange.min) / graphRange.span) * cH;
  };

  const pts = timeline.map((p, i) => ({ ...p, cx: getX(i), cy: getY(p.amount) }));
  const pathD = pts.length >= 2
    ? `M ${pts.map((p) => `${p.cx.toFixed(1)},${p.cy.toFixed(1)}`).join(" L ")}`
    : "";
  const areaD = pts.length >= 2
    ? `M ${pts[0].cx.toFixed(1)},${(PAD.t + cH).toFixed(1)} L ${pts.map((p) => `${p.cx.toFixed(1)},${p.cy.toFixed(1)}`).join(" L ")} L ${pts[n - 1].cx.toFixed(1)},${(PAD.t + cH).toFixed(1)} Z`
    : "";

  const ySteps = [0, 0.25, 0.5, 0.75, 1];

  const hovered = hoveredIdx !== null ? pts[hoveredIdx] : null;
  const tooltipX = hovered ? Math.min(hovered.cx, W - 130) : 0;
  const tooltipY = hovered ? Math.max(PAD.t, hovered.cy - 50) : 0;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full min-w-[280px] select-none"
      >
        {/* Grid lines */}
        {ySteps.map((t) => (
          <line
            key={t}
            x1={PAD.l} y1={PAD.t + cH * (1 - t)}
            x2={PAD.l + cW} y2={PAD.t + cH * (1 - t)}
            stroke="#1D3557" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.25"
          />
        ))}

        {/* Y-axis */}
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={PAD.t + cH} stroke="#1D3557" strokeWidth="1.5" />
        <line x1={PAD.l} y1={PAD.t + cH} x2={PAD.l + cW} y2={PAD.t + cH} stroke="#1D3557" strokeWidth="1.5" />

        {/* Y-axis labels */}
        {ySteps.map((t) => {
          const v = graphRange.min + graphRange.span * t;
          return (
            <text
              key={t}
              x={PAD.l - 5}
              y={PAD.t + cH * (1 - t) + 4}
              textAnchor="end"
              fontSize="9"
              fontWeight="700"
              fill="#1D3557"
              opacity="0.7"
            >
              {v >= 1000 ? `${(v / 1000).toFixed(0)}k` : Math.round(v)}
            </text>
          );
        })}

        {/* Area fill */}
        {areaD && (
          <path d={areaD} fill="#A8DADC" opacity="0.25" />
        )}

        {/* Animated line */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke="#1D3557"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset={drawn ? 0 : 1}
            className={drawn ? "bid-line-draw" : "bid-line-reset"}
          />
        )}

        {/* Data points */}
        {pts.map((p, i) => {
          const isTop = highestBid && p.amount === highestBid.amount && i === n - 1;
          return (
            <g key={`${p.step}-${p.createdAt}`}>
              <circle cx={p.cx} cy={p.cy} r={5}
                fill={p.isCurrentUser ? "#2A9D8F" : isTop ? "#F9C74F" : "#A8DADC"}
                stroke="#1D3557" strokeWidth="2"
              />
              {/* invisible larger hit target */}
              <circle cx={p.cx} cy={p.cy} r={12}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            </g>
          );
        })}

        {/* X-axis step labels */}
        {pts.map((p, i) => (
          <text
            key={i}
            x={p.cx}
            y={PAD.t + cH + 18}
            textAnchor="middle"
            fontSize="8"
            fontWeight="700"
            fill="#1D3557"
            opacity="0.5"
          >
            #{p.step}
          </text>
        ))}

        {/* Tooltip */}
        {hovered && (
          <g transform={`translate(${tooltipX},${tooltipY})`} className="pointer-events-none">
            <rect x={0} y={0} width={118} height={34} rx={4} ry={4}
              fill="#F1FAEE" stroke="#1D3557" strokeWidth="2"
            />
            <rect x={2} y={2} width={118} height={34} rx={4} ry={4}
              fill="none" stroke="#1D3557" strokeWidth="0.5" opacity="0.2"
            />
            <text x={7} y={14} fontSize="9" fontWeight="700" fill="#1D3557">{hovered.bidderLabel}</text>
            <text x={7} y={27} fontSize="10" fontWeight="900" fill="#1D3557">
              ₹{hovered.amount.toLocaleString("en-IN")}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

export default function AuctionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();

  const [data, setData] = useState<AuctionPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);
  const [enabling, setEnabling] = useState(false);
  const [bidding, setBidding] = useState(false);
  const [closingAuction, setClosingAuction] = useState(false);

  const [deposit, setDeposit] = useState("");
  const [minBid, setMinBid] = useState("");
  const [maxBid, setMaxBid] = useState("");
  const [deadline, setDeadline] = useState("");

  const [bidAmount, setBidAmount] = useState("");
  const [showBidderName, setShowBidderName] = useState(false);

  const fetchAuction = useCallback(async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setRefreshing(true);
    try {
      const payload = await api<AuctionPayload>(`/listings/${id}/auction`, token ? { token } : undefined);
      setData(payload);

      if (!payload.listing.auctionMode) {
        setDeposit((prev) => prev || String(Math.max(1, Math.round(payload.listing.price * 0.1))));
        setMinBid((prev) => prev || String(payload.listing.price));
        setMaxBid((prev) => prev || String(Math.max(payload.listing.price + 100, payload.listing.price * 2)));
        setDeadline((prev) => prev || toLocalInputValue(payload.listing.auctionEndsAt));
      } else {
        const nextMin = payload.auction.highestBid ? payload.auction.highestBid.amount + 1 : (payload.auction.minBid || payload.listing.price);
        setBidAmount((prev) => prev || String(nextMin));
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load auction details");
      router.push(`/listings/${id}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, token, router]);

  useEffect(() => {
    fetchAuction();
  }, [fetchAuction]);

  useEffect(() => {
    if (!data?.auction.enabled || data.auction.isClosed) return;
    const timer = setInterval(() => {
      fetchAuction();
    }, 7000);
    return () => clearInterval(timer);
  }, [data?.auction.enabled, data?.auction.isClosed, fetchAuction]);

  const timelineForGraph = useMemo(() => {
    return data?.auction.timeline || [];
  }, [data?.auction.timeline]);

  const graphRange = useMemo(() => {
    const values = timelineForGraph.map((p) => p.amount);
    const floor = data?.auction.minBid || data?.listing.price || 0;
    const min = values.length ? Math.min(...values, floor) : floor;
    const max = values.length ? Math.max(...values, floor) : floor;
    return {
      min,
      max,
      span: Math.max(1, max - min),
    };
  }, [timelineForGraph, data?.auction.minBid, data?.listing.price]);

  const handleEnableAuction = async () => {
    if (!token) {
      toast.error("Please sign in first");
      router.push("/login");
      return;
    }

    const depositVal = Number(deposit);
    const minVal = Number(minBid);
    const maxVal = Number(maxBid);

    if (!Number.isFinite(depositVal) || depositVal <= 0) {
      toast.error("Enter a valid refundable deposit");
      return;
    }
    if (!Number.isFinite(minVal) || minVal <= 0) {
      toast.error("Enter a valid minimum bid");
      return;
    }
    if (!Number.isFinite(maxVal) || maxVal <= minVal) {
      toast.error("Maximum bid must be greater than minimum bid");
      return;
    }

    setEnabling(true);
    try {
      await api(`/listings/${id}/auction`, {
        method: "PUT",
        token,
        body: {
          auctionDeposit: depositVal,
          auctionMinBid: minVal,
          auctionMaxBid: maxVal,
          auctionEndsAt: deadline ? new Date(deadline).toISOString() : null,
        },
      });
      toast.success("Auction mode enabled with your configuration.");
      setBidAmount("");
      await fetchAuction();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to enable auction");
    } finally {
      setEnabling(false);
    }
  };

  const handlePlaceBid = async () => {
    if (!token) {
      toast.error("Sign in to place bids");
      router.push("/login");
      return;
    }

    const amount = Number(bidAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid bid amount");
      return;
    }

    setBidding(true);
    try {
      await api(`/listings/${id}/auction/bid`, {
        method: "POST",
        token,
        body: {
          amount,
          showBidderName,
        },
      });
      toast.success("Bid placed.");
      setBidAmount("");
      await fetchAuction();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to place bid");
    } finally {
      setBidding(false);
    }
  };

  const handleCloseAuction = async () => {
    if (!token) {
      toast.error("Please sign in first");
      return;
    }

    setClosingAuction(true);
    try {
      const result = await api<{ message: string }>(`/listings/${id}/auction/close`, {
        method: "POST",
        token,
      });
      toast.success(result.message || "Auction closed.");
      await fetchAuction();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to close auction");
    } finally {
      setClosingAuction(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-4">
          <div className="h-10 w-64 rounded-md border-2 border-[#1D3557] bg-[var(--surface-alt)] animate-shimmer" />
          <div className="h-64 rounded-md border-2 border-[#1D3557] bg-[var(--surface-alt)] animate-shimmer" />
          <div className="h-72 rounded-md border-2 border-[#1D3557] bg-[var(--surface-alt)] animate-shimmer" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { listing, auction, viewerRole, canConfigureAuction, canBid, isWinner, transactionId } = data;
  const topThree = auction.leaderboard.slice(0, 3);

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Link
            href={`/listings/${id}`}
            className="inline-flex items-center gap-1 text-sm font-bold text-[#1D3557] hover:text-[#1D3557]"
          >
            <ArrowLeft className="w-4 h-4" /> Back to listing
          </Link>
          <Button type="button" variant="outline" size="sm" className="gap-1.5 font-black" onClick={() => fetchAuction(true)}>
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        {/* Winner / Seller post-close banner */}
        {auction.isClosed && isWinner && transactionId && (
          <div className="flex items-center gap-3 border-2 border-[#2A9D8F] bg-[#A8DADC] rounded-md px-4 py-3 shadow-[4px_4px_0px_0px_#2A9D8F]">
            <Trophy className="w-5 h-5 text-[#1D3557] shrink-0" />
            <div className="flex-1">
              <div className="font-black text-[#1D3557]">You won the auction! 🎉</div>
              <div className="text-xs font-medium text-[#1D3557]">
                Your winning bid: ₹{auction.highestBid?.amount.toLocaleString("en-IN")} — complete payment to finish the trade.
              </div>
            </div>
            <Link href={`/transactions/${transactionId}`}>
              <Button size="sm" className="font-black shrink-0 gap-1.5 bg-[#1D3557] text-[#F1FAEE] hover:bg-[#1D3557]">
                <Sparkles className="w-3.5 h-3.5" /> Pay &amp; Confirm
              </Button>
            </Link>
          </div>
        )}

        {auction.isClosed && viewerRole === "seller" && transactionId && auction.highestBid && (
          <div className="flex items-center gap-3 border-2 border-[#F9C74F] bg-[#F9C74F] rounded-md px-4 py-3 shadow-[4px_4px_0px_0px_#1D3557]">
            <Crown className="w-5 h-5 text-[#1D3557] shrink-0" />
            <div className="flex-1">
              <div className="font-black text-[#1D3557]">Auction closed — winner locked.</div>
              <div className="text-xs font-medium text-[#1D3557]">
                Winning bid: ₹{auction.highestBid.amount.toLocaleString("en-IN")} by {auction.highestBid.bidderLabel}. Transaction created automatically.
              </div>
            </div>
            <Link href={`/transactions/${transactionId}`}>
              <Button size="sm" variant="outline" className="font-black shrink-0 gap-1.5">
                <Shield className="w-3.5 h-3.5" /> View Transaction
              </Button>
            </Link>
          </div>
        )}

        {auction.isClosed && !auction.highestBid && (
          <div className="border-2 border-[#1D3557] bg-[var(--surface-alt)] rounded-md px-4 py-3 text-sm font-black text-[#1D3557]">
            Auction closed with no bids.
          </div>
        )}

        <Card className="border-2 border-[#1D3557] bg-[var(--surface)] shadow-[5px_5px_0px_0px_#1D3557] overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-[#1D3557] flex items-center gap-2 text-xl">
              <Gavel className="w-5 h-5" /> {listing.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-md border-2 border-[#1D3557] bg-[#A8DADC] p-3 shadow-[3px_3px_0px_0px_#1D3557]">
                <div className="text-[10px] uppercase font-black tracking-wide">Base Price</div>
                <div className="text-lg font-black text-[#1D3557]">₹{listing.price.toLocaleString("en-IN")}</div>
              </div>
              <div className="rounded-md border-2 border-[#1D3557] bg-[#F9C74F] p-3 shadow-[3px_3px_0px_0px_#1D3557]">
                <div className="text-[10px] uppercase font-black tracking-wide">Highest Bid</div>
                <div className="text-lg font-black text-[#1D3557]">
                  {auction.highestBid ? `₹${auction.highestBid.amount.toLocaleString("en-IN")}` : "No bids"}
                </div>
              </div>
              <div className="rounded-md border-2 border-[#1D3557] bg-[var(--surface-alt)] p-3 shadow-[3px_3px_0px_0px_#1D3557]">
                <div className="text-[10px] uppercase font-black tracking-wide">Participants</div>
                <div className="text-lg font-black text-[#1D3557] inline-flex items-center gap-1">
                  <Users className="w-4 h-4" /> {auction.uniqueBidderCount}
                </div>
              </div>
              <div className="rounded-md border-2 border-[#1D3557] bg-[var(--surface-alt)] p-3 shadow-[3px_3px_0px_0px_#1D3557]">
                <div className="text-[10px] uppercase font-black tracking-wide">Bid Range</div>
                <div className="text-sm font-black text-[#1D3557]">
                  ₹{(auction.minBid ?? listing.price).toLocaleString("en-IN")} - ₹{(auction.maxBid ?? listing.price).toLocaleString("en-IN")}
                </div>
              </div>
              <div className="rounded-md border-2 border-[#1D3557] bg-[var(--surface-alt)] p-3 shadow-[3px_3px_0px_0px_#1D3557]">
                <div className="text-[10px] uppercase font-black tracking-wide">Time Left</div>
                <div className="text-sm font-black text-[#1D3557] inline-flex items-center gap-1">
                  <Clock3 className="w-4 h-4" /> {formatTimeLeft(auction.timeLeftMs)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {!auction.enabled && canConfigureAuction && (
          <Card className="border-2 border-[#1D3557] bg-[var(--surface)] shadow-[5px_5px_0px_0px_#1D3557]">
            <CardHeader>
              <CardTitle className="text-[#1D3557] flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> Configure Auction Upgrade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="deposit">Refundable Deposit (₹)</Label>
                  <Input id="deposit" type="number" min={1} value={deposit} onChange={(e) => setDeposit(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="minBid">Minimum Bid (₹)</Label>
                  <Input id="minBid" type="number" min={1} value={minBid} onChange={(e) => setMinBid(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="maxBid">Maximum Bid (₹)</Label>
                  <Input id="maxBid" type="number" min={1} value={maxBid} onChange={(e) => setMaxBid(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="deadline">Optional Time Limit</Label>
                <Input id="deadline" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                <p className="text-xs font-medium text-[#1D3557]">Leave empty to run auction without a timer and close it manually.</p>
              </div>

              <Button onClick={handleEnableAuction} disabled={enabling} className="w-full font-black py-5 gap-2">
                <Gavel className="w-4 h-4" /> {enabling ? "Enabling Auction..." : "Enable Auction with These Rules"}
              </Button>
            </CardContent>
          </Card>
        )}

        {!auction.enabled && !canConfigureAuction && (
          <Card className="border-2 border-[#1D3557] bg-[var(--surface)] shadow-[5px_5px_0px_0px_#1D3557]">
            <CardContent className="p-5 text-sm font-bold text-[#1D3557]">
              Auction mode is not enabled yet. Only the seller can configure min/max bid and optional time limit.
            </CardContent>
          </Card>
        )}

        {auction.enabled && (
          <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
            <div className="space-y-4">
              <Card className="border-2 border-[#1D3557] bg-[var(--surface)] shadow-[5px_5px_0px_0px_#1D3557]">
                <CardHeader>
                  <CardTitle className="text-[#1D3557]">Live Auction Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-md border-2 border-[#1D3557] bg-[#F1FAEE] p-3 text-xs font-bold text-[#1D3557]">
                    Deposit: ₹{auction.deposit.toLocaleString("en-IN")} | Bid window: ₹{(auction.minBid ?? listing.price).toLocaleString("en-IN")} - ₹{(auction.maxBid ?? listing.price).toLocaleString("en-IN")}
                  </div>

                  {canBid ? (
                    <>
                      <div className="space-y-1">
                        <Label htmlFor="bidAmount">Your Bid Amount (₹)</Label>
                        <Input
                          id="bidAmount"
                          type="number"
                          min={auction.minBid ?? listing.price}
                          max={auction.maxBid ?? undefined}
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                        />
                      </div>

                      <label className="flex items-center gap-2 text-xs font-black text-[#1D3557] border-2 border-[#1D3557] rounded-md px-3 py-2 bg-[var(--surface-alt)]">
                        <input
                          type="checkbox"
                          checked={showBidderName}
                          onChange={(e) => setShowBidderName(e.target.checked)}
                          className="h-3.5 w-3.5"
                        />
                        Show my name publicly on this bid
                      </label>

                      <Button onClick={handlePlaceBid} disabled={bidding || auction.isClosed} className="w-full font-black gap-2">
                        <TrendingUp className="w-4 h-4" /> {bidding ? "Submitting Bid..." : "Place Bid"}
                      </Button>
                    </>
                  ) : (
                    <div className="rounded-md border-2 border-[#1D3557] bg-[var(--surface-alt)] p-3 text-xs font-bold text-[#1D3557]">
                      {viewerRole === "guest"
                        ? "Sign in to place bids."
                        : viewerRole === "seller"
                          ? "You are the seller. You can monitor bids and close the auction."
                          : auction.isClosed
                            ? "This auction is closed."
                            : "Bidding is currently unavailable."}
                    </div>
                  )}

                  {viewerRole === "seller" && !auction.isClosed && (
                    <Button type="button" variant="outline" onClick={handleCloseAuction} disabled={closingAuction} className="w-full font-black gap-2">
                      <Shield className="w-4 h-4" /> {closingAuction ? "Closing Auction..." : "Close Auction & Lock Winner"}
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card className="border-2 border-[#1D3557] bg-[var(--surface)] shadow-[5px_5px_0px_0px_#1D3557]">
                <CardHeader>
                  <CardTitle className="text-[#1D3557]">Top 3 Bidders</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {topThree.length === 0 && (
                    <div className="text-xs font-bold text-[#1D3557]">No bids yet.</div>
                  )}

                  {topThree.map((entry) => (
                    <div key={entry.rank} className="flex items-center justify-between gap-2 rounded-md border-2 border-[#1D3557] bg-[var(--surface-alt)] p-2.5 shadow-[2px_2px_0px_0px_#1D3557]">
                      <div className="inline-flex items-center gap-2 font-black text-[#1D3557]">
                        {entry.rank === 1 && <Crown className="w-4 h-4 text-[#F9C74F]" />}
                        {entry.rank === 2 && <Trophy className="w-4 h-4 text-[#2A9D8F]" />}
                        {entry.rank === 3 && <Medal className="w-4 h-4 text-[#F3722C]" />}
                        <span>{entry.bidderLabel}</span>
                      </div>
                      <div className="font-black text-[#1D3557]">₹{entry.amount.toLocaleString("en-IN")}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="border-2 border-[#1D3557] bg-[linear-gradient(135deg,var(--surface)_0%,#F1FAEE_45%,#D8E2DC_100%)] shadow-[6px_6px_0px_0px_#1D3557]">
                <CardHeader>
                  <CardTitle className="text-[#1D3557] flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" /> Live Bid Graph
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {timelineForGraph.length === 0 ? (
                    <div className="h-52 rounded-md border-2 border-dashed border-[#1D3557] flex items-center justify-center text-sm font-bold text-[#1D3557] bg-[var(--surface-alt)]">
                      Waiting for first bid…
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="rounded-md border-2 border-[#1D3557] bg-[var(--surface)] p-2 shadow-[2px_2px_0px_0px_#1D3557]">
                        <BidLineGraph
                          timeline={timelineForGraph}
                          graphRange={graphRange}
                          highestBid={auction.highestBid}
                        />
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-[#1D3557]">
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block w-3 h-3 rounded-full border border-[#1D3557] bg-[#2A9D8F]" /> Your bids
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block w-3 h-3 rounded-full border border-[#1D3557] bg-[#F9C74F]" /> Highest bid
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block w-3 h-3 rounded-full border border-[#1D3557] bg-[#A8DADC]" /> Other bids
                        </span>
                      </div>
                      <div className="text-[10px] font-medium text-[#1D3557]/60">
                        Hover a point to see bidder · names shown only when bidder chose to reveal identity
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-2 border-[#1D3557] bg-[var(--surface)] shadow-[5px_5px_0px_0px_#1D3557]">
                <CardHeader>
                  <CardTitle className="text-[#1D3557]">Leaderboard</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {auction.leaderboard.length === 0 && (
                    <div className="text-xs font-bold text-[#1D3557]">No bids placed yet.</div>
                  )}

                  {auction.leaderboard.map((entry) => (
                    <div key={`${entry.bidderId}-${entry.rank}`} className={`grid grid-cols-[56px_1fr_auto] items-center gap-2 rounded-md border-2 border-[#1D3557] px-3 py-2 shadow-[2px_2px_0px_0px_#1D3557] ${entry.rank <= 3 ? "bg-[#F9C74F]/35" : "bg-[var(--surface-alt)]"}`}>
                      <div className="font-black text-[#1D3557]">#{entry.rank}</div>
                      <div className="font-bold text-[#1D3557] truncate">{entry.bidderLabel}</div>
                      <div className="font-black text-[#1D3557]">₹{entry.amount.toLocaleString("en-IN")}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
