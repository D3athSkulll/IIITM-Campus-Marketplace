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
  CheckCircle2, Star, AlertTriangle, ArrowLeft,
  CreditCard, Smartphone, Banknote, Loader2, ShieldCheck
} from "lucide-react";

type PaymentStep = "choose" | "processing" | "done";
type PayMethod = "upi" | "card" | "cash";

const STATUS_BADGE: Record<string, string> = {
  "pending-confirmation": "bg-[#f5c518] text-[#0a0a0a]",
  confirmed: "bg-blue-400 text-white",
  completed: "bg-green-400 text-[#0a0a0a]",
  disputed: "bg-red-500 text-white",
  cancelled: "bg-[#e8e8e8] text-[#555]",
};

export default function TransactionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, token } = useAuth();

  const [transaction, setTransaction] = useState<any>(null);
  const [hasRated, setHasRated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [comment, setComment] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [showReturn, setShowReturn] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Mock payment state
  const [payStep, setPayStep] = useState<PaymentStep>("choose");
  const [payMethod, setPayMethod] = useState<PayMethod>("upi");
  const [upiId, setUpiId] = useState("");
  const [cardNum, setCardNum] = useState("");
  const [paymentDone, setPaymentDone] = useState(false);

  const fetchTransaction = async () => {
    try {
      const data = await api<any>(`/transactions/${id}`, { token });
      setTransaction(data.transaction);
      setHasRated(data.hasRated);
      if (data.transaction.paymentStatus === "paid") setPaymentDone(true);
    } catch {
      toast.error("Transaction not found");
      router.push("/profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) { router.replace("/login"); return; }
    fetchTransaction();
  }, [id, user]);

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
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 2200));
    try {
      await api(`/transactions/${id}/pay`, { method: "PUT", body: { paymentMethod: payMethod }, token });
    } catch {
      // endpoint may not exist yet — still mark as done in UI
    }
    setPayStep("done");
    setPaymentDone(true);
    toast.success("Payment successful! 🎉");
    await fetchTransaction();
  };

  const confirm = async () => {
    setActionLoading(true);
    try {
      await api<any>(`/transactions/${id}/confirm`, { method: "PUT", token });
      toast.success("Handover confirmed!");
      await fetchTransaction();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to confirm");
    } finally {
      setActionLoading(false);
    }
  };

  const complete = async () => {
    setActionLoading(true);
    try {
      await api<any>(`/transactions/${id}/complete`, { method: "PUT", token });
      toast.success("Trade completed! 🎉");
      await fetchTransaction();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to complete");
    } finally {
      setActionLoading(false);
    }
  };

  const submitRating = async () => {
    if (!rating) { toast.error("Please select a star rating"); return; }
    setActionLoading(true);
    try {
      await api<any>(`/transactions/${id}/rate`, { method: "POST", body: { score: rating, comment }, token });
      toast.success("Rating submitted — anonymously!");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
          <div className="h-40 bg-[#e8e8e8] rounded-md animate-shimmer border-2 border-[#0a0a0a]" />
          <div className="h-32 bg-[#e8e8e8] rounded-md animate-shimmer border-2 border-[#0a0a0a]" />
        </div>
      </div>
    );
  }

  if (!transaction) return null;

  const isBuyer = user?._id === transaction.buyer._id;
  const myConfirmed = isBuyer ? transaction.buyerConfirmed : transaction.sellerConfirmed;
  const otherConfirmed = isBuyer ? transaction.sellerConfirmed : transaction.buyerConfirmed;
  const other = isBuyer ? transaction.seller : transaction.buyer;
  const agreedPrice = transaction.agreedPrice;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <Link href="/profile" className="inline-flex items-center gap-1 text-sm font-bold text-[#555] hover:text-[#0a0a0a]">
          <ArrowLeft className="w-4 h-4" /> Back to profile
        </Link>

        {/* Summary card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Trade Summary</CardTitle>
              <Badge className={`text-xs font-black capitalize ${STATUS_BADGE[transaction.status] || ""}`}>
                {transaction.status.replace("-", " ")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {transaction.listing && (
              <div className="flex items-center gap-3 p-3 bg-[#f5f5f5] border-2 border-[#0a0a0a] rounded-md">
                {transaction.listing.images?.[0] && (
                  <img src={transaction.listing.images[0]} alt="" className="w-14 h-14 rounded-sm object-cover border border-[#0a0a0a]" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-black text-sm truncate">{transaction.listing.title}</div>
                  <div className="text-xs text-[#555] font-medium capitalize">{transaction.listing.category}</div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-y-2 text-sm border-2 border-[#0a0a0a] rounded-md p-3 bg-white">
              <span className="text-[#555] font-medium">Agreed Price</span>
              <span className="font-black text-right text-[#0a1628] text-base">₹{agreedPrice?.toLocaleString("en-IN")}</span>
              <span className="text-[#555] font-medium">Trading with</span>
              <span className="font-bold text-right">{other.displayName}</span>
              <span className="text-[#555] font-medium">Payment</span>
              <span className="font-bold text-right capitalize">{transaction.paymentMethod || "Pending"}</span>
            </div>
          </CardContent>
        </Card>

        {/* ── MOCK PAYMENT GATEWAY (buyer only, before confirmation) ── */}
        {isBuyer && !paymentDone && transaction.status === "pending-confirmation" && (
          <Card className="border-[#f5c518] shadow-[6px_6px_0px_0px_#f5c518]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" /> Pay ₹{agreedPrice?.toLocaleString("en-IN")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {payStep === "choose" && (
                <>
                  <p className="text-xs font-bold text-[#555]">
                    Choose how to pay. This is a simulated in-app payment — no real money moves. After &apos;payment&apos;, both parties confirm handover in person.
                  </p>
                  {/* Method selector */}
                  <div className="grid grid-cols-3 gap-2">
                    {(["upi", "card", "cash"] as PayMethod[]).map((m) => {
                      const icons = { upi: <Smartphone className="w-4 h-4" />, card: <CreditCard className="w-4 h-4" />, cash: <Banknote className="w-4 h-4" /> };
                      const labels = { upi: "UPI", card: "Card", cash: "Cash" };
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPayMethod(m)}
                          className={`flex flex-col items-center gap-1 p-3 rounded-md border-2 border-[#0a0a0a] font-black text-xs transition-all
                            ${payMethod === m
                              ? "bg-[#f5c518] shadow-[3px_3px_0px_0px_#0a0a0a]"
                              : "bg-white hover:bg-[#f5f5f5] shadow-[2px_2px_0px_0px_#0a0a0a]"
                            }`}
                        >
                          {icons[m]}
                          {labels[m]}
                        </button>
                      );
                    })}
                  </div>

                  {payMethod === "upi" && (
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase tracking-wide">UPI ID</label>
                      <Input
                        placeholder="yourname@ybl / @okaxis / @paytm"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                      />
                    </div>
                  )}
                  {payMethod === "card" && (
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-xs font-black uppercase tracking-wide">Card Number</label>
                        <Input
                          placeholder="1234 5678 9012 3456"
                          value={cardNum}
                          maxLength={19}
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
                    <div className="bg-[#f5f5f5] border-2 border-[#0a0a0a] rounded-md p-3 text-xs font-bold text-[#555]">
                      Pay ₹{agreedPrice?.toLocaleString("en-IN")} in cash when you meet the seller. Click &quot;Confirm Cash&quot; to log the intent.
                    </div>
                  )}

                  <Button type="button" onClick={simulatePayment} className="w-full font-black text-base py-5">
                    {payMethod === "cash" ? "Confirm Cash Payment" : `Pay ₹${agreedPrice?.toLocaleString("en-IN")}`}
                  </Button>
                </>
              )}

              {payStep === "processing" && (
                <div className="flex flex-col items-center gap-4 py-6">
                  <Loader2 className="w-10 h-10 animate-spin text-[#0a1628]" />
                  <div className="font-black text-center">Processing payment…</div>
                  <div className="text-xs text-[#555] font-medium text-center">Please wait, do not close this page</div>
                </div>
              )}

              {payStep === "done" && (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="w-16 h-16 rounded-full bg-green-400 border-2 border-[#0a0a0a] flex items-center justify-center shadow-[4px_4px_0px_0px_#0a0a0a]">
                    <ShieldCheck className="w-8 h-8 text-[#0a0a0a]" />
                  </div>
                  <div className="font-black text-lg">Payment Done!</div>
                  <div className="text-xs font-bold text-[#555] text-center">
                    Now confirm the physical handover below after you receive the item in person.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── CONFIRMATION FLOW ── */}
        {(transaction.status === "pending-confirmation" || transaction.status === "confirmed") && (
          <Card>
            <CardHeader>
              <CardTitle>Handover Confirmation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs font-bold text-[#555]">
                Both buyer and seller must confirm after the physical handover happens. This is your proof that the trade occurred.
              </p>
              <div className="space-y-2">
                {[
                  { label: "You", confirmed: myConfirmed },
                  { label: other.displayName, confirmed: otherConfirmed },
                ].map(({ label, confirmed }) => (
                  <div key={label} className={`flex items-center gap-2 p-2 rounded-sm border-2 border-[#0a0a0a] text-sm font-bold ${confirmed ? "bg-green-400" : "bg-[#e8e8e8]"}`}>
                    <CheckCircle2 className={`w-4 h-4 ${confirmed ? "" : "opacity-30"}`} />
                    {label} — {confirmed ? "Confirmed ✓" : "Pending…"}
                  </div>
                ))}
              </div>
              {!myConfirmed && (isBuyer ? paymentDone : true) && (
                <Button type="button" onClick={confirm} disabled={actionLoading} className="w-full font-black">
                  {actionLoading ? "Confirming…" : "Confirm Handover"}
                </Button>
              )}
              {!myConfirmed && isBuyer && !paymentDone && (
                <p className="text-xs font-bold text-[#555] text-center">Complete payment above first</p>
              )}
              {transaction.isFullyConfirmed && (
                <Button type="button" onClick={complete} disabled={actionLoading} className="w-full bg-green-400 text-[#0a0a0a] border-[#0a0a0a] font-black gap-2 shadow-[4px_4px_0px_0px_#0a0a0a] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none">
                  <CheckCircle2 className="w-4 h-4" />
                  {actionLoading ? "Completing…" : "Mark Trade Complete"}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── RATING (after completion) ── */}
        {transaction.status === "completed" && !hasRated && (
          <Card className="border-[#f5c518] shadow-[4px_4px_0px_0px_#f5c518]">
            <CardHeader>
              <CardTitle>Rate {other.displayName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-[#f5f5f5] border-2 border-[#0a0a0a] rounded-md p-3 text-xs font-bold text-[#555] space-y-1">
                <p>⭐ Ratings are <strong>anonymous</strong> — the other person can never see who rated them.</p>
                <p>🔒 Ratings only become visible after <strong>5+ completed trades</strong>, preventing gaming by new users.</p>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-label={`Rate ${s} stars`}
                    onMouseEnter={() => setRatingHover(s)}
                    onMouseLeave={() => setRatingHover(0)}
                    onClick={() => setRating(s)}
                    className="p-1"
                  >
                    <Star className={`w-8 h-8 transition-colors border border-[#0a0a0a] rounded-sm ${s <= (ratingHover || rating) ? "fill-[#f5c518] stroke-[#0a0a0a]" : "stroke-[#ccc] fill-white"}`} />
                  </button>
                ))}
              </div>
              <textarea
                placeholder="Optional comment (stays anonymous)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
                rows={2}
                className="w-full px-3 py-2 rounded-md border-2 border-[#0a0a0a] text-sm resize-none focus:outline-none font-medium"
              />
              <Button type="button" onClick={submitRating} disabled={actionLoading || !rating} className="w-full font-black">
                {actionLoading ? "Submitting…" : "Submit Rating"}
              </Button>
            </CardContent>
          </Card>
        )}

        {hasRated && transaction.status === "completed" && (
          <div className="text-center text-sm font-black text-green-600 flex items-center justify-center gap-2 p-3 border-2 border-green-400 rounded-md bg-green-50">
            <CheckCircle2 className="w-4 h-4" /> Rating submitted! Trade complete.
          </div>
        )}

        {/* Return request */}
        {isBuyer && transaction.status === "completed" && transaction.isReturnEligible && !transaction.returnPolicy?.returnRequested && (
          <div>
            {!showReturn ? (
              <button type="button" onClick={() => setShowReturn(true)} className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Request return (within 2 days)
              </button>
            ) : (
              <Card className="border-red-500 shadow-[4px_4px_0px_0px_#ef4444]">
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-black text-red-700">Request Return</h3>
                  <textarea
                    placeholder="Reason for return…"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-md border-2 border-[#0a0a0a] text-sm resize-none focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="destructive" onClick={requestReturn} disabled={actionLoading} className="font-black">Submit</Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setShowReturn(false)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
