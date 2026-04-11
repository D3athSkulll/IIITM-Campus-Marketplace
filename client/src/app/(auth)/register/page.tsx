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

const SECURITY_QUESTIONS = [
  "What is the name of your pet?",
  "What is your best friend's first name?",
  "What is your favourite fruit?",
  "What is the name of the street you grew up on?",
  "What was the name of your first school?",
  "What is your mother's maiden name?",
];

export default function RegisterPage() {
  const router = useRouter();
  const { register, user, isLoading } = useAuth();
  const [realName, setRealName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [securityQuestion, setSecurityQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(user.onboardingComplete ? "/" : "/onboarding");
    }
  }, [isLoading, user, router]);

  if (isLoading || user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.toLowerCase().endsWith("@iiitm.ac.in")) {
      toast.error("Only @iiitm.ac.in emails are allowed.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (!phone) {
      toast.error("Phone number is required.");
      return;
    }
    if (!securityAnswer.trim()) {
      toast.error("Security answer is required.");
      return;
    }
    setLoading(true);
    try {
      await register(email, password, realName, phone, securityQuestion, securityAnswer);
      toast.success("Account created! Let's set up your profile.");
      router.push("/onboarding");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-2xl bg-[var(--surface)]/95 backdrop-blur">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-[#1D3557]">Create account</CardTitle>
        <CardDescription>Join the IIITM campus marketplace</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="realName">Full Name</Label>
            <Input
              id="realName"
              placeholder="Your real name"
              value={realName}
              onChange={(e) => setRealName(e.target.value)}
              required
              autoComplete="name"
              className="placeholder:text-gray-400"
            />
          </div>
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
            <p className="text-xs text-muted-foreground">Only @iiitm.ac.in addresses allowed</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+91 XXXXX XXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoComplete="tel"
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
                minLength={6}
                autoComplete="new-password"
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

          {/* Security Question */}
          <div className="space-y-2 border-t-2 border-[#1D3557]/20 pt-3">
            <Label htmlFor="secQ" className="text-[#1D3557] font-black text-xs uppercase tracking-wide">Security Question</Label>
            <select
              id="secQ"
              title="Security question"
              aria-label="Security question"
              value={securityQuestion}
              onChange={(e) => setSecurityQuestion(e.target.value)}
              className="w-full px-3 py-2 rounded-md border-2 border-[#1D3557] bg-[var(--surface)] text-sm font-medium text-[#1D3557] focus:outline-none shadow-[2px_2px_0px_0px_#1D3557] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all"
            >
              {SECURITY_QUESTIONS.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
            <Input
              id="secA"
              placeholder="Your answer"
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
              required
              className="placeholder:text-gray-400"
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">Used for account recovery</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            type="submit"
            className="w-full bg-[#1D3557] hover:bg-[#2A4A73] text-[#F1FAEE] font-black border-2 border-[#1D3557] shadow-[3px_3px_0px_0px_#1D3557] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            disabled={loading}
          >
            {loading ? "Creating account…" : "Create account"}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-[#1D3557] font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
