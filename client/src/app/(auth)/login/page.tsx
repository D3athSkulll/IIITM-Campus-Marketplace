"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, user, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(user.onboardingComplete ? "/" : "/onboarding");
    }
  }, [isLoading, user, router]);

  if (isLoading || user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      router.push("/");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-2xl bg-[var(--surface)]/95 backdrop-blur">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-[#1D3557]">Sign in</CardTitle>
        <CardDescription>Enter your @iiitm.ac.in email to continue</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">College Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="yourname@iiitm.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="placeholder:text-gray-400"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative flex items-center">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1D3557] hover:opacity-70 transition-opacity"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            type="submit"
            className="w-full bg-[var(--navy)] hover:bg-[var(--navy-light)] text-[#F1FAEE]"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            No account?{" "}
            <Link href="/register" className="text-[#1D3557] font-medium hover:underline">
              Register here
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
