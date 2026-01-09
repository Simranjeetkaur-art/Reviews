"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { QRCodeSVG } from "qrcode.react";
import { validateAndNormalizeGoogleMapsUrl } from "@/lib/url-normalizer";
import {
  Sparkles,
  Plus,
  Store,
  QrCode,
  ExternalLink,
  Copy,
  CheckCircle2,
  Settings,
  Trash2,
  LogOut,
  Crown,
  Zap,
  Download,
  MessageSquare,
  BarChart3,
  Loader2,
  User,
  AlertCircle,
  X,
} from "lucide-react";
import { BusinessActivityLog } from "@/components/BusinessActivityLog";

interface Business {
  id: string;
  businessName: string;
  businessType: string;
  googleMapsUrl: string;
  googleMapsAboutUrl?: string;
  feedbackCount: number;
  generationCount: number;
  isActive?: boolean;
  createdAt: string;
  products?: Array<{ id: string; name: string }>;
  employees?: Array<{ id: string; name: string }>;
}

export default function MyBusinessesPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showQR, setShowQR] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [updating, setUpdating] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<any | null>(null);
  const [loadingBusinessDetails, setLoadingBusinessDetails] = useState(false);
  const [updateError, setUpdateError] = useState<{
    message: string;
    errorType?: string;
    existingBusiness?: any;
    supportMessage?: string;
    isAdmin?: boolean;
    ownerDetails?: any;
    resolutionOptions?: string[];
  } | null>(null);
  const [urlValidationError, setUrlValidationError] = useState<string | null>(
    null,
  );
  const [editFormData, setEditFormData] = useState({
    businessName: "",
    businessType: "",
    googleMapsUrl: "",
    googleMapsAboutUrl: "",
    businessLocation: "",
    aboutBusiness: "",
    brandLogo: "",
    products: [""],
    employees: [""],
  });
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      fetchBusinesses();
    }
  }, [user, authLoading, router]);

  const fetchBusinesses = async () => {
    try {
      const response = await fetch("/api/my-businesses");
      const data = await response.json();
      if (data.success) {
        setBusinesses(data.businesses);
      }
    } catch (error) {
      console.error("Failed to fetch businesses:", error);
    } finally {
      setLoading(false);
    }
  };

  const viewBusinessDetails = async (businessId: string) => {
    setLoadingBusinessDetails(true);
    try {
      const response = await fetch(`/api/businesses/${businessId}`);
      const data = await response.json();
      if (data.success) {
        setSelectedBusiness(data.business);
      }
    } catch (error) {
      console.error("Failed to fetch business details:", error);
    } finally {
      setLoadingBusinessDetails(false);
    }
  };

  const handleEditClick = async (business: Business) => {
    try {
      // Fetch full business details including products and employees
      const response = await fetch(`/api/businesses/${business.id}`);
      const data = await response.json();
      if (data.success) {
        setEditingBusiness(data.business);
        setUpdateError(null); // Clear any previous errors
        setEditFormData({
          businessName: data.business.businessName || "",
          businessType: data.business.businessType || "",
          googleMapsUrl: data.business.googleMapsUrl || "",
          googleMapsAboutUrl: data.business.googleMapsAboutUrl || "",
          businessLocation: data.business.businessLocation || "",
          aboutBusiness: data.business.aboutBusiness || "",
          brandLogo: data.business.brandLogo || "",
          products:
            data.business.products?.length > 0
              ? data.business.products.map((p: any) => p.name || p)
              : [""],
          employees:
            data.business.employees?.length > 0
              ? data.business.employees.map((e: any) => e.name || e)
              : [""],
        });
      }
    } catch (error) {
      console.error("Failed to fetch business details:", error);
      alert("Failed to load business details. Please try again.");
    }
  };

  const handleUpdateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBusiness) return;

    // Validate Google Maps URL before submission
    const urlValidation = validateAndNormalizeGoogleMapsUrl(
      editFormData.googleMapsUrl,
    );
    if (!urlValidation.valid) {
      setUrlValidationError(urlValidation.error || "Invalid URL format");
      return;
    }
    setUrlValidationError(null);

    setUpdating(true);
    setUpdateError(null);
    try {
      const response = await fetch(`/api/businesses/${editingBusiness.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: editFormData.businessName,
          businessType: editFormData.businessType,
          googleMapsUrl: editFormData.googleMapsUrl,
          googleMapsAboutUrl: editFormData.googleMapsAboutUrl || null,
          businessLocation: editFormData.businessLocation || null,
          aboutBusiness: editFormData.aboutBusiness || null,
          brandLogo: editFormData.brandLogo || null,
          products: editFormData.products.filter((p) => p.trim() !== ""),
          employees: editFormData.employees.filter((e) => e.trim() !== ""),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setEditingBusiness(null);
        setUpdateError(null);
        fetchBusinesses(); // Refresh the list
        alert("Business updated successfully!");
      } else {
        // Handle duplicate Google Maps URL error
        if (
          data.errorType === "DUPLICATE_GOOGLE_MAPS_URL" ||
          data.errorType === "DUPLICATE_GOOGLE_MAPS_URL_OWN"
        ) {
          setUpdateError({
            message: data.error,
            errorType: data.errorType,
            existingBusiness: data.existingBusiness,
            supportMessage: data.supportMessage,
            isAdmin: data.isAdmin,
            ownerDetails: data.ownerDetails,
            resolutionOptions: data.resolutionOptions,
          });
        } else if (data.errorType === "INVALID_GOOGLE_MAPS_URL") {
          setUrlValidationError(data.error || "Invalid URL format");
          setUpdateError({
            message: data.error || "Invalid Google Maps URL format",
            errorType: data.errorType,
          });
        } else {
          setUpdateError({
            message:
              data.error || "Failed to update business. Please try again.",
          });
        }
      }
    } catch (error) {
      console.error("Failed to update business:", error);
      setUpdateError({
        message: "Failed to update business. Please try again.",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleCopyLink = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleDelete = async (businessId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this business? This action cannot be undone.",
      )
    ) {
      return;
    }

    setDeleting(businessId);
    try {
      const response = await fetch(`/api/businesses/${businessId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setBusinesses(businesses.filter((b) => b.id !== businessId));
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setDeleting(null);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
      // Still redirect even if logout fails
      router.push("/");
    }
  };

  const downloadQR = (
    businessId: string,
    businessName: string,
    url: string,
  ) => {
    const svg = document.querySelector(`#qr-${businessId} svg`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const blobUrl = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const link = document.createElement("a");
            link.download = `${businessName.replace(/[^a-z0-9]/gi, "_")}-qr-code.png`;
            link.href = URL.createObjectURL(blob);
            link.click();
            URL.revokeObjectURL(link.href);
          }
          URL.revokeObjectURL(blobUrl);
        });
      }
    };
    img.src = blobUrl;
  };

  const canAddBusiness =
    user &&
    (user.businessLimit === -1 || businesses.length < user.businessLimit);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 w-full overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-white">
                ReviewBoost
              </span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              {/* Subscription Badge */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-full border border-slate-700">
                {user?.role === "superadmin" ? (
                  <>
                    <Crown className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm text-slate-300">ADMIN PLAN</span>
                  </>
                ) : user?.subscriptionTier === "lifetime" ? (
                  <>
                    <Crown className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-slate-300 capitalize">
                      {user?.subscriptionTier} Plan
                    </span>
                  </>
                ) : user?.subscriptionTier === "pro" ? (
                  <>
                    <Zap className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm text-slate-300 capitalize">
                      {user?.subscriptionTier} Plan
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300 capitalize">
                      {user?.subscriptionTier} Plan
                    </span>
                  </>
                )}
              </div>

              {user?.role === "superadmin" && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="border-purple-500 text-purple-400 hidden sm:inline-flex"
                >
                  <Link href="/admin/dashboard">
                    <Settings className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                asChild
                className="hidden sm:inline-flex"
              >
                <Link href="/profile">
                  <User className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-slate-400 hover:text-white"
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 w-full overflow-x-hidden">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 break-words">
            Welcome back, {user?.name || user?.email?.split("@")[0]}!
          </h1>
          <p className="text-sm sm:text-base text-slate-400">
            Manage your businesses and track your review performance
          </p>
        </div>

        {/* Subscription Details Card */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Subscription Details</CardTitle>
            <CardDescription className="text-slate-400">
              View your current subscription plan and limits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400">
                    Subscription Tier
                  </label>
                  <div className="mt-1">
                    {user?.role === "superadmin" ? (
                      <span className="px-3 py-1 rounded text-sm font-medium bg-indigo-100 text-indigo-700">
                        ADMIN PLAN
                      </span>
                    ) : (
                      <span
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          user?.subscriptionTier === "free"
                            ? "bg-blue-100 text-blue-700"
                            : user?.subscriptionTier === "pro"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {user?.subscriptionTier?.toUpperCase() || "FREE"}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-400">
                    Subscription Status
                  </label>
                  <div className="mt-1">
                    <span
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        user?.subscriptionStatus === "active"
                          ? "bg-green-100 text-green-700"
                          : user?.subscriptionStatus === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : user?.subscriptionStatus === "expired"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {user?.subscriptionStatus?.toUpperCase() || "ACTIVE"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400">
                    Business Limit
                  </label>
                  <p className="text-white text-sm mt-1">
                    {user?.businessLimit === -1
                      ? "Unlimited businesses"
                      : `${user?.businessLimit || 0} businesses`}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-slate-400">
                    Feedback Limit per Business
                  </label>
                  <p className="text-white text-sm mt-1">
                    {user?.feedbackLimit === -1
                      ? "Unlimited generations"
                      : `${user?.feedbackLimit || 5} generations per business`}
                  </p>
                </div>
              </div>
              {user?.subscriptionStartDate && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400">
                      Subscription Start Date
                    </label>
                    <p className="text-white text-sm mt-1">
                      {new Date(
                        user.subscriptionStartDate,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  {user?.subscriptionEndDate && (
                    <div>
                      <label className="text-sm text-slate-400">
                        Subscription End Date
                      </label>
                      <p className="text-white text-sm mt-1">
                        {new Date(
                          user.subscriptionEndDate,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              )}
              {user?.subscriptionTier !== "free" && (
                <div className="pt-2 border-t border-slate-700">
                  <Button
                    variant="outline"
                    asChild
                    className="bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600"
                  >
                    <Link href="/pricing">Manage Subscription</Link>
                  </Button>
                </div>
              )}
              {user?.subscriptionTier === "free" && (
                <div className="pt-2 border-t border-slate-700">
                  <p className="text-sm text-slate-400 mb-2">
                    Upgrade to Pro (₹9,999 / 6 months) for unlimited generations
                  </p>
                  <Button
                    variant="outline"
                    asChild
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-0"
                  >
                    <Link href="/pricing">Upgrade to Pro</Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 sm:mb-8">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Store className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    {businesses.length}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-400">
                    {user?.role === "superadmin" || user?.businessLimit === -1
                      ? "Unlimited"
                      : `of ${user?.businessLimit}`}{" "}
                    Businesses
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    {businesses.reduce((acc, b) => acc + b.feedbackCount, 0)}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Total Reviews Generated
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700 sm:col-span-2 lg:col-span-1">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    {user?.role === "superadmin"
                      ? "ADMIN PLAN"
                      : (user?.subscriptionTier || "free").toUpperCase()}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-400">
                    {user?.role === "superadmin" ? (
                      <span className="text-indigo-400">No restrictions</span>
                    ) : user?.subscriptionTier === "free" ? (
                      <Link
                        href="/pricing"
                        className="text-indigo-400 hover:text-indigo-300"
                      >
                        Upgrade Plan →
                      </Link>
                    ) : (
                      <span className="text-slate-500">
                        Active subscription
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Usage Warning for Free Tier - Hidden for Admin */}
        {user?.role !== "superadmin" && user?.subscriptionTier === "free" && (
          <Card className="bg-yellow-900/20 border-yellow-500/30 mb-6 sm:mb-8">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-yellow-300 mb-2">
                    Free Tier Usage Limit
                  </h3>
                  <p className="text-sm sm:text-base text-yellow-200/80 mb-3">
                    Each business can generate feedbacks{" "}
                    <strong>5 times</strong> on the free plan. After that,
                    you'll need to upgrade to Pro (₹9,999 / 6 months) to
                    continue.
                  </p>
                  <div className="space-y-2">
                    {businesses.map((business) => {
                      const usagePercent = Math.min(
                        (business.generationCount / 5) * 100,
                        100,
                      );
                      const isAtLimit = business.generationCount >= 5;
                      return (
                        <div
                          key={business.id}
                          className="bg-yellow-900/20 rounded-lg p-2"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-yellow-200 font-medium truncate">
                              {business.businessName}
                            </span>
                            <span
                              className={`text-xs font-medium whitespace-nowrap ml-2 ${
                                isAtLimit ? "text-red-400" : "text-yellow-300"
                              }`}
                            >
                              {business.generationCount} / 5 generations
                            </span>
                          </div>
                          <div className="flex-1 bg-yellow-900/30 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                isAtLimit ? "bg-red-500" : "bg-yellow-500"
                              }`}
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <Button
                  asChild
                  className="w-full sm:w-auto sm:ml-4 bg-yellow-600 hover:bg-yellow-500 text-white"
                >
                  <Link href="/pricing">Upgrade to Pro</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Business Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-white">
            Your Businesses
          </h2>
          {canAddBusiness ? (
            <Button
              asChild
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              <Link href="/dashboard">
                <Plus className="w-4 h-4 mr-2" />
                Add Business
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              variant="outline"
              className="w-full sm:w-auto border-indigo-500 text-indigo-400"
            >
              <Link href="/pricing">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Add More
              </Link>
            </Button>
          )}
        </div>

        {/* Business Cards */}
        {businesses.length === 0 ? (
          <Card className="bg-slate-900/50 border-slate-700 border-dashed">
            <CardContent className="p-6 sm:p-12 text-center">
              <Store className="w-12 h-12 sm:w-16 sm:h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                No businesses yet
              </h3>
              <p className="text-sm sm:text-base text-slate-400 mb-6">
                Add your first business to start collecting reviews
              </p>
              <Button
                asChild
                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600"
              >
                <Link href="/dashboard">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Business
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:gap-6 w-full">
            {businesses.map((business, index) => (
              <motion.div
                key={business.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="w-full max-w-full overflow-hidden"
              >
                <Card className="bg-slate-900/50 border-slate-700 hover:border-indigo-500/50 transition-colors w-full max-w-full overflow-hidden">
                  <CardHeader className="p-4 sm:p-6 overflow-hidden">
                    <div className="flex items-start justify-between gap-4 w-full min-w-0">
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <CardTitle className="text-lg sm:text-xl text-white flex items-start gap-2 w-full min-w-0">
                          <Store className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <button
                              onClick={() => viewBusinessDetails(business.id)}
                              className="break-words overflow-wrap-anywhere min-w-0 text-left hover:text-indigo-400 transition-colors cursor-pointer"
                            >
                              {business.businessName}
                            </button>
                            {business.isActive === false && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  if (
                                    confirm(
                                      "This business has a duplicate Google Maps URL. Request admin to restore it with the previous unique registration?",
                                    )
                                  ) {
                                    try {
                                      // First archive to admin if not already archived
                                      const archiveResponse = await fetch(
                                        `/api/businesses/${business.id}/archive-to-admin`,
                                        {
                                          method: "POST",
                                        },
                                      );
                                      const archiveData = await archiveResponse.json();
                                      
                                      if (archiveData.success) {
                                        // Then create restore request
                                        const requestResponse = await fetch(
                                          `/api/businesses/${business.id}/request-restore`,
                                          {
                                            method: "POST",
                                          },
                                        );
                                        const requestData = await requestResponse.json();
                                        
                                        if (requestData.success) {
                                          alert(
                                            "Restore request sent to admin. Admin will review and restore your business with the previous unique registration.",
                                          );
                                          fetchBusinesses();
                                        } else {
                                          alert(
                                            `Request sent: ${requestData.error || "Admin will review your request"}`,
                                          );
                                          fetchBusinesses();
                                        }
                                      } else {
                                        alert(
                                          `Error: ${archiveData.error || "Failed to process request"}`,
                                        );
                                      }
                                    } catch (error) {
                                      console.error(
                                        "Failed to request restore:",
                                        error,
                                      );
                                      alert("Failed to send restore request");
                                    }
                                  }
                                }}
                                className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs px-2 py-1 h-auto"
                                title="Request admin to restore business with previous unique registration"
                              >
                                Connect
                              </Button>
                            )}
                          </div>
                        </CardTitle>
                        <CardDescription className="text-slate-400 text-sm sm:text-base mt-1 break-words overflow-wrap-anywhere">
                          {business.businessType} • {business.feedbackCount}{" "}
                          reviews generated
                          {user?.role === "superadmin" ? (
                            <span className="block mt-1 text-xs text-indigo-400">
                              {business.generationCount} / ∞ generations
                              (Unlimited)
                            </span>
                          ) : (
                            user?.subscriptionTier === "free" && (
                              <span
                                className={`block mt-1 text-xs ${
                                  business.generationCount >= 5
                                    ? "text-red-400"
                                    : "text-yellow-400"
                                }`}
                              >
                                {business.generationCount} / 5 generations used
                                {business.generationCount >= 5 &&
                                  " (Limit reached)"}
                              </span>
                            )
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(business)}
                          className="text-slate-400 hover:text-white p-2"
                          title="Edit business"
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(business.id)}
                          disabled={deleting === business.id}
                          className="text-slate-400 hover:text-red-400 p-2"
                        >
                          {deleting === business.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4 sm:p-6 pt-0 w-full max-w-full overflow-hidden">
                    {/* Google Maps URL */}
                    <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4 w-full max-w-full overflow-hidden">
                      <p className="text-xs text-slate-500 mb-2">
                        Customer Review Link (Google Maps)
                      </p>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full min-w-0">
                        <code className="flex-1 bg-slate-900 px-2 sm:px-3 py-2 rounded text-xs sm:text-sm text-slate-300 break-all overflow-wrap-anywhere min-w-0 max-w-full overflow-x-auto">
                          {business.googleMapsUrl}
                        </code>
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleCopyLink(
                                business.googleMapsUrl,
                                business.id,
                              )
                            }
                            className="text-slate-400 hover:text-white p-2"
                            title="Copy link"
                          >
                            {copiedId === business.id ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              window.open(business.googleMapsUrl, "_blank")
                            }
                            className="text-slate-400 hover:text-white p-2"
                            title="Open in new tab"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setShowQR(
                                showQR === business.id ? null : business.id,
                              )
                            }
                            className="text-slate-400 hover:text-white p-2"
                            title="Show QR code"
                          >
                            <QrCode className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* QR Code */}
                    <AnimatePresence>
                      {showQR === business.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-white rounded-lg p-4 sm:p-6 text-center">
                            <div
                              id={`qr-${business.id}`}
                              className="inline-block mb-3 sm:mb-4"
                            >
                              <QRCodeSVG
                                value={business.googleMapsUrl}
                                size={160}
                                level="H"
                                includeMargin={true}
                                fgColor="#4f46e5"
                                bgColor="#ffffff"
                                className="sm:w-[180px] sm:h-[180px]"
                              />
                            </div>
                            <p className="text-xs sm:text-sm text-gray-500 mb-3">
                              Scan to leave a review on Google Maps
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                downloadQR(
                                  business.id,
                                  business.businessName,
                                  business.googleMapsUrl,
                                )
                              }
                              className="w-full sm:w-auto"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download QR Code
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Review Templates Link */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm w-full min-w-0">
                      <span className="text-slate-400 text-xs sm:text-sm break-words">
                        Preview review templates
                      </span>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() =>
                          window.open(`/review/${business.id}`, "_blank")
                        }
                        className="text-indigo-400 hover:text-indigo-300 p-0 text-xs sm:text-sm justify-start sm:justify-end whitespace-nowrap"
                      >
                        Open Templates Page →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Edit Business Modal */}
        {editingBusiness && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="bg-slate-800 border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Edit Business</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingBusiness(null)}
                    className="text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <CardDescription className="text-slate-400">
                  Update your business information
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Error Message for Duplicate URL */}
                {updateError && (
                  <div
                    className={`mb-4 p-4 rounded-lg border-2 ${
                      updateError.errorType === "DUPLICATE_GOOGLE_MAPS_URL"
                        ? "bg-yellow-50 border-yellow-300"
                        : "bg-red-50 border-red-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle
                        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                          updateError.errorType === "DUPLICATE_GOOGLE_MAPS_URL"
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      />
                      <div className="flex-1">
                        <h4
                          className={`font-semibold mb-2 ${
                            updateError.errorType ===
                            "DUPLICATE_GOOGLE_MAPS_URL"
                              ? "text-yellow-900"
                              : "text-red-900"
                          }`}
                        >
                          {updateError.errorType === "DUPLICATE_GOOGLE_MAPS_URL"
                            ? "Google Maps URL Already Registered"
                            : "Update Failed"}
                        </h4>
                        <p
                          className={`text-sm mb-3 ${
                            updateError.errorType ===
                            "DUPLICATE_GOOGLE_MAPS_URL"
                              ? "text-yellow-800"
                              : "text-red-800"
                          }`}
                        >
                          {updateError.message}
                        </p>
                        {(updateError.errorType ===
                          "DUPLICATE_GOOGLE_MAPS_URL" ||
                          updateError.errorType ===
                            "DUPLICATE_GOOGLE_MAPS_URL_OWN") && (
                          <>
                            <div className="bg-white rounded-md p-3 border border-yellow-200 space-y-2 text-sm mb-3">
                              <p className="font-medium text-gray-700 mb-2">
                                Existing Business Details:
                              </p>
                              <div className="space-y-1 text-gray-600">
                                <p>
                                  <span className="font-medium">
                                    Business Name:
                                  </span>{" "}
                                  {updateError.existingBusiness?.businessName ||
                                    "N/A"}
                                </p>
                                <p>
                                  <span className="font-medium">
                                    Business Type:
                                  </span>{" "}
                                  {updateError.existingBusiness?.businessType ||
                                    "N/A"}
                                </p>
                                {updateError.errorType ===
                                  "DUPLICATE_GOOGLE_MAPS_URL" && (
                                  <>
                                    <p>
                                      <span className="font-medium">
                                        Registered by:
                                      </span>{" "}
                                      {updateError.existingBusiness
                                        ?.ownerName ||
                                        updateError.existingBusiness
                                          ?.ownerEmail ||
                                        "N/A"}
                                    </p>
                                    {updateError.existingBusiness?.ownerRole ===
                                      "superadmin" && (
                                      <p>
                                        <span className="font-medium">
                                          Owner Type:
                                        </span>{" "}
                                        <span className="text-indigo-600 font-semibold">
                                          Admin Account
                                        </span>
                                      </p>
                                    )}
                                  </>
                                )}
                                <p>
                                  <span className="font-medium">
                                    Registered on:
                                  </span>{" "}
                                  {updateError.existingBusiness?.registeredAt
                                    ? new Date(
                                        updateError.existingBusiness
                                          .registeredAt,
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </p>
                              </div>
                            </div>
                            {updateError.errorType ===
                              "DUPLICATE_GOOGLE_MAPS_URL" && (
                              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
                                <p className="font-medium text-blue-900 mb-2">
                                  To Request Reassignment:
                                </p>
                                <p className="text-blue-800 mb-2">
                                  {updateError.supportMessage ||
                                    "Please contact our Support team via the 'Connect Support' option to request business reassignment."}
                                </p>
                                {updateError.resolutionOptions &&
                                  updateError.resolutionOptions.length > 0 && (
                                    <div className="mt-3">
                                      <p className="font-medium text-blue-900 mb-2">
                                        Resolution Options:
                                      </p>
                                      <ul className="list-disc list-inside space-y-1 text-blue-700">
                                        {updateError.resolutionOptions.map(
                                          (option, idx) => (
                                            <li key={idx}>{option}</li>
                                          ),
                                        )}
                                      </ul>
                                    </div>
                                  )}
                                <p className="text-blue-800 mt-3">
                                  <strong>Note:</strong> Each Google Maps
                                  location can only be registered once. To
                                  transfer this business to your account, please
                                  use the "Connect Support" feature to submit a
                                  reassignment request.
                                </p>
                              </div>
                            )}
                            {updateError.errorType ===
                              "DUPLICATE_GOOGLE_MAPS_URL_OWN" && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm">
                                <p className="text-yellow-800">
                                  <strong>Note:</strong> You already have
                                  another business registered with this Google
                                  Maps URL. Each Google Maps location can only
                                  be registered once per account. Please use a
                                  different URL or contact support if you need
                                  to reassign.
                                </p>
                              </div>
                            )}
                          </>
                        )}
                        {updateError.errorType ===
                          "INVALID_GOOGLE_MAPS_URL" && (
                          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm">
                            <p className="text-red-800">
                              {updateError.message}
                            </p>
                            <p className="text-red-700 mt-2 text-xs">
                              Please enter a valid Google Maps Review URL (e.g.,
                              https://g.page/r/... or
                              https://maps.google.com/...)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <form onSubmit={handleUpdateBusiness} className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">
                      Business Name *
                    </label>
                    <Input
                      value={editFormData.businessName}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          businessName: e.target.value,
                        })
                      }
                      required
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">
                      Business Type *
                    </label>
                    <Input
                      value={editFormData.businessType}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          businessType: e.target.value,
                        })
                      }
                      required
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">
                      Google Maps Review URL *
                    </label>
                    <Input
                      value={editFormData.googleMapsUrl}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEditFormData({
                          ...editFormData,
                          googleMapsUrl: value,
                        });
                        // Validate URL in real-time
                        const validation =
                          validateAndNormalizeGoogleMapsUrl(value);
                        if (!validation.valid && value.trim() !== "") {
                          setUrlValidationError(
                            validation.error || "Invalid URL format",
                          );
                        } else {
                          setUrlValidationError(null);
                        }
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        const validation =
                          validateAndNormalizeGoogleMapsUrl(value);
                        if (!validation.valid && value.trim() !== "") {
                          setUrlValidationError(
                            validation.error || "Invalid URL format",
                          );
                        } else {
                          setUrlValidationError(null);
                        }
                      }}
                      required
                      className={`bg-slate-900 border-slate-700 text-white ${
                        urlValidationError ? "border-red-500" : ""
                      }`}
                      placeholder="https://g.page/r/... or https://maps.google.com/..."
                    />
                    {urlValidationError && (
                      <p className="text-xs text-red-400 mt-1">
                        {urlValidationError}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      Enter a valid Google Maps Review URL (e.g.,
                      https://g.page/r/... or https://maps.google.com/...)
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">
                      Google Maps About URL (Optional)
                    </label>
                    <Input
                      value={editFormData.googleMapsAboutUrl}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          googleMapsAboutUrl: e.target.value,
                        })
                      }
                      className="bg-slate-900 border-slate-700 text-white"
                      placeholder="https://www.google.com/maps/place/..."
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">
                      About Business{" "}
                      <span className="text-slate-500">
                        (Optional, max 50 words)
                      </span>
                    </label>
                    <Textarea
                      value={editFormData.aboutBusiness || ""}
                      onChange={(e) => {
                        const text = e.target.value;
                        const wordCount = text
                          .trim()
                          .split(/\s+/)
                          .filter(Boolean).length;
                        if (wordCount <= 50 || text.trim() === "") {
                          setEditFormData({
                            ...editFormData,
                            aboutBusiness: text,
                          });
                        }
                      }}
                      className="bg-slate-900 border-slate-700 text-white"
                      placeholder="Tell us about your business in a few words..."
                      rows={3}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      {editFormData.aboutBusiness
                        ? `${editFormData.aboutBusiness.trim().split(/\s+/).filter(Boolean).length} / 50 words`
                        : "0 / 50 words"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">
                      Brand Logo URL{" "}
                      <span className="text-slate-500">(Optional)</span>
                    </label>
                    <Input
                      value={editFormData.brandLogo || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          brandLogo: e.target.value,
                        })
                      }
                      className="bg-slate-900 border-slate-700 text-white"
                      placeholder="https://example.com/logo.png or /images/logo.png"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Enter the URL or path to your brand logo image
                    </p>
                    {editFormData.brandLogo && (
                      <div className="mt-2">
                        <img
                          src={editFormData.brandLogo}
                          alt="Brand Logo Preview"
                          className="h-20 w-20 object-contain border border-slate-600 rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">
                      Products/Services *
                    </label>
                    {editFormData.products.map((product, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <Input
                          value={product}
                          onChange={(e) => {
                            const newProducts = [...editFormData.products];
                            newProducts[index] = e.target.value;
                            setEditFormData({
                              ...editFormData,
                              products: newProducts,
                            });
                          }}
                          className="bg-slate-900 border-slate-700 text-white"
                          placeholder="Product/Service name"
                        />
                        {editFormData.products.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newProducts = editFormData.products.filter(
                                (_, i) => i !== index,
                              );
                              setEditFormData({
                                ...editFormData,
                                products: newProducts,
                              });
                            }}
                            className="bg-red-700 border-red-600 text-white hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setEditFormData({
                          ...editFormData,
                          products: [...editFormData.products, ""],
                        })
                      }
                      className="mt-2 bg-slate-700 border-slate-600 text-white"
                    >
                      + Add Product
                    </Button>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">
                      Employees (Optional)
                    </label>
                    {editFormData.employees.map((employee, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <Input
                          value={employee}
                          onChange={(e) => {
                            const newEmployees = [...editFormData.employees];
                            newEmployees[index] = e.target.value;
                            setEditFormData({
                              ...editFormData,
                              employees: newEmployees,
                            });
                          }}
                          className="bg-slate-900 border-slate-700 text-white"
                          placeholder="Employee name"
                        />
                        {editFormData.employees.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newEmployees =
                                editFormData.employees.filter(
                                  (_, i) => i !== index,
                                );
                              setEditFormData({
                                ...editFormData,
                                employees: newEmployees,
                              });
                            }}
                            className="bg-red-700 border-red-600 text-white hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setEditFormData({
                          ...editFormData,
                          employees: [...editFormData.employees, ""],
                        })
                      }
                      className="mt-2 bg-slate-700 border-slate-700 text-white"
                    >
                      + Add Employee
                    </Button>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      type="submit"
                      disabled={updating}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      {updating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Business"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingBusiness(null)}
                      className="bg-slate-700 border-slate-600 text-white"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Business Details Modal */}
        {selectedBusiness && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="bg-slate-800 border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Business Details</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedBusiness(null)}
                    className="text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <CardDescription className="text-slate-400">
                  View complete business information and subscription details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Business Information */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Business Information
                  </h3>
                  <div className="space-y-4 bg-slate-900/50 p-4 rounded-lg">
                    <div>
                      <label className="text-sm text-slate-400">
                        Business Name
                      </label>
                      <p className="text-white">
                        {selectedBusiness.businessName}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">
                        Business Type
                      </label>
                      <p className="text-white">
                        {selectedBusiness.businessType}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">
                        Google Maps URL
                      </label>
                      <p className="text-white break-all text-sm">
                        {selectedBusiness.googleMapsUrl}
                      </p>
                    </div>
                    {selectedBusiness.googleMapsAboutUrl && (
                      <div>
                        <label className="text-sm text-slate-400">
                          Google Maps About URL
                        </label>
                        <p className="text-white break-all text-sm">
                          {selectedBusiness.googleMapsAboutUrl}
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-slate-400">
                          Generation Count
                        </label>
                        <p className="text-white">
                          {selectedBusiness.generationCount || 0} /{" "}
                          {user?.role === "superadmin"
                            ? "∞"
                            : user?.subscriptionTier === "free"
                              ? "5"
                              : "∞"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-slate-400">
                          Feedbacks Generated
                        </label>
                        <p className="text-white">
                          {selectedBusiness.feedbackCount || 0}
                        </p>
                      </div>
                    </div>
                    {selectedBusiness.products &&
                      selectedBusiness.products.length > 0 && (
                        <div>
                          <label className="text-sm text-slate-400">
                            Products/Services
                          </label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedBusiness.products.map((product: any) => (
                              <span
                                key={product.id || product}
                                className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                              >
                                {product.name || product}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    {selectedBusiness.employees &&
                      selectedBusiness.employees.length > 0 && (
                        <div>
                          <label className="text-sm text-slate-400">
                            Employees
                          </label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedBusiness.employees.map((employee: any) => (
                              <span
                                key={employee.id || employee}
                                className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm"
                              >
                                {employee.name || employee}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    <div>
                      <label className="text-sm text-slate-400">
                        Created At
                      </label>
                      <p className="text-white text-sm">
                        {new Date(selectedBusiness.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Subscription Details Section */}
                <div className="pt-4 border-t border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Subscription Details
                  </h3>
                  <div className="space-y-4 bg-slate-900/50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-slate-400">
                          Subscription Tier
                        </label>
                        <div className="mt-1">
                          {user?.role === "superadmin" ? (
                            <span className="px-3 py-1 rounded text-sm font-medium bg-indigo-100 text-indigo-700">
                              ADMIN PLAN
                            </span>
                          ) : (
                            <span
                              className={`px-3 py-1 rounded text-sm font-medium ${
                                user?.subscriptionTier === "free"
                                  ? "bg-blue-100 text-blue-700"
                                  : user?.subscriptionTier === "pro"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {user?.subscriptionTier?.toUpperCase() || "FREE"}
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-slate-400">
                          Subscription Status
                        </label>
                        <div className="mt-1">
                          <span
                            className={`px-3 py-1 rounded text-sm font-medium ${
                              user?.subscriptionStatus === "active"
                                ? "bg-green-100 text-green-700"
                                : user?.subscriptionStatus === "cancelled"
                                  ? "bg-red-100 text-red-700"
                                  : user?.subscriptionStatus === "expired"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {user?.subscriptionStatus?.toUpperCase() ||
                              "ACTIVE"}
                          </span>
                        </div>
                      </div>
                    </div>
                    {user?.subscriptionStartDate && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-slate-400">
                            Subscription Start Date
                          </label>
                          <p className="text-white text-sm mt-1">
                            {new Date(
                              user.subscriptionStartDate,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        {user?.subscriptionEndDate && (
                          <div>
                            <label className="text-sm text-slate-400">
                              Subscription End Date
                            </label>
                            <p className="text-white text-sm mt-1">
                              {new Date(
                                user.subscriptionEndDate,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-slate-400">
                          Business Limit
                        </label>
                        <p className="text-white text-sm mt-1">
                          {user?.businessLimit === -1
                            ? "Unlimited"
                            : `${user?.businessLimit || 0} businesses`}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-slate-400">
                          Feedback Limit per Business
                        </label>
                        <p className="text-white text-sm mt-1">
                          {user?.feedbackLimit === -1
                            ? "Unlimited"
                            : `${user?.feedbackLimit || 5} generations`}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">
                        Current Usage for This Business
                      </label>
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-white">
                            {selectedBusiness.generationCount || 0} /{" "}
                            {user?.role === "superadmin"
                              ? "∞"
                              : user?.subscriptionTier === "free"
                                ? "5"
                                : "∞"}{" "}
                            generations
                          </span>
                          {user?.subscriptionTier === "free" && (
                            <span
                              className={`text-xs font-medium ${
                                (selectedBusiness.generationCount || 0) >= 5
                                  ? "text-red-400"
                                  : "text-yellow-400"
                              }`}
                            >
                              {(selectedBusiness.generationCount || 0) >= 5
                                ? "Limit Reached"
                                : "In Use"}
                            </span>
                          )}
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              user?.subscriptionTier === "free" &&
                              (selectedBusiness.generationCount || 0) >= 5
                                ? "bg-red-500"
                                : user?.subscriptionTier === "free" &&
                                    (selectedBusiness.generationCount || 0) >= 4
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                user?.subscriptionTier === "free"
                                  ? ((selectedBusiness.generationCount || 0) /
                                      5) *
                                      100
                                  : (selectedBusiness.generationCount || 0) > 0
                                    ? 100
                                    : 0,
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    {user?.subscriptionTier === "free" &&
                      (selectedBusiness.generationCount || 0) >= 5 && (
                        <div className="pt-2 border-t border-slate-700">
                          <p className="text-sm text-yellow-400 mb-2">
                            This business has reached the free tier limit.
                            Upgrade to Pro for unlimited generations.
                          </p>
                          <Button
                            asChild
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
                          >
                            <Link href="/pricing">
                              Upgrade to Pro (₹9,999 / 6 months)
                            </Link>
                          </Button>
                        </div>
                      )}
                  </div>
                </div>

                {/* Activity Log */}
                {selectedBusiness && (
                  <div className="mt-6">
                    <BusinessActivityLog
                      businessId={selectedBusiness.id}
                      isAdmin={user?.role === "superadmin"}
                    />
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedBusiness(null);
                      handleEditClick(selectedBusiness);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600"
                  >
                    Edit Business
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedBusiness(null)}
                    className="bg-slate-700 border-slate-600 text-white"
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
