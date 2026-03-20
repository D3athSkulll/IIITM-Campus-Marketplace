"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Star,
  AlertTriangle,
  ArrowLeft,
  CreditCard,
  Smartphone,
  Banknote,
  Loader2,
  ShieldCheck,
  Gavel,
  Clock,
  Package,
} from "lucide-react";

type PaymentStep = "choose" | "processing" | "done";
type PayMethod = "upi" | "card" | "cash";

const STATUS_CONFIG: Record<string, { label: string; bg: string; desc: string }> = {
  "pending-confirmation": { label: "Awaiting Handover", bg: "bg-[#F9C74F] text-[#1D3557]", desc: "Complete payment and confirm handover." },
  confirmed:   { label: "Fully Confirmed",  bg: "bg-[#A8DADC] text-[#1D3557]", desc: "Both parties confirmed. Completing trade…" },
  completed:   { label: "Trade Complete",   bg: "bg-[#D8E2DC] text-[#1D3557]", desc: "Trade is done. Rate your experience below." },
  disputed:    { label: "Disputed",         bg: "bg-[#E63946] text-[#F1FAEE]", desc: "Return request submitted. Contact support." },
  cancelled:   { label: "Cancelled",        bg: "bg-[var(--surface-alt)] text-[#1D3557] border border-[#1D3557]", desc: "Transaction was cancelled." },
};

function StepDot({ done, active }: { done: boolean; active: boolean }) {
  return (
    <div className={`w-7 h-7 rounded-full border-2 border-[#1D3557] flex items-center justify-center shrink-0 font-black text-xs transition-colors
      ${done ? "bg-[#2A9D8F] text-[#F1FAEE]" : active ? "bg-[#F9C74F] text-[#1D3557]" : "bg-[var(--surface-alt)] text-[#1D3557]"}`}
    >
      {done ? <CheckCircle2 className="w-4 h-4" /> : ""}
    </div>
  );
}

export default function TransactionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, token, isLoading } = useAuth();

  const [transaction, setTransaction] = useState<any>(null);
  const [hasRated, setHasRated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [comment, setComment] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [showReturn, setShowReturn] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Payment state
  const [payStep, setPayStep] = useState<PaymentStep>("choose");
  const [payMethod, setPayMethod] = useState<PayMethod>("upi");
  const [upiId, setUpiId] = useState("");
  const [cardNum, setCardNum] = useState("");

  const fetchTransaction = async () => {
    try {
      const data = await api<any>(`/transactions/${id}`, { token });
      setTransaction(data.transaction);
      setHasRated(data.hasRated);
      if (data.transaction.paymentStatus === "paid") setPayStep("done");
    } catch {
      toast.error("Transaction not found");
      router.push("/profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.replace("/login"); return; }
    fetchTransaction();
  }, [id, user, isLoading]);

  const simulatePayment = async () => {
    if (payMethod === "upi" && !upiId.includes("@")) {
      toast.error("Enter a valid UPI ID (e.g. name@upi)");
      return;
    }
    if (payMethod === "card" && cardNum.replace(/\s/g, "").length < 16) {
      toast.error("Enter a valid 16-digit card number");
      return;
    }
    setPayStep("processing");
    await new Promise((r) => setTimeout(r, 1800));
    try {
      await api(`/transactions/${id}/pay`, { method: "PUT", body: { paymentMethod: payMethod }, token });
      setPayStep("done");
      toast.success("Payment confirmed!");
      await fetchTransaction();
    } catch {
      setPayStep("choose");
      toast.error("Payment confirmation failed. Try again.");
    }
  };

  const confirmHandover = async () => {
    setActionLoading(true);
    try {
      const res = await api<any>(`/transactions/${id}/confirm`, { method: "PUT", token });
      if (res.autoCompleted) {
        toast.success("Both parties confirmed — trade complete! 🎉");
      } else {
        toast.success(res.message || "Handover confirmed!");
      }
      await fetchTransaction();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to confirm");
    } finally {
      setActionLoading(false);
    }
  };

  const submitRating = async () => {
    if (!rating) { toast.error("Please select a star rating"); return; }
    setActionLoading(true);
    try {
      await api<any>(`/transactions/${id}/rate`, { method: "POST", body: { score: rating, comment }, token });
      toast.success("Rating submitted anonymously.");
      setHasRated(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to submit rating");
    } finally {
      setActionLoading(false);
    }
  };

  const requestReturn = async () => {
    if (!returnReason.trim()) { toast.error("Please provide a reason"); return; }
    setActionLoading(true);
    try {
      await api<any>(`/transactions/${id}/return`, { method: "PUT", body: { reason: returnReason }, token });
      toast.success("Return request submitted.");
      setShowReturn(false);
      await fetchTransaction();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to request return");
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-transparent">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
          <div className="h-40 rounded-md animate-shimmer border-2 border-[#1D3557]" />
          <div className="h-32 rounded-md animate-shimmer border-2 border-[#1D3557]" />
          <div className="h-24 rounded-md animate-shimmer border-2 border-[#1D3557]" />
        </div>
      </div>
    );
  }

  if (!transaction) return null;

  const isBuyer = user?._id === transaction.buyer._id;
  const myRole = isBuyer ? "buyer" : "seller";
  const other = isBuyer ? transaction.seller : transaction.buyer;
  const myConfirmed = isBuyer ? transaction.buyerConfirmed : transaction.sellerConfirmed;
  const otherConfirmed = isBuyer ? transaction.sellerConfirmed : transaction.buyerConfirmed;
  const agreedPrice = transaction.agreedPrice;
  const paymentDone = transaction.paymentStatus === "paid";
  const isAuction = transaction.source === "auction";
  const cfg = STATUS_CONFIG[transaction.status] ?? STATUS_CONFIG["pending-confirmation"];

  // Progress steps
  const step1 = paymentDone;   // buyer paid
  const step2 = transaction.buyerConfirmed;   // buyer confirmed receipt
  const step3 = transaction.sellerConfirmed;  // seller confirmed handover
  const step4 = transaction.status === "completed";

  const activeStep = !step1 ? 1 : !step2 ? 2 : !step3 ? 3 : !step4 ? 4 : 4;

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <Link href="/profile" className="inline-flex items-center gap-1 text-sm font-bold text-[#1D3557] hover:text-[#1D3557] hover:bg-[#F1FAEE]/45 px-2 py-1 rounded-md transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to profile
        </Link>

        {/* Header card */}
        <Card className="border-2 border-[#1D3557] shadow-[4px_4px_0px_0px_#1D3557]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-base flex items-center gap-2">
                {isAuction ? <Gavel className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                {isAuction ? "Auction Transaction" : "Trade"}
              </CardTitle>
              <Badge className={`text-xs font-black capitalize ${cfg.bg}`}>
                {cfg.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {transaction.listing && (
              <div className="flex items-center gap-3 p-3 bg-[var(--surface-soft)] border-2 border-[#1D3557] rounded-md">
                {transaction.listing.images?.[0] && (
                  <img src={transaction.listing.images[0]} alt="" className="w-14 h-14 rounded-sm object-cover border border-[#1D3557] shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-black text-sm truncate">{transaction.listing.title}</div>
                  <div className="text-xs text-[#1D3557] font-medium capitalize">{transaction.listing.category}</div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-y-2 text-sm border-2 border-[#1D3557] rounded-md p-3 bg-[var(--surface-alt)]">
              <span className="font-medium text-[#1D3557]">{isAuction ? "Winning Bid" : "Agreed Price"}</span>
              <span className="font-black text-right text-base">₹{agreedPrice?.toLocaleString("en-IN")}</span>
              <span className="font-medium text-[#1D3557]">{isBuyer ? "Seller" : "Buyer"}</span>
              <span className="font-bold text-right">{other.displayName}</span>
              <span className="font-medium text-[#1D3557]">Your role</span>
              <span className="font-bold text-right capitalize">{myRole}</span>
            </div>
          </CardContent>
        </Card>

        {/* ── PROGRESS STEPPER ──────────────────────────────────────────────────── */}
        <Card className="border-2 border-[#1D3557] shadow-[4px_4px_0px_0px_#1D3557]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" /> Trade Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  n: 1,
                  done: step1,
                  label: "Payment",
                  desc: step1
                    ? `₹${agreedPrice?.toLocaleString("en-IN")} paid (${transaction.paymentMethod})`
                    : isBuyer ? "Complete payment below" : "Waiting for buyer to pay",
                },
                {
                  n: 2,
                  done: step2,
                  label: "Buyer confirms receipt",
                  desc: step2 ? "Buyer received the item ✓" : !step1 ? "Pending payment" : isBuyer ? "Confirm you received the item" : "Waiting for buyer",
                },
                {
                  n: 3,
                  done: step3,
                  label: "Seller confirms handover",
                  desc: step3 ? "Seller handed over the item ✓" : !step1 ? "Pending payment" : !isBuyer ? "Confirm you handed over the item" : "Waiting for seller",
                },
                {
                  n: 4,
                  done: step4,
                  label: "Trade complete",
                  desc: step4 ? "Listing removed. Rate your experience below." : "Happens automatically when both confirm",
                },
              ].map(({ n, done, label, desc }) => {
                const isActive = n === activeStep && !step4;
                return (
                  <div key={n} className="flex items-start gap-3">
                    <StepDot done={done} active={isActive} />
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className={`text-sm font-black ${done ? "text-[#2A9D8F]" : isActive ? "text-[#1D3557]" : "text-[#1D3557]/50"}`}>
                        {label}
                      </div>
                      <div className="text-xs font-medium text-[#1D3557]/60">{desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── PAYMENT GATEWAY (buyer only, before payment) ─────────────────────── */}
        {isBuyer && !paymentDone && transaction.status === "pending-confirmation" && (
          <Card className="border-2 border-[#F3722C] shadow-[6px_6px_0px_0px_#F3722C]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" /> Step 1 — Pay ₹{agreedPrice?.toLocaleString("en-IN")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {payStep === "choose" && (
                <>
                  <p className="text-xs font-bold text-[#1D3557]/70">
                    Simulated payment — no real money moves. After paying, both parties confirm physical handover.
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["upi", "card", "cash"] as PayMethod[]).map((m) => {
                      const icons = { upi: <Smartphone className="w-4 h-4" />, card: <CreditCard className="w-4 h-4" />, cash: <Banknote className="w-4 h-4" /> };
                      const labels = { upi: "UPI", card: "Card", cash: "Cash" };
                      return (
                        <button
                          key={m} type="button" onClick={() => setPayMethod(m)}
                          className={`flex flex-col items-center gap-1 p-3 rounded-md border-2 border-[#1D3557] font-black text-xs transition-all
                            ${payMethod === m ? "bg-[#F9C74F] shadow-[3px_3px_0px_0px_#1D3557]" : "bg-[var(--surface-alt)] hover:bg-[#F9C74F] shadow-[2px_2px_0px_0px_#1D3557]"}`}
                        >
                          {icons[m]}{labels[m]}
                        </button>
                      );
                    })}
                  </div>
                  {payMethod === "upi" && (
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase tracking-wide">UPI ID</label>
                      <Input placeholder="name@ybl / @okaxis" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
                    </div>
                  )}
                  {payMethod === "card" && (
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-xs font-black uppercase tracking-wide">Card Number</label>
                        <Input
                          placeholder="1234 5678 9012 3456" value={cardNum} maxLength={19}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                            setCardNum(v.replace(/(.{4})/g, "$1 ").trim());
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="MM/YY" maxLength={5} />
                        <Input placeholder="CVV" type="password" maxLength={3} />
                      </div>
                    </div>
                  )}
                  {payMethod === "cash" && (
                    <div className="border-2 border-[#1D3557] rounded-md p-3 text-xs font-bold text-[#1D3557] bg-[var(--surface-alt)]">
                      Pay ₹{agreedPrice?.toLocaleString("en-IN")} in cash when you meet the seller. Tap below to log the intent.
                    </div>
                  )}
                  <Button type="button" onClick={simulatePayment} className="w-full font-black text-base py-5">
                    {payMethod === "cash" ? "Confirm Cash Intent" : `Pay ₹${agreedPrice?.toLocaleString("en-IN")}`}
                  </Button>
                </>
              )}
              {payStep === "processing" && (
                <div className="flex flex-col items-center gap-4 py-6">
                  <Loader2 className="w-10 h-10 animate-spin text-[#1D3557]" />
                  <div className="font-black text-center">Processing payment…</div>
                  <div className="text-xs text-[#1D3557]/60 font-medium text-center">Do not close this page</div>
                </div>
              )}
              {payStep === "done" && (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="w-16 h-16 rounded-full bg-[#D8E2DC] border-2 border-[#1D3557] flex items-center justify-center shadow-[4px_4px_0px_0px_#1D3557]">
                    <ShieldCheck className="w-8 h-8 text-[#1D3557]" />
                  </div>
                  <div className="font-black text-lg">Payment Done!</div>
                  <div className="text-xs font-bold text-center text-[#1D3557]/70">Now confirm receipt after you physically receive the item.</div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── HANDOVER CONFIRMATION ─────────────────────────────────────────────── */}
        {paymentDone && !step4 && (
          <Card className="border-2 border-[#1D3557] shadow-[4px_4px_0px_0px_#1D3557]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                {myConfirmed ? "Waiting for the other party" : isBuyer ? "Step 2 — Confirm Receipt" : "Step 3 — Confirm Handover"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {[
                  { label: `You (${myRole})`, confirmed: myConfirmed, yours: true },
                  { label: other.displayName, confirmed: otherConfirmed, yours: false },
                ].map(({ label, confirmed, yours }) => (
                  <div key={label} className={`flex items-center gap-3 p-3 rounded-md border-2 border-[#1D3557] text-sm font-bold transition-colors
                    ${confirmed ? "bg-[#D8E2DC]" : "bg-[var(--surface-alt)]"}`}
                  >
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${confirmed ? "text-[#2A9D8F]" : "opacity-30"}`} />
                    <span className="flex-1">{label}</span>
                    <span className={`text-xs font-black ${confirmed ? "text-[#2A9D8F]" : "text-[#1D3557]/50"}`}>
                      {confirmed ? "Confirmed ✓" : yours ? "Action needed" : "Pending…"}
                    </span>
                  </div>
                ))}
              </div>

              {!myConfirmed && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-[#1D3557]/70">
                    {isBuyer
                      ? "Only confirm after you have physically received the item and verified its condition."
                      : "Only confirm after you have physically handed over the item to the buyer."}
                  </p>
                  <Button
                    type="button"
                    onClick={confirmHandover}
                    disabled={actionLoading}
                    className="w-full font-black py-5 gap-2 bg-[#2A9D8F] text-[#F1FAEE] border-[#1D3557] hover:bg-[#21867A] shadow-[4px_4px_0px_0px_#1D3557] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {actionLoading ? "Confirming…" : isBuyer ? "I Received the Item" : "I Handed Over the Item"}
                  </Button>
                </div>
              )}

              {myConfirmed && !otherConfirmed && (
                <div className="flex items-center gap-2 text-sm font-bold text-[#1D3557] bg-[#F9C74F] border-2 border-[#1D3557] rounded-md p-3">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  Waiting for {other.displayName} to confirm…
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── COMPLETED STATE ───────────────────────────────────────────────────── */}
        {step4 && (
          <div className="border-2 border-[#2A9D8F] bg-[#D8E2DC] rounded-md p-4 shadow-[4px_4px_0px_0px_#2A9D8F] flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-[#2A9D8F] shrink-0" />
            <div>
              <div className="font-black text-[#1D3557]">Trade Complete!</div>
              <div className="text-xs font-medium text-[#1D3557]/70">The listing has been marked as sold. Thank you for using CampusMarket.</div>
            </div>
          </div>
        )}

        {/* ── RATING (after completion) ─────────────────────────────────────────── */}
        {step4 && !hasRated && (
          <Card className="border-2 border-[#F3722C] shadow-[4px_4px_0px_0px_#F3722C]">
            <CardHeader>
              <CardTitle>Rate {other.displayName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-[var(--surface-alt)] border-2 border-[#1D3557] rounded-md p-3 text-xs font-bold text-[#1D3557] space-y-1">
                <p>Ratings are <strong>anonymous</strong> — the other person cannot see who rated them.</p>
                <p>Visible only after <strong>5+ completed trades</strong> to prevent gaming.</p>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} type="button" aria-label={`Rate ${s} stars`}
                    onMouseEnter={() => setRatingHover(s)} onMouseLeave={() => setRatingHover(0)}
                    onClick={() => setRating(s)} className="p-1"
                  >
                    <Star className={`w-8 h-8 transition-colors border border-[#1D3557] rounded-sm
                      ${s <= (ratingHover || rating) ? "fill-[#F3722C] stroke-[#1D3557]" : "stroke-[#2A9D8F] fill-[var(--surface-alt)]"}`} />
                  </button>
                ))}
              </div>
              <textarea
                placeholder="Optional comment (stays anonymous)"
                value={comment} onChange={(e) => setComment(e.target.value)}
                maxLength={500} rows={2}
                className="w-full px-3 py-2 rounded-md border-2 border-[#1D3557] bg-[var(--surface-alt)] text-sm resize-none focus:outline-none font-medium"
              />
              <Button type="button" onClick={submitRating} disabled={actionLoading || !rating} className="w-full font-black">
                {actionLoading ? "Submitting…" : "Submit Rating"}
              </Button>
            </CardContent>
          </Card>
        )}

        {hasRated && step4 && (
          <div className="text-center text-sm font-black text-[#1D3557] flex items-center justify-center gap-2 p-3 border-2 border-[#D8E2DC] rounded-md bg-[#D8E2DC]/25">
            <CheckCircle2 className="w-4 h-4" /> Rating submitted. All done!
          </div>
        )}

        {/* Return window */}
        {isBuyer && step4 && transaction.isReturnEligible && !transaction.returnPolicy?.returnRequested && !showReturn && (
          <button type="button" onClick={() => setShowReturn(true)} className="text-xs font-bold text-[#1D3557] flex items-center gap-1 hover:underline">
            <AlertTriangle className="w-3 h-3" /> Request return within 2 days
          </button>
        )}
        {showReturn && (
          <Card className="border-2 border-[#E63946] shadow-[4px_4px_0px_0px_#E63946]">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-black text-[#1D3557]">Request Return</h3>
              <textarea
                placeholder="Reason for return…" value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)} rows={2}
                className="w-full px-3 py-2 rounded-md border-2 border-[#1D3557] bg-[var(--surface-alt)] text-sm resize-none focus:outline-none"
              />
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={requestReturn} disabled={actionLoading}
                  className="font-black bg-[#E63946] text-[#F1FAEE] hover:bg-[#C92D39] border-[#1D3557]">
                  Submit Return
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setShowReturn(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
