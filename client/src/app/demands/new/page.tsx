"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const CATEGORIES = ["books", "electronics", "clothing", "furniture", "stationery", "sports", "accessories", "other"];

export default function NewDemandPage() {
  const router = useRouter();
  const { user, token, isLoading } = useRequireAuth();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");

  if (isLoading || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) {
      toast.error("Please select a category.");
      return;
    }
    if (budgetMin && budgetMax && Number(budgetMin) > Number(budgetMax)) {
      toast.error("Min budget cannot exceed max budget.");
      return;
    }

    setLoading(true);
    try {
      await api<any>("/demands", {
        method: "POST",
        body: {
          title,
          description,
          category,
          budgetMin: budgetMin ? Number(budgetMin) : undefined,
          budgetMax: budgetMax ? Number(budgetMax) : undefined,
        },
        token,
      });
      toast.success("Demand posted! Sellers will see it.");
      router.push("/?tab=demands");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to post demand");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-6">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-[#1D3557]">Post a Buyer Demand</CardTitle>
            <p className="text-sm text-muted-foreground">Tell sellers what you're looking for — they'll come to you.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">What are you looking for? <span className="text-destructive">*</span></Label>
                <Input
                  id="title"
                  placeholder="e.g. Engineering Mechanics textbook"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={120}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="desc">Details <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <textarea
                  id="desc"
                  placeholder="Edition, condition preference, urgency…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-input text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category <span className="text-destructive">*</span></Label>
                <select
                  id="category"
                  aria-label="Category"
                  title="Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-md border-2 border-[#1D3557] bg-[var(--surface)] text-sm font-medium text-[#1D3557] focus:outline-none shadow-[2px_2px_0px_0px_#1D3557] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all capitalize"
                >
                  <option value="" disabled>Select category…</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="capitalize">{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Budget Range <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Min (₹)"
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(e.target.value)}
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Max (₹)"
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1D3557] hover:bg-[#2A4A73] text-[#F1FAEE] border-2 border-[#1D3557] font-black shadow-[3px_3px_0px_0px_#1D3557] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
              >
                {loading ? "Posting…" : "Post Demand"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
