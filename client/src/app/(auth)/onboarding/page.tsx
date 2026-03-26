"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const HOSTEL_BLOCKS = ["BH-1", "BH-2", "BH-3", "BH-4", "BH-5", "GH-1", "GH-2", "New BH", "Day Scholar"];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, completeOnboarding, isLoading } = useAuth();
  const [showRealIdentity, setShowRealIdentity] = useState("false");
  const [hostelBlock, setHostelBlock] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.onboardingComplete) {
      router.replace("/");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user || user.onboardingComplete) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostelBlock) {
      toast.error("Please select your hostel block.");
      return;
    }
    setLoading(true);
    try {
      await completeOnboarding(showRealIdentity === "true", hostelBlock);
      toast.success("Profile set up! Welcome to Campus Marketplace.");
      router.push("/");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Onboarding failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-2xl bg-[var(--surface)]/95 backdrop-blur">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-[#1D3557]">One last step</CardTitle>
        <CardDescription>
          Your auto-generated nickname is{" "}
          <span className="font-semibold text-[#1D3557]">&quot;{user.anonymousNickname}&quot;</span>
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Identity preference */}
          <div className="space-y-3">
            <Label className="text-base font-semibold text-[#1D3557]">How do you want to appear?</Label>
            <RadioGroup value={showRealIdentity} onValueChange={setShowRealIdentity} className="space-y-2">
              <div className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 cursor-pointer has-[:checked]:border-[var(--navy)] has-[:checked]:bg-[#A8DADC]">
                <RadioGroupItem value="false" id="anon" className="mt-0.5" />
                <Label htmlFor="anon" className="cursor-pointer">
                  <div className="font-medium">Stay anonymous</div>
                  <div className="text-sm text-muted-foreground">Use your nickname &quot;{user.anonymousNickname}&quot;</div>
                </Label>
              </div>
              <div className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 cursor-pointer has-[:checked]:border-[var(--navy)] has-[:checked]:bg-[#A8DADC]">
                <RadioGroupItem value="true" id="real" className="mt-0.5" />
                <Label htmlFor="real" className="cursor-pointer">
                  <div className="font-medium">Show real name</div>
                  <div className="text-sm text-muted-foreground">Display as &quot;{user.realName}&quot;</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Hostel block */}
          <div className="space-y-2">
            <Label className="text-base font-semibold text-[#1D3557]">Your hostel block</Label>
            <p className="text-sm text-muted-foreground">Helps buyers know how close you are (no room number needed)</p>
            <select
              value={hostelBlock}
              onChange={(e) => setHostelBlock(e.target.value)}
              required
              aria-label="Hostel block"
              title="Hostel block"
              className="w-full h-10 px-3 rounded-md border-2 border-[#1D3557] bg-white text-[#1D3557] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1D3557] appearance-none"
            >
              <option value="" disabled>Select hostel block…</option>
              {HOSTEL_BLOCKS.map((block) => (
                <option key={block} value={block}>{block}</option>
              ))}
            </select>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full bg-[var(--gold)] hover:bg-[var(--gold-dark)] text-[#1D3557] font-semibold"
            disabled={loading}
          >
            {loading ? "Saving…" : "Enter Marketplace →"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
