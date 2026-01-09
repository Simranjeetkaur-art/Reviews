"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  User,
  Mail,
  Lock,
  CreditCard,
  Building2,
  Save,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Crown,
  Sparkles,
  LogOut,
} from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<
    "profile" | "security" | "subscription"
  >("profile");
  const [loggingOut, setLoggingOut] = useState(false);

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    ownerName: "",
    primaryContact: "",
    secondaryContact: "",
    address: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    } else if (user) {
      // Fetch full profile from API
      fetch("/api/auth/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setProfileData({
              name: data.profile.name || "",
              email: data.profile.email || "",
              ownerName: data.profile.ownerName || "",
              primaryContact: data.profile.primaryContact || "",
              secondaryContact: data.profile.secondaryContact || "",
              address: data.profile.address || "",
            });
          } else {
            // Fallback to user data
            setProfileData({
              name: user.name || "",
              email: user.email || "",
              ownerName: "",
              primaryContact: "",
              secondaryContact: "",
              address: "",
            });
          }
        })
        .catch(() => {
          // Fallback to user data
          setProfileData({
            name: user.name || "",
            email: user.email || "",
            ownerName: "",
            primaryContact: "",
            secondaryContact: "",
            address: "",
          });
        });
    }
  }, [user, authLoading, router]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        if (refreshUser) {
          await refreshUser();
        }
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to update profile",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An error occurred while updating profile",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      setSaving(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({
        type: "error",
        text: "Password must be at least 6 characters",
      });
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: "success", text: "Password changed successfully!" });
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to change password",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An error occurred while changing password",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      // Redirect to landing page
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
      // Still redirect even if logout fails
      window.location.href = "/";
    } finally {
      setLoggingOut(false);
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case "free":
        return "bg-blue-100 text-blue-700";
      case "pro":
        return "bg-purple-100 text-purple-700";
      case "lifetime":
        return "bg-yellow-100 text-yellow-700";
      case "admin":
        return "bg-indigo-100 text-indigo-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-indigo-400" />
              <span className="text-2xl font-bold text-white">ReviewBoost</span>
            </Link>
            <div className="flex gap-3">
              {user.role === "superadmin" && (
                <Button variant="outline" asChild>
                  <Link href="/admin/dashboard">Admin Dashboard</Link>
                </Button>
              )}
              <Button variant="outline" asChild>
                <Link href="/my-businesses">My Businesses</Link>
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                disabled={loggingOut}
                className="text-red-400 border-red-500/50 hover:bg-red-900/20 hover:border-red-500"
              >
                {loggingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Logging out...
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </>
                )}
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link
              href={
                user.role === "superadmin"
                  ? "/admin/dashboard"
                  : "/my-businesses"
              }
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-white mb-2">
            Profile Management
          </h1>
          <p className="text-slate-400">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Message Alert */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === "success"
                ? "bg-green-900/20 border border-green-700/50 text-green-400"
                : "bg-red-900/20 border border-red-700/50 text-red-400"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-700">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "profile"
                ? "text-indigo-400 border-b-2 border-indigo-400"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "security"
                ? "text-indigo-400 border-b-2 border-indigo-400"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            <Lock className="w-4 h-4 inline mr-2" />
            Security
          </button>
          <button
            onClick={() => setActiveTab("subscription")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "subscription"
                ? "text-indigo-400 border-b-2 border-indigo-400"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            <CreditCard className="w-4 h-4 inline mr-2" />
            Subscription
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Profile Information</CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-slate-300">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={profileData.name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, name: e.target.value })
                    }
                    className="mt-1 bg-slate-900 border-slate-700 text-white"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-slate-300">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    className="mt-1 bg-slate-900 border-slate-700 text-white"
                    placeholder="Your email address"
                    disabled
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Email address used for login (case-insensitive)
                  </p>
                </div>
                <div>
                  <Label htmlFor="ownerName" className="text-slate-300">
                    Owner Name (Business Display Name)
                  </Label>
                  <Input
                    id="ownerName"
                    type="text"
                    value={profileData.ownerName}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        ownerName: e.target.value,
                      })
                    }
                    className="mt-1 bg-slate-900 border-slate-700 text-white"
                    placeholder="Enter owner/business display name"
                  />
                </div>
                <div>
                  <Label htmlFor="address" className="text-slate-300">
                    Address
                  </Label>
                  <textarea
                    id="address"
                    value={profileData.address}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        address: e.target.value,
                      })
                    }
                    className="mt-1 w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter your full address"
                    rows={3}
                  />
                </div>
                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword" className="text-slate-300">
                    Current Password
                  </Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                    className="mt-1 bg-slate-900 border-slate-700 text-white"
                    placeholder="Enter current password"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword" className="text-slate-300">
                    New Password
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    className="mt-1 bg-slate-900 border-slate-700 text-white"
                    placeholder="Enter new password"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-slate-300">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="mt-1 bg-slate-900 border-slate-700 text-white"
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                  />
                </div>
                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Update Password
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Subscription Tab */}
        {activeTab === "subscription" && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Subscription Details</CardTitle>
              <CardDescription>
                View and manage your subscription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-400">Current Plan</Label>
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${getTierBadgeColor(
                        user.subscriptionTier || "free",
                      )}`}
                    >
                      {user.role === "superadmin" && (
                        <Crown className="w-4 h-4" />
                      )}
                      {user.role === "superadmin"
                        ? "ADMIN PLAN"
                        : user.subscriptionTier?.toUpperCase() || "FREE"}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-slate-400">Status</Label>
                  <div className="mt-2">
                    <span
                      className={`inline-block px-3 py-2 rounded-lg text-sm font-medium ${
                        user.subscriptionStatus === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {user.subscriptionStatus || "active"}
                    </span>
                  </div>
                </div>
              </div>

              {user.role !== "superadmin" &&
                user.subscriptionTier === "pro" && (
                  <>
                    {user.subscriptionStartDate && (
                      <div>
                        <Label className="text-slate-400">
                          Subscription Period
                        </Label>
                        <p className="text-white mt-1">
                          {new Date(
                            user.subscriptionStartDate,
                          ).toLocaleDateString()}{" "}
                          -{" "}
                          {user.subscriptionEndDate
                            ? new Date(
                                user.subscriptionEndDate,
                              ).toLocaleDateString()
                            : "Active"}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          ₹9,999 / 6 months (Subscription)
                        </p>
                      </div>
                    )}
                  </>
                )}

              {user.role !== "superadmin" &&
                user.subscriptionTier === "lifetime" && (
                  <div>
                    <Label className="text-slate-400">Purchase Date</Label>
                    <p className="text-white mt-1">
                      {user.lifetimePurchaseDate
                        ? new Date(
                            user.lifetimePurchaseDate,
                          ).toLocaleDateString()
                        : "N/A"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      ₹39,999 – One-time payment (Lifetime access)
                    </p>
                    <div className="mt-2 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                      <p className="text-xs text-yellow-400">
                        ✓ Lifetime plan - No renewals required
                      </p>
                    </div>
                  </div>
                )}

              {user.role === "superadmin" && (
                <div>
                  <Label className="text-slate-400">Plan Details</Label>
                  <p className="text-white mt-1">
                    ADMIN PLAN - No restrictions, unlimited businesses and
                    feedback generations
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium mb-1">Plan Limits</h3>
                    <p className="text-sm text-slate-400">
                      Businesses:{" "}
                      {user.businessLimit === -1
                        ? "Unlimited"
                        : user.businessLimit}
                    </p>
                    <p className="text-sm text-slate-400">
                      Feedback Generations:{" "}
                      {user.feedbackLimit === -1
                        ? "Unlimited"
                        : user.feedbackLimit}{" "}
                      per business
                    </p>
                  </div>
                  {user.role !== "superadmin" &&
                    user.subscriptionTier === "free" && (
                      <Button
                        asChild
                        className="bg-indigo-600 hover:bg-indigo-500"
                      >
                        <Link href="/pricing">Upgrade Plan</Link>
                      </Button>
                    )}
                  {user.role !== "superadmin" &&
                    user.subscriptionTier === "pro" && (
                      <Button
                        asChild
                        className="bg-purple-600 hover:bg-purple-500"
                      >
                        <Link href="/pricing">Renew Subscription</Link>
                      </Button>
                    )}
                  {user.role === "superadmin" && (
                    <div className="text-sm text-indigo-400">
                      <Crown className="w-4 h-4 inline mr-1" />
                      Admin privileges active
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
