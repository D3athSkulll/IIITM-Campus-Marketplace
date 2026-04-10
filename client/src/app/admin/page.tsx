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

type Tab = "overview" | "users" | "disputes" | "flagged" | "listings" | "demands";

export default function AdminDashboard() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [flagged, setFlagged] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [demands, setDemands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.replace("/login"); return; }
    fetchStats();
  }, [user, isLoading]);

  useEffect(() => {
    if (tab === "users" && users.length === 0) fetchUsers();
    if (tab === "disputes" && disputes.length === 0) fetchDisputes();
    if (tab === "flagged" && flagged.length === 0) fetchFlagged();
    if (tab === "listings" && listings.length === 0) fetchListings();
    if (tab === "demands" && demands.length === 0) fetchDemands();
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

  const fetchListings = async () => {
    try {
      const data = await api<any>("/admin/listings", { token });
      setListings(data.listings);
    } catch {
      toast.error("Failed to load listings");
    }
  };

  const fetchDemands = async () => {
    try {
      const data = await api<any>("/admin/demands", { token });
      setDemands(data.demands);
    } catch {
      toast.error("Failed to load demands");
    }
  };

  const deleteListing = async (listingId: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    setDeleting(listingId);
    try {
      await api<any>(`/admin/listings/${listingId}`, {
        method: "DELETE",
        token,
      });
      toast.success("Listing deleted");
      setListings((prev) => prev.filter((l) => l._id !== listingId));
      fetchStats();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete listing"
      );
    } finally {
      setDeleting(null);
    }
  };

  const deleteDemand = async (demandId: string) => {
    if (!confirm("Are you sure you want to delete this demand?")) return;
    setDeleting(demandId);
    try {
      await api<any>(`/admin/demands/${demandId}`, {
        method: "DELETE",
        token,
      });
      toast.success("Demand deleted");
      setDemands((prev) => prev.filter((d) => d._id !== demandId));
      fetchStats();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete demand"
      );
    } finally {
      setDeleting(null);
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
      <div className="min-h-screen bg-transparent">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 section-surface rounded-xl animate-pulse"
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
    { key: "listings", label: "Listings", icon: <ShoppingBag className="w-4 h-4" /> },
    { key: "demands", label: "Demands", icon: <Package className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-[#1D3557] border-2 border-[#1D3557] bg-[var(--surface-alt)] hover:bg-[#F9C74F]"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#1D3557]">
              Admin Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage users, disputes, and listings
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[var(--surface-soft)] border-2 border-[#1D3557] p-1.5 rounded-lg overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                tab === t.key
                  ? "bg-[var(--hero-panel)] border-2 border-[#1D3557] shadow-[3px_3px_0px_0px_#1D3557] text-[#1D3557]"
                  : "text-[var(--text-soft)] hover:text-[#1D3557] hover:bg-[#F1FAEE]/45"
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
                color="bg-[#A8DADC] text-[#1D3557]"
              />
              <StatCard
                icon={<ShoppingBag className="w-5 h-5" />}
                label="Total Listings"
                value={stats.totalListings}
                color="bg-[#D8E2DC] text-[#1D3557]"
              />
              <StatCard
                icon={<Package className="w-5 h-5" />}
                label="Active Listings"
                value={stats.activeListings}
                color="bg-[#F1FAEE] text-[#1D3557]"
              />
              <StatCard
                icon={<Gavel className="w-5 h-5" />}
                label="Transactions"
                value={stats.totalTransactions}
                color="bg-[#A8DADC] text-[#1D3557]"
              />
            </div>

            {stats.disputedTransactions > 0 && (
              <Card className="border-[#D8E2DC] bg-[#D8E2DC]/15 shadow-[4px_4px_0px_0px_#D8E2DC]">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#1D3557] shrink-0" />
                  <div className="flex-1">
                    <div className="font-semibold text-[#1D3557] text-sm">
                      {stats.disputedTransactions} active dispute
                      {stats.disputedTransactions !== 1 ? "s" : ""}
                    </div>
                    <p className="text-xs text-[#1D3557]">
                      Requires your attention
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setTab("disputes")}
                    className="border-[#1D3557] bg-[var(--surface-alt)] text-[#1D3557] hover:bg-[#F9C74F]"
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
              <Card
                key={u._id}
                className="hover:shadow-[4px_4px_0px_0px_#1D3557] hover:-translate-y-0.5 transition-all"
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#A8DADC] border-2 border-[#1D3557] flex items-center justify-center text-[#1D3557] font-bold text-sm shrink-0">
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
                      <span className="text-xs bg-[var(--surface-alt)] border border-[#1D3557] px-2 py-0.5 rounded hidden sm:inline">
                        {u.hostelBlock}
                      </span>
                    )}
                    <Badge
                      className={
                        u.role === "admin"
                          ? "bg-[#A8DADC] text-[#1D3557]"
                          : "bg-[var(--surface-alt)] text-[#1D3557] border border-[#1D3557]"
                      }
                    >
                      {u.role}
                    </Badge>
                    {u._id !== user?._id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleRole(u._id, u.role)}
                        className="text-xs h-7 border-[#1D3557] bg-[var(--surface-alt)] hover:bg-[#F9C74F]"
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
                <Card
                  key={d._id}
                  className="border-[#F1FAEE] shadow-[4px_4px_0px_0px_#F1FAEE]"
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-sm">
                          {d.listing?.title || "Unknown listing"}
                        </div>
                        <div className="text-xs text-[var(--text-soft)] mt-0.5">
                          Buyer: {d.buyer?.displayName || d.buyer?.realName} |
                          Seller: {d.seller?.displayName || d.seller?.realName}
                        </div>
                        {d.listing?.price && (
                          <div className="text-sm font-bold text-[#1D3557] mt-1">
                            ₹{d.listing.price.toLocaleString()}
                          </div>
                        )}
                      </div>
                      <Badge className="bg-[#D8E2DC] text-[#1D3557] shrink-0">
                        Disputed
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => resolveDispute(d._id, "refunded")}
                        className="flex-1 bg-[#D8E2DC] hover:bg-[#F9C74F] text-[#1D3557] gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Refund
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => resolveDispute(d._id, "completed")}
                        className="flex-1 bg-[#D8E2DC] hover:bg-[#A8DADC] text-[#1D3557] gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveDispute(d._id, "cancelled")}
                        className="flex-1 text-[#1D3557] border-[#1D3557] bg-[var(--surface-alt)] hover:bg-[#F9C74F] gap-1"
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
                <Card
                  key={l._id}
                  className="hover:shadow-[4px_4px_0px_0px_#1D3557] transition-all"
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-[var(--surface-alt)] border-2 border-[#1D3557] shrink-0">
                      {l.images?.[0] ? (
                        <img
                          src={l.images[0]}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/40 text-xl">
                          <Package className="w-5 h-5" />
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
                    <Badge className="bg-[#D8E2DC] text-[#1D3557] shrink-0">
                      Removed
                    </Badge>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Listings */}
        {tab === "listings" && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-3">
              {listings.length} active listing{listings.length !== 1 ? "s" : ""}
            </p>
            {listings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="font-medium">No listings</p>
              </div>
            ) : (
              listings.map((l) => (
                <Card
                  key={l._id}
                  className="hover:shadow-[4px_4px_0px_0px_#1D3557] transition-all"
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-[var(--surface-alt)] border-2 border-[#1D3557] shrink-0">
                      {l.images?.[0] ? (
                        <img
                          src={l.images[0]}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/40 text-xl">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">
                        {l.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        by {l.seller?.displayName || l.seller?.realName} · ₹{l.price.toLocaleString()}
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteListing(l._id)}
                      disabled={deleting === l._id}
                      className="shrink-0"
                    >
                      {deleting === l._id ? "Deleting..." : "Delete"}
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Demands */}
        {tab === "demands" && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-3">
              {demands.length} active demand{demands.length !== 1 ? "s" : ""}
            </p>
            {demands.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="font-medium">No demands</p>
              </div>
            ) : (
              demands.map((d) => (
                <Card
                  key={d._id}
                  className="hover:shadow-[4px_4px_0px_0px_#1D3557] transition-all"
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">
                        {d.title || d.description?.substring(0, 60)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        by {d.buyer?.displayName || d.buyer?.realName} · {d.category}
                      </div>
                      {d.budget && (
                        <div className="text-xs font-medium text-[#1D3557] mt-0.5">
                          Budget: ₹{d.budget.toLocaleString()}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteDemand(d._id)}
                      disabled={deleting === d._id}
                      className="shrink-0"
                    >
                      {deleting === d._id ? "Deleting..." : "Delete"}
                    </Button>
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
    <Card className="hover:shadow-[4px_4px_0px_0px_#1D3557] transition-all">
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
