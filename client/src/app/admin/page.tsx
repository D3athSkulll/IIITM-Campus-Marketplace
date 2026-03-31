"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  ShoppingBag,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  ArrowLeft,
  Package,
  Gavel,
} from "lucide-react";
import Link from "next/link";

type Tab = "overview" | "users" | "disputes" | "flagged";

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [flagged, setFlagged] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    fetchStats();
  }, [user]);

  useEffect(() => {
    if (tab === "users" && users.length === 0) fetchUsers();
    if (tab === "disputes" && disputes.length === 0) fetchDisputes();
    if (tab === "flagged" && flagged.length === 0) fetchFlagged();
  }, [tab]);

  const fetchStats = async () => {
    try {
      const data = await api<any>("/admin/stats", { token });
      setStats(data.stats);
    } catch {
      toast.error("Admin access required");
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await api<any>("/admin/users", { token });
      setUsers(data.users);
    } catch {
      toast.error("Failed to load users");
    }
  };

  const fetchDisputes = async () => {
    try {
      const data = await api<any>("/admin/disputes", { token });
      setDisputes(data.disputes);
    } catch {
      toast.error("Failed to load disputes");
    }
  };

  const fetchFlagged = async () => {
    try {
      const data = await api<any>("/admin/flagged-listings", { token });
      setFlagged(data.listings);
    } catch {
      toast.error("Failed to load flagged listings");
    }
  };

  const resolveDispute = async (txId: string, resolution: string) => {
    try {
      await api<any>(`/admin/disputes/${txId}/resolve`, {
        method: "PUT",
        body: { resolution },
        token,
      });
      toast.success(`Dispute resolved: ${resolution}`);
      setDisputes((prev) => prev.filter((d) => d._id !== txId));
      fetchStats();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to resolve dispute"
      );
    }
  };

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "student" : "admin";
    try {
      await api<any>(`/admin/users/${userId}/role`, {
        method: "PUT",
        body: { role: newRole },
        token,
      });
      toast.success(`Role updated to ${newRole}`);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update role"
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 bg-muted rounded-xl animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    {
      key: "overview",
      label: "Overview",
      icon: <Activity className="w-4 h-4" />,
    },
    { key: "users", label: "Users", icon: <Users className="w-4 h-4" /> },
    {
      key: "disputes",
      label: "Disputes",
      icon: <AlertTriangle className="w-4 h-4" />,
    },
    {
      key: "flagged",
      label: "Flagged",
      icon: <Shield className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--navy)]">
              Admin Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage users, disputes, and listings
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted p-1 rounded-lg overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                tab === t.key
                  ? "bg-white shadow-sm text-[var(--navy)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={<Users className="w-5 h-5" />}
                label="Total Users"
                value={stats.totalUsers}
                color="bg-blue-50 text-blue-600"
              />
              <StatCard
                icon={<ShoppingBag className="w-5 h-5" />}
                label="Total Listings"
                value={stats.totalListings}
                color="bg-green-50 text-green-600"
              />
              <StatCard
                icon={<Package className="w-5 h-5" />}
                label="Active Listings"
                value={stats.activeListings}
                color="bg-amber-50 text-amber-600"
              />
              <StatCard
                icon={<Gavel className="w-5 h-5" />}
                label="Transactions"
                value={stats.totalTransactions}
                color="bg-purple-50 text-purple-600"
              />
            </div>

            {stats.disputedTransactions > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                  <div className="flex-1">
                    <div className="font-semibold text-red-800 text-sm">
                      {stats.disputedTransactions} active dispute
                      {stats.disputedTransactions !== 1 ? "s" : ""}
                    </div>
                    <p className="text-xs text-red-600">
                      Requires your attention
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setTab("disputes")}
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    Review
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Users */}
        {tab === "users" && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-3">
              {users.length} registered user{users.length !== 1 ? "s" : ""}
            </p>
            {users.map((u) => (
              <Card key={u._id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--navy)] flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {(u.realName || u.anonymousNickname || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">
                      {u.realName || u.anonymousNickname}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {u.email}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {u.hostelBlock && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded hidden sm:inline">
                        {u.hostelBlock}
                      </span>
                    )}
                    <Badge
                      className={
                        u.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-600"
                      }
                    >
                      {u.role}
                    </Badge>
                    {u._id !== user?._id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleRole(u._id, u.role)}
                        className="text-xs h-7"
                      >
                        {u.role === "admin" ? "Demote" : "Promote"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Disputes */}
        {tab === "disputes" && (
          <div className="space-y-3">
            {disputes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="font-medium">No active disputes</p>
              </div>
            ) : (
              disputes.map((d) => (
                <Card key={d._id} className="border-amber-200">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-sm">
                          {d.listing?.title || "Unknown listing"}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Buyer: {d.buyer?.displayName || d.buyer?.realName} |
                          Seller: {d.seller?.displayName || d.seller?.realName}
                        </div>
                        {d.listing?.price && (
                          <div className="text-sm font-bold text-[var(--navy)] mt-1">
                            &#8377;{d.listing.price.toLocaleString()}
                          </div>
                        )}
                      </div>
                      <Badge className="bg-red-100 text-red-700 shrink-0">
                        Disputed
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => resolveDispute(d._id, "refunded")}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white gap-1"
                      >
                        Refund
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => resolveDispute(d._id, "completed")}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveDispute(d._id, "cancelled")}
                        className="flex-1 text-red-600 border-red-300 hover:bg-red-50 gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Flagged Listings */}
        {tab === "flagged" && (
          <div className="space-y-2">
            {flagged.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="font-medium">No flagged listings</p>
              </div>
            ) : (
              flagged.map((l) => (
                <Card key={l._id}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
                      {l.images?.[0] ? (
                        <img
                          src={l.images[0]}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/40 text-xl">
                          📦
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">
                        {l.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        by {l.seller?.displayName || l.seller?.realName}
                      </div>
                    </div>
                    <Badge className="bg-red-100 text-red-700 shrink-0">
                      Removed
                    </Badge>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
          {icon}
        </div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      </CardContent>
    </Card>
  );
}
