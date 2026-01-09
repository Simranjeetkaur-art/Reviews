"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import {
  Sparkles,
  Users,
  Store,
  Crown,
  Zap,
  Search,
  ArrowLeft,
  Loader2,
  MessageSquare,
  TrendingUp,
  UserCheck,
  Settings,
  Trash2,
  MoreVertical,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  businessCount: number;
  feedbackCount: number;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  totalBusinesses: number;
  totalFeedbacks: number;
  subscriptionBreakdown: {
    free: number;
    pro: number;
    enterprise: number;
  };
}

export default function SuperAdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== "superadmin") {
        router.push("/login");
        return;
      }
      fetchData();
    }
  }, [user, authLoading, router]);

  const fetchData = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch("/api/superadmin/users"),
        fetch("/api/superadmin/stats"),
      ]);

      const usersData = await usersRes.json();
      const statsData = await statsRes.json();

      if (usersData.success) setUsers(usersData.users);
      if (statsData.success) setStats(statsData.stats);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserTier = async (userId: string, tier: string) => {
    setUpdating(userId);
    try {
      const response = await fetch(`/api/superadmin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionTier: tier }),
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to update user:", error);
    } finally {
      setUpdating(null);
    }
  };

  const deleteUser = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? All their data will be lost.",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/superadmin/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setUsers(users.filter((u) => u.id !== userId));
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "enterprise":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case "pro":
        return <Zap className="w-4 h-4 text-indigo-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-slate-400" />;
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case "enterprise":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "pro":
        return "bg-indigo-500/20 text-indigo-400 border-indigo-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-purple-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/my-businesses"
                className="text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">
                  Super Admin
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {stats.totalUsers}
                    </p>
                    <p className="text-sm text-slate-400">Total Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <Store className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {stats.totalBusinesses}
                    </p>
                    <p className="text-sm text-slate-400">Total Businesses</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {stats.totalFeedbacks}
                    </p>
                    <p className="text-sm text-slate-400">Total Feedbacks</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {stats.subscriptionBreakdown.pro +
                        stats.subscriptionBreakdown.enterprise}
                    </p>
                    <p className="text-sm text-slate-400">Paid Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Subscription Breakdown */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card className="bg-slate-800/30 border-slate-700">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-slate-300">
                  {stats.subscriptionBreakdown.free}
                </p>
                <p className="text-sm text-slate-500">Free</p>
              </CardContent>
            </Card>
            <Card className="bg-indigo-900/30 border-indigo-700/50">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-indigo-300">
                  {stats.subscriptionBreakdown.pro}
                </p>
                <p className="text-sm text-indigo-400">Pro</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-900/30 border-yellow-700/50">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-yellow-300">
                  {stats.subscriptionBreakdown.enterprise}
                </p>
                <p className="text-sm text-yellow-400">Enterprise</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users Table */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-white">All Users</CardTitle>
                <CardDescription className="text-slate-400">
                  Manage user subscriptions and access
                </CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">
                      User
                    </th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">
                      Plan
                    </th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">
                      Businesses
                    </th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">
                      Feedbacks
                    </th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">
                      Joined
                    </th>
                    <th className="text-right py-3 px-4 text-slate-400 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-slate-800 hover:bg-slate-800/30"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-white font-medium">
                            {u.name || "—"}
                          </p>
                          <p className="text-sm text-slate-400">{u.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getTierBadgeColor(
                            u.subscriptionTier,
                          )}`}
                        >
                          {getTierIcon(u.subscriptionTier)}
                          {u.subscriptionTier}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {u.businessCount}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {u.feedbackCount}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-sm">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={u.subscriptionTier}
                            onChange={(e) =>
                              updateUserTier(u.id, e.target.value)
                            }
                            disabled={
                              updating === u.id || u.role === "superadmin"
                            }
                            className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded px-2 py-1 disabled:opacity-50"
                          >
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                            <option value="enterprise">Enterprise</option>
                          </select>
                          {u.role !== "superadmin" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteUser(u.id)}
                              className="text-slate-400 hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
