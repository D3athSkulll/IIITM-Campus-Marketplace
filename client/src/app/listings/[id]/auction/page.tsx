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
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Gavel, Users, TrendingUp } from "lucide-react";

interface AuctionListing {
  _id: string;
  title: string;
  price: number;
  interestCount: number;
  auctionMode: boolean;
  seller: {
    _id: string;
  };
}

export default function AuctionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, token } = useAuth();

  const [listing, setListing] = useState<AuctionListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [enabling, setEnabling] = useState(false);
  const [deposit, setDeposit] = useState("");
  const [deadline, setDeadline] = useState("");

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    const fetchListing = async () => {
      try {
        const data = await api<{ listing: AuctionListing }>(`/listings/${id}`, { token });
        setListing(data.listing);
        if (data.listing.seller._id !== user._id) {
          toast.error("Only the seller can manage auctions");
          router.push(`/listings/${id}`);
          return;
        }
        setDeposit(String(Math.round(data.listing.price * 0.1)));
      } catch {
        toast.error("Listing not found");
        router.push("/");
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id, user, token, router]);

  const handleEnableAuction = async () => {
    if (!deposit || Number(deposit) <= 0) {
      toast.error("Enter a valid deposit amount");
      return;
    }
    if (!token) {
      toast.error("Please sign in again");
      router.replace("/login");
      return;
    }
    setEnabling(true);
    try {
      await api<{ message: string; listing: AuctionListing }>(`/listings/${id}/auction`, {
        method: "PUT",
        body: {
          auctionDeposit: Number(deposit),
        },
        token,
      });
      toast.success("Auction mode enabled!");
      router.push(`/listings/${id}`);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to enable auction"
      );
    } finally {
      setEnabling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-2/3" />
            <div className="h-48 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-6">
        <Link
          href={`/listings/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to listing
        </Link>

        {listing.auctionMode ? (
          <Card className="border-[var(--gold)]">
            <CardContent className="p-6 text-center space-y-3">
              <Gavel className="w-10 h-10 text-[var(--gold)] mx-auto" />
              <h2 className="text-xl font-bold text-[var(--navy)]">
                Auction Mode Active
              </h2>
              <p className="text-sm text-muted-foreground">
                This listing is currently in auction mode. Buyers can place
                competitive bids.
              </p>
              <div className="flex justify-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  {listing.interestCount} interested
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  Base: &#8377;{listing.price.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[var(--navy)]">
                <Gavel className="w-5 h-5" /> Enable Auction Mode
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-amber-800">
                    <span className="font-semibold">
                      {listing.interestCount} buyer
                      {listing.interestCount !== 1 ? "s" : ""} interested!
                    </span>{" "}
                    Auction mode lets buyers compete with bids, helping you get
                    the best price.
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium">Listing</div>
                <div className="text-lg font-bold text-[var(--navy)]">
                  {listing.title}
                </div>
                <div className="text-sm text-muted-foreground">
                  Base price: &#8377;{listing.price.toLocaleString()}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="deposit">
                  Refundable Deposit (&#8377;){" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="deposit"
                  type="number"
                  min={1}
                  placeholder="e.g. 50"
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Bidders pay this deposit to participate. Refunded to
                  non-winners.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">
                  Auction Deadline{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for no deadline (you close manually).
                </p>
              </div>

              <Button
                onClick={handleEnableAuction}
                disabled={enabling}
                className="w-full bg-[var(--gold)] hover:bg-[var(--gold-dark)] text-[var(--navy-dark)] font-semibold py-5 gap-2"
              >
                <Gavel className="w-4 h-4" />
                {enabling ? "Enabling..." : "Enable Auction Mode"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
