"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Lock, User, Image, Eye, EyeOff, RefreshCw } from "lucide-react";

const BEN10_ALIENS = [
  "Heatblast","Wildmutt","Diamondhead","XLR8","GreyMatter","FourArms","Stinkfly",
  "Ripjaws","Upgrade","Ghostfreak","Cannonbolt","Wildvine","Blitzwolfer","Frankenstrike",
  "Upchuck","Ditto","EyeGuy","WayBig","Spitter","Swampfire","EchoEcho","Humungousaur",
  "Jetray","BigChill","Chromastone","Brainstorm","Spidermonkey","Goop","AlienX",
  "Lodestar","Rath","Nanomech","WaterHazard","Terraspin","NRG","Armodrillo","AmpFibian",
  "Fasttrack","Clockwork","ChamAlien","Eatle","JuryRigg","Shocksquatch","Feedback",
  "Bloxx","Gravattack","Crashhopper","Walkatrout","PeskyDust","Toepick","Astrodactyl",
  "Bullfrag","KickinHawk","Whampire","Gutrot","Atomix",
];

export default function SettingsPage() {
  const { user, token, logout } = useAuth();
  const router = useRouter();

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [savingAvatar, setSavingAvatar] = useState(false);

  const [showIdentity, setShowIdentity] = useState(user?.showRealIdentity ?? false);
  const [savingIdentity, setSavingIdentity] = useState(false);

  if (!user) {
    router.replace("/login");
    return null;
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) { toast.error("Passwords don't match"); return; }
    if (newPwd.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setSavingPwd(true);
    try {
      await api("/auth/password", { method: "PUT", body: { currentPassword: currentPwd, newPassword: newPwd }, token });
      toast.success("Password changed! Please log in again.");
      logout();
      router.push("/login");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setSavingPwd(false);
    }
  };

  const handleSaveAvatar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAvatar(true);
    try {
      await api("/auth/profile", { method: "PUT", body: { avatarUrl }, token });
      toast.success("Avatar updated!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update avatar");
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleRandomAlien = () => {
    const alien = BEN10_ALIENS[Math.floor(Math.random() * BEN10_ALIENS.length)];
    const url = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${alien}&backgroundColor=0a1628`;
    setAvatarUrl(url);
  };

  const handleToggleIdentity = async () => {
    setSavingIdentity(true);
    try {
      const newVal = !showIdentity;
      await api("/auth/profile", { method: "PUT", body: { showRealIdentity: newVal }, token });
      setShowIdentity(newVal);
      toast.success(newVal ? "Now showing real name" : "Now anonymous");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSavingIdentity(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <Link href="/profile" className="inline-flex items-center gap-1 text-sm font-bold text-[#555] hover:text-[#0a0a0a]">
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </Link>

        <h1 className="text-2xl font-black">Settings</h1>

        {/* Identity toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-4 h-4" /> Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 border-2 border-[#0a0a0a] rounded-md bg-[#f5f5f5]">
              <div>
                <div className="font-black text-sm">
                  {showIdentity ? "Showing Real Name" : "Anonymous Mode"}
                </div>
                <div className="text-xs text-[#555] font-medium mt-0.5">
                  {showIdentity
                    ? `Others see: ${user.realName}`
                    : `Others see: ${user.anonymousNickname}`
                  }
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant={showIdentity ? "outline" : "default"}
                onClick={handleToggleIdentity}
                disabled={savingIdentity}
                className="font-black"
              >
                {savingIdentity ? "Saving..." : showIdentity ? "Go Anonymous" : "Show Real Name"}
              </Button>
            </div>
            <p className="text-xs text-[#555] font-medium">
              In anonymous mode your alien nickname is shown (e.g. <strong>{user.anonymousNickname}</strong>).
              Your real name is never shown without your permission.
            </p>
          </CardContent>
        </Card>

        {/* Avatar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-4 h-4" /> Profile Avatar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveAvatar} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-md border-2 border-[#0a0a0a] overflow-hidden bg-[#e8e8e8] shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#888] text-xl">?</div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    type="url"
                    placeholder="Paste an image URL…"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                  />
                  <Button type="button" size="sm" variant="outline" onClick={handleRandomAlien} className="gap-1.5 font-black">
                    <RefreshCw className="w-3.5 h-3.5" /> Random Alien Avatar
                  </Button>
                </div>
              </div>
              <Button type="submit" disabled={savingAvatar} className="w-full font-black">
                {savingAvatar ? "Saving..." : "Save Avatar"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-4 h-4" /> Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wide">Current Password</label>
                <div className="relative">
                  <Input
                    type={showPwd ? "text" : "password"}
                    placeholder="Enter current password"
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    aria-label={showPwd ? "Hide password" : "Show password"}
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888]"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wide">New Password</label>
                <Input
                  type={showPwd ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wide">Confirm New Password</label>
                <Input
                  type={showPwd ? "text" : "password"}
                  placeholder="Repeat new password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={savingPwd} className="w-full font-black">
                {savingPwd ? "Changing…" : "Change Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Danger zone */}
        <Card className="border-red-500 shadow-[4px_4px_0px_0px_#ef4444]">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs font-medium text-[#555]">Signing out will require you to log in again with your IIITM email.</p>
            <Button
              type="button"
              variant="destructive"
              className="w-full font-black"
              onClick={() => { logout(); router.push("/login"); }}
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
