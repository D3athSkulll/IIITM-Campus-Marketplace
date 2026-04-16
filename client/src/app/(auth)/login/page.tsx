"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, KeyRound } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, user, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetting, setResetting] = useState(false);

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
      if (err instanceof ApiError && err.code === "WRONG_PASSWORD") {
        toast.error("Incorrect password.");
        setSecurityQuestion(err.data?.securityQuestion as string || "What is the name of your pet?");
        setShowForgot(true);
      } else {
        toast.error(err instanceof Error ? err.message : "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityAnswer.trim()) { toast.error("Please enter your security answer."); return; }
    if (newPassword.length < 6) { toast.error("New password must be at least 6 characters."); return; }
    setResetting(true);
    try {
      await api<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        body: { email, securityAnswer, newPassword },
      });
      toast.success("Password reset! Signing you in...");
      setShowForgot(false);
      setPassword(newPassword);
      // Auto-login with new password
      try {
        await login(email, newPassword);
        router.push("/");
      } catch {
        toast.info("Password changed. Please sign in manually.");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setResetting(false);
    }
  };

  return (
    <Card className="border-0 shadow-2xl bg-[var(--surface)]/95 backdrop-blur">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-[#1D3557]">Sign in</CardTitle>
        <CardDescription>Enter your @iiitm.ac.in email to continue</CardDescription>
      </CardHeader>

      {!showForgot ? (
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
                  className="pr-10 placeholder:text-gray-400 placeholder:opacity-60"
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
            {showForgot && (
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-xs font-bold text-[#E63946] hover:underline"
              >
                Forgot password? Reset with security question
              </button>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              className="w-full bg-[#1D3557] hover:bg-[#2A4A73] text-[#F1FAEE] font-black border-2 border-[#1D3557] shadow-[3px_3px_0px_0px_#1D3557] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
              disabled={loading}
            >
              {loading ? "Signing in\u2026" : "Sign in"}
            </Button>
            {securityQuestion && (
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-[#E63946] hover:underline"
              >
                <KeyRound className="w-3.5 h-3.5" /> Forgot password? Reset with security question
              </button>
            )}
            <p className="text-sm text-muted-foreground text-center">
              No account?{" "}
              <Link href="/register" className="text-[#1D3557] font-medium hover:underline">
                Register here
              </Link>
            </p>
          </CardFooter>
        </form>
      ) : (
        <form onSubmit={handleForgotPassword}>
          <CardContent className="space-y-4">
            <div className="bg-[#F9C74F]/20 border-2 border-[#1D3557] rounded-md p-3">
              <p className="text-xs font-bold text-[#1D3557]">
                Answer your security question to reset your password.
              </p>
              <p className="text-[10px] text-[#1D3557]/70 mt-1">
                Default answer is &quot;tom&quot; if you haven&apos;t changed it.
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black text-[#1D3557] uppercase tracking-wide">Security Question</Label>
              <p className="text-sm font-bold text-[#1D3557] bg-[var(--surface-alt)] border-2 border-[#1D3557] rounded-md px-3 py-2">
                {securityQuestion}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secAnswer">Your Answer</Label>
              <Input
                id="secAnswer"
                placeholder="Enter your security answer"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                required
                autoComplete="off"
                className="placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPwd">New Password</Label>
              <div className="relative flex items-center">
                <Input
                  id="newPwd"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="pr-10 placeholder:text-gray-400 placeholder:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1D3557] hover:opacity-70 transition-opacity"
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              className="w-full bg-[#E63946] hover:bg-[#c5303c] text-[#F1FAEE] font-black border-2 border-[#1D3557] shadow-[3px_3px_0px_0px_#1D3557] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
              disabled={resetting}
            >
              {resetting ? "Resetting\u2026" : "Reset Password"}
            </Button>
            <button
              type="button"
              onClick={() => { setShowForgot(false); setSecurityAnswer(""); setNewPassword(""); }}
              className="text-xs font-bold text-[#1D3557] hover:underline"
            >
              Back to sign in
            </button>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
