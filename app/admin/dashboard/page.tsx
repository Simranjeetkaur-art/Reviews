"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  CreditCard,
  Activity,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  User,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  ExternalLink,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { BusinessActivityLog } from "@/components/BusinessActivityLog";

type Tab =
  | "dashboard"
  | "users"
  | "businesses"
  | "admin-businesses"
  | "payments"
  | "activity";

export default function AdminDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== "superadmin") {
        router.push("/login");
        return;
      }
      fetchDashboardStats();

      // Handle URL parameters for tab
      const tabParam = searchParams.get("tab");

      if (
        tabParam &&
        [
          "dashboard",
          "users",
          "businesses",
          "admin-businesses",
          "payments",
          "activity",
        ].includes(tabParam)
      ) {
        setActiveTab(tabParam as Tab);
      }
    }
  }, [user, authLoading, router, searchParams]);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/admin/dashboard");
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setLoading(false);
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
                aria-label="Toggle sidebar"
              >
                {sidebarOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
              <Link href="/" className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400" />
                <span className="text-xl sm:text-2xl font-bold text-white">
                  ReviewBoost Admin
                </span>
              </Link>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="hidden sm:inline-flex"
              >
                <Link href="/my-businesses">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/profile">
                  <User className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={loggingOut}
                className="text-red-400 border-red-500/50 hover:bg-red-900/20 hover:border-red-500"
              >
                {loggingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
                    <span className="hidden sm:inline">Logging out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Logout</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Sidebar Navigation */}
        <div className="flex gap-4 lg:gap-8 relative">
          {/* Sidebar Toggle Button - Always Visible on Desktop when collapsed */}
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="hidden lg:flex fixed left-4 top-24 z-50 p-2.5 bg-slate-800 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-all shadow-lg"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="w-5 h-5" />
            </button>
          )}

          {/* Sidebar */}
          <aside
            className={`${
              sidebarOpen
                ? "translate-x-0 lg:w-64"
                : "-translate-x-full lg:translate-x-0 lg:w-16"
            } fixed lg:static top-0 bottom-0 left-0 z-40 bg-slate-900/95 lg:bg-slate-900/50 backdrop-blur-lg border-r border-slate-800 flex-shrink-0 transition-all duration-300 ease-in-out pt-20 lg:pt-0`}
          >
            <div className="h-full overflow-y-auto p-4 lg:p-0">
              {/* Sidebar Header with Toggle */}
              <div
                className={`flex items-center justify-between mb-4 pb-4 border-b border-slate-700 px-4 lg:px-0 transition-all duration-300 ${
                  sidebarOpen ? "" : "lg:justify-center"
                }`}
              >
                <h2
                  className={`text-sm font-semibold text-slate-400 uppercase tracking-wider transition-all duration-300 ${
                    sidebarOpen
                      ? "opacity-100 w-auto"
                      : "opacity-0 w-0 lg:w-0 overflow-hidden"
                  }`}
                >
                  Navigation
                </h2>
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-300 hover:bg-slate-800 transition-colors lg:ml-auto"
                  aria-label={
                    sidebarOpen ? "Collapse sidebar" : "Expand sidebar"
                  }
                >
                  {sidebarOpen ? (
                    <PanelLeftClose className="w-4 h-4" />
                  ) : (
                    <PanelLeftOpen className="w-4 h-4" />
                  )}
                </button>
              </div>
              <nav className="space-y-2 px-4 lg:px-0">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`w-full flex items-center ${sidebarOpen ? "gap-3 px-4" : "justify-center px-2"} py-3 rounded-lg transition-all ${
                    activeTab === "dashboard"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                  title="Dashboard"
                >
                  <TrendingUp className="w-5 h-5 flex-shrink-0" />
                  <span
                    className={`transition-all duration-300 whitespace-nowrap ${sidebarOpen ? "opacity-100 max-w-full" : "opacity-0 max-w-0 overflow-hidden"}`}
                  >
                    Dashboard
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("users")}
                  className={`w-full flex items-center ${sidebarOpen ? "gap-3 px-4" : "justify-center px-2"} py-3 rounded-lg transition-all ${
                    activeTab === "users"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                  title="Users"
                >
                  <Users className="w-5 h-5 flex-shrink-0" />
                  <span
                    className={`transition-all duration-300 whitespace-nowrap ${sidebarOpen ? "opacity-100 max-w-full" : "opacity-0 max-w-0 overflow-hidden"}`}
                  >
                    Users
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("businesses")}
                  className={`w-full flex items-center ${sidebarOpen ? "gap-3 px-4" : "justify-center px-2"} py-3 rounded-lg transition-all ${
                    activeTab === "businesses"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                  title="Businesses"
                >
                  <Store className="w-5 h-5 flex-shrink-0" />
                  <span
                    className={`transition-all duration-300 whitespace-nowrap ${sidebarOpen ? "opacity-100 max-w-full" : "opacity-0 max-w-0 overflow-hidden"}`}
                  >
                    Businesses
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("payments")}
                  className={`w-full flex items-center ${sidebarOpen ? "gap-3 px-4" : "justify-center px-2"} py-3 rounded-lg transition-all ${
                    activeTab === "payments"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                  title="Payments"
                >
                  <CreditCard className="w-5 h-5 flex-shrink-0" />
                  <span
                    className={`transition-all duration-300 whitespace-nowrap ${sidebarOpen ? "opacity-100 max-w-full" : "opacity-0 max-w-0 overflow-hidden"}`}
                  >
                    Payments
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("activity")}
                  className={`w-full flex items-center ${sidebarOpen ? "gap-3 px-4" : "justify-center px-2"} py-3 rounded-lg transition-all ${
                    activeTab === "activity"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                  title="Activity Log"
                >
                  <Activity className="w-5 h-5 flex-shrink-0" />
                  <span
                    className={`transition-all duration-300 whitespace-nowrap ${sidebarOpen ? "opacity-100 max-w-full" : "opacity-0 max-w-0 overflow-hidden"}`}
                  >
                    Activity Log
                  </span>
                </button>
                <Link
                  href="/profile"
                  className={`w-full flex items-center ${sidebarOpen ? "gap-3 px-4" : "justify-center px-2"} py-3 rounded-lg transition-colors bg-slate-800 text-slate-300 hover:bg-slate-700`}
                  title="Profile"
                >
                  <User className="w-5 h-5 flex-shrink-0" />
                  <span
                    className={`transition-all duration-300 whitespace-nowrap ${sidebarOpen ? "opacity-100 max-w-full" : "opacity-0 max-w-0 overflow-hidden"}`}
                  >
                    Profile
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className={`w-full flex items-center ${sidebarOpen ? "gap-3 px-4" : "justify-center px-2"} py-3 rounded-lg transition-colors bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-red-400 hover:text-red-300 hover:bg-red-900/20`}
                  title="Logout"
                >
                  {loggingOut ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
                      <span
                        className={`transition-all duration-300 whitespace-nowrap ${sidebarOpen ? "opacity-100 max-w-full" : "opacity-0 max-w-0 overflow-hidden"}`}
                      >
                        Logging out...
                      </span>
                    </>
                  ) : (
                    <>
                      <LogOut className="w-5 h-5 flex-shrink-0" />
                      <span
                        className={`transition-all duration-300 whitespace-nowrap ${sidebarOpen ? "opacity-100 max-w-full" : "opacity-0 max-w-0 overflow-hidden"}`}
                      >
                        Logout
                      </span>
                    </>
                  )}
                </button>
              </nav>
            </div>
          </aside>

          {/* Sidebar Overlay for Mobile */}
          {sidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black/50 z-30"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main Content */}
          <main
            className={`flex-1 transition-all duration-300 ${sidebarOpen ? "lg:ml-0" : "lg:ml-0"}`}
          >
            {activeTab === "dashboard" && <DashboardTab stats={stats} />}
            {activeTab === "users" && <UsersTab setActiveTab={setActiveTab} />}
            {activeTab === "businesses" && <BusinessesTab />}
            {activeTab === "admin-businesses" && <AdminBusinessesTab />}
            {activeTab === "payments" && <PaymentsTab />}
            {activeTab === "activity" && <ActivityTab />}
            {activeTab === "admin-businesses" && <AdminBusinessesTab />}
          </main>
        </div>
      </div>
    </div>
  );
}

// Admin Businesses Tab Component
function AdminBusinessesTab() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBusiness, setSelectedBusiness] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [creating, setCreating] = useState(false);
  const [duplicateError, setDuplicateError] = useState<{
    message: string;
    errorType?: string;
    existingBusiness?: any;
    ownerDetails?: any;
    resolutionOptions?: string[];
  } | null>(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const [newOwnerEmail, setNewOwnerEmail] = useState("");
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  // Form state for creating admin business
  const [formData, setFormData] = useState({
    businessName: "",
    businessType: "",
    googleMapsUrl: "",
    products: [""],
    employees: [""],
  });

  useEffect(() => {
    fetchAdminBusinesses();
  }, [searchQuery, statusFilter, page]);

  const fetchAdminBusinesses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });
      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter === "archived") {
        params.append("archived", "true");
      } else if (statusFilter !== "all") {
        params.append("isActive", statusFilter === "active" ? "true" : "false");
      }

      const response = await fetch(
        `/api/admin/businesses/admin-businesses?${params}`,
      );
      const data = await response.json();
      if (data.success) {
        setBusinesses(data.businesses);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch admin businesses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const response = await fetch("/api/admin/businesses/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: formData.businessName,
          businessType: formData.businessType,
          googleMapsUrl: formData.googleMapsUrl,
          products: formData.products.filter((p) => p.trim() !== ""),
          employees: formData.employees.filter((e) => e.trim() !== ""),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowCreateModal(false);
        setDuplicateError(null);
        setFormData({
          businessName: "",
          businessType: "",
          googleMapsUrl: "",
          products: [""],
          employees: [""],
        });
        fetchAdminBusinesses();
        alert("Admin business created successfully!");
      } else {
        // Check if it's a duplicate URL error with owner details
        if (
          data.errorType === "DUPLICATE_GOOGLE_MAPS_URL" &&
          data.isAdmin &&
          data.ownerDetails
        ) {
          setDuplicateError({
            message: data.error,
            errorType: data.errorType,
            existingBusiness: data.existingBusiness,
            ownerDetails: data.ownerDetails,
            resolutionOptions: data.resolutionOptions,
          });
          setShowCreateModal(false);
          // Fetch users for reassignment
          fetchAvailableUsersForReassign();
        } else {
          alert(`Failed to create business: ${data.error}`);
        }
      }
    } catch (error) {
      console.error("Failed to create admin business:", error);
      alert("Failed to create business. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const toggleBusinessStatus = async (
    businessId: string,
    currentStatus: boolean,
  ) => {
    try {
      const response = await fetch(`/api/admin/businesses/${businessId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        fetchAdminBusinesses();
      }
    } catch (error) {
      console.error("Failed to update business:", error);
    }
  };

  // Fetch available users for reassignment (including admin)
  const fetchAvailableUsersForReassign = async () => {
    try {
      const response = await fetch(
        "/api/admin/users?limit=100&includeAdmin=true",
      );
      const data = await response.json();
      if (data.success) {
        // Sort users: admin first, then by name/email
        const sortedUsers = (data.users || []).sort((a: any, b: any) => {
          // Admin users first
          if (a.role === "superadmin" && b.role !== "superadmin") return -1;
          if (a.role !== "superadmin" && b.role === "superadmin") return 1;
          // Then sort alphabetically by name or email
          const aName = (a.name || a.email || "").toLowerCase();
          const bName = (b.name || b.email || "").toLowerCase();
          return aName.localeCompare(bName);
        });
        setAvailableUsers(sortedUsers);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  // Handle business reassignment
  const handleReassignBusiness = async () => {
    if (!duplicateError?.existingBusiness?.id || !newOwnerEmail) {
      alert("Please select a user to reassign the business to.");
      return;
    }

    // Find user by email
    const selectedUser = availableUsers.find((u) => u.email === newOwnerEmail);
    if (!selectedUser) {
      alert("Selected user not found.");
      return;
    }

    setReassigning(true);
    try {
      const response = await fetch(
        `/api/admin/businesses/${duplicateError.existingBusiness.id}/reassign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newOwnerId: selectedUser.id }),
        },
      );

      const data = await response.json();
      if (data.success) {
        alert(
          `Business successfully reassigned to ${selectedUser.name || selectedUser.email}`,
        );
        setShowReassignModal(false);
        setDuplicateError(null);
        setNewOwnerEmail("");
        // Refresh the list
        fetchAdminBusinesses();
      } else {
        alert(data.error || "Failed to reassign business");
      }
    } catch (error) {
      console.error("Failed to reassign business:", error);
      alert("An error occurred while reassigning the business");
    } finally {
      setReassigning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Admin Businesses
          </h1>
          <p className="text-slate-400">
            Manage admin-owned businesses (no restrictions)
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Store className="w-4 h-4 mr-2" />
          Create Admin Business
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="Search by business name or type..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10 bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="deleted">Deleted</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Businesses Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            </div>
          ) : businesses.length === 0 ? (
            <div className="py-12 text-center">
              <Crown className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No admin businesses found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-900/50 border-b border-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Business
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Generations
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {businesses.map((business) => (
                      <tr key={business.id} className="hover:bg-slate-800/30">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-white">
                              {business.businessName}
                            </div>
                            <div className="text-sm text-slate-400">
                              {business.businessType}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-300">
                            {business.generationCount} / ∞
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              business.isActive
                                ? "bg-green-100 text-green-700"
                                : business.previousState
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {business.isActive
                              ? "Active"
                              : business.previousState
                                ? "Archived"
                                : "Deleted"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                          {new Date(business.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            {business.previousState ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  if (
                                    confirm(
                                      "Restore this business to its previous state with unique Google Maps URL?",
                                    )
                                  ) {
                                    try {
                                      const response = await fetch(
                                        `/api/admin/businesses/${business.id}/restore`,
                                        {
                                          method: "POST",
                                        },
                                      );
                                      const data = await response.json();
                                      if (data.success) {
                                        alert("Business restored successfully");
                                        fetchAdminBusinesses();
                                      } else {
                                        alert(
                                          `Error: ${data.error || "Failed to restore business"}`,
                                        );
                                      }
                                    } catch (error) {
                                      console.error("Failed to restore:", error);
                                      alert("Failed to restore business");
                                    }
                                  }
                                }}
                                className="bg-green-700 border-green-600 text-white hover:bg-green-600"
                              >
                                Restore
                              </Button>
                            ) : (
                              <Switch
                                checked={business.isActive}
                                onCheckedChange={() =>
                                  toggleBusinessStatus(
                                    business.id,
                                    business.isActive,
                                  )
                                }
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-between">
                  <div className="text-sm text-slate-400">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="bg-slate-700 border-slate-600 text-white"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                      className="bg-slate-700 border-slate-600 text-white"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Business Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-800 border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">
                  Create Admin Business
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400"
                >
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateBusiness} className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">
                    Business Name *
                  </label>
                  <Input
                    value={formData.businessName}
                    onChange={(e) =>
                      setFormData({ ...formData, businessName: e.target.value })
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
                    value={formData.businessType}
                    onChange={(e) =>
                      setFormData({ ...formData, businessType: e.target.value })
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
                    value={formData.googleMapsUrl}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        googleMapsUrl: e.target.value,
                      })
                    }
                    required
                    className="bg-slate-900 border-slate-700 text-white"
                    placeholder="https://www.google.com/maps/place/..."
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">
                    Products/Services *
                  </label>
                  {formData.products.map((product, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        value={product}
                        onChange={(e) => {
                          const newProducts = [...formData.products];
                          newProducts[index] = e.target.value;
                          setFormData({ ...formData, products: newProducts });
                        }}
                        className="bg-slate-900 border-slate-700 text-white"
                        placeholder="Product/Service name"
                      />
                      {formData.products.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newProducts = formData.products.filter(
                              (_, i) => i !== index,
                            );
                            setFormData({ ...formData, products: newProducts });
                          }}
                          className="bg-red-700 border-red-600 text-white hover:bg-red-600"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        products: [...formData.products, ""],
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
                  {formData.employees.map((employee, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        value={employee}
                        onChange={(e) => {
                          const newEmployees = [...formData.employees];
                          newEmployees[index] = e.target.value;
                          setFormData({ ...formData, employees: newEmployees });
                        }}
                        className="bg-slate-900 border-slate-700 text-white"
                        placeholder="Employee name"
                      />
                      {formData.employees.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newEmployees = formData.employees.filter(
                              (_, i) => i !== index,
                            );
                            setFormData({
                              ...formData,
                              employees: newEmployees,
                            });
                          }}
                          className="bg-red-700 border-red-600 text-white hover:bg-red-600"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        employees: [...formData.employees, ""],
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
                    disabled={creating}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Business"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
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

      {/* Reassign Business Modal */}
      {showReassignModal && duplicateError?.existingBusiness && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-800 border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Reassign Business</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowReassignModal(false);
                    setNewOwnerEmail("");
                  }}
                  className="text-slate-400"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <CardDescription className="text-slate-400">
                Reassign "{duplicateError.existingBusiness.businessName}" to
                another user or admin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Select New Owner
                </label>
                <select
                  value={newOwnerEmail}
                  onChange={(e) => setNewOwnerEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">-- Select a user --</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.email}>
                      {user.role === "superadmin" ? "👑 " : ""}
                      {user.name || user.email}
                      {user.role === "superadmin"
                        ? " (ADMIN PLAN)"
                        : ` (${user.subscriptionTier.toUpperCase()})`}
                      {" - "}
                      {user.businessCount || 0} businesses
                    </option>
                  ))}
                </select>
              </div>

              {duplicateError.ownerDetails && (
                <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
                  <p className="text-sm text-yellow-200">
                    <strong>Current Owner:</strong>{" "}
                    {duplicateError.ownerDetails.name ||
                      duplicateError.ownerDetails.email}
                  </p>
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReassignModal(false);
                    setNewOwnerEmail("");
                  }}
                  disabled={reassigning}
                  className="border-slate-600 text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReassignBusiness}
                  disabled={!newOwnerEmail || reassigning}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {reassigning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Reassigning...
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      Reassign Business
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Dashboard Tab Component
function DashboardTab({ stats }: { stats: any }) {
  if (!stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-slate-400">
          Overview of platform statistics and activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {stats.totalUsers}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Total Businesses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {stats.totalBusinesses}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {stats.activeBusinesses} active, {stats.deletedBusinesses} deleted
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Total Feedbacks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {stats.totalFeedbacks}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Expired Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-400">
              {stats.expiredSubscriptions}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {stats.expiringSoon} expiring soon
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Breakdown Pie Chart */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Subscription Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <Pie
                  data={[
                    {
                      name: "Free",
                      value: stats.subscriptionBreakdown.free,
                      color: "#60a5fa",
                    },
                    {
                      name: "Pro",
                      value: stats.subscriptionBreakdown.pro,
                      color: "#a78bfa",
                    },
                    {
                      name: "Lifetime",
                      value: stats.subscriptionBreakdown.lifetime,
                      color: "#fbbf24",
                    },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => {
                    const percentage = percent
                      ? (percent * 100).toFixed(0)
                      : "0";
                    return percentage !== "0" ? `${name}: ${percentage}%` : "";
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[
                    {
                      name: "Free",
                      value: stats.subscriptionBreakdown.free,
                      color: "#60a5fa",
                    },
                    {
                      name: "Pro",
                      value: stats.subscriptionBreakdown.pro,
                      color: "#a78bfa",
                    },
                    {
                      name: "Lifetime",
                      value: stats.subscriptionBreakdown.lifetime,
                      color: "#fbbf24",
                    },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: "10px" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Business Status Bar Chart */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Business Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                margin={{ top: 10, right: 10, bottom: 50, left: 10 }}
                data={[
                  {
                    name: "Active",
                    value: stats.activeBusinesses,
                    color: "#10b981",
                  },
                  {
                    name: "Deleted",
                    value: stats.deletedBusinesses,
                    color: "#ef4444",
                  },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="name"
                  stroke="#9ca3af"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                <Bar dataKey="value" fill="#8884d8">
                  {[
                    {
                      name: "Active",
                      value: stats.activeBusinesses,
                      color: "#10b981",
                    },
                    {
                      name: "Deleted",
                      value: stats.deletedBusinesses,
                      color: "#ef4444",
                    },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Users Tab Component
function UsersTab({ setActiveTab }: { setActiveTab: (tab: Tab) => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBusiness, setSelectedBusiness] = useState<any | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, tierFilter, statusFilter, page]);

  const viewUserDetails = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      const data = await response.json();
      if (data.success) {
        setSelectedUser(data.user);
      }
    } catch (error) {
      console.error("Failed to fetch user details:", error);
    }
  };

  const viewBusinessDetails = async (businessId: string) => {
    try {
      const response = await fetch(`/api/admin/businesses/${businessId}`);
      const data = await response.json();
      if (data.success) {
        setSelectedBusiness(data.business);
      }
    } catch (error) {
      console.error("Failed to fetch business details:", error);
    }
  };

  // Check for userId from URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userIdParam = urlParams.get("userId");
    const tabParam = urlParams.get("tab");

    if (userIdParam && tabParam === "users") {
      // Fetch user details directly (user might not be in current page)
      viewUserDetails(userIdParam);
      // Clean up URL after a short delay to allow modal to open
      setTimeout(() => {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("userId");
        window.history.replaceState({}, "", newUrl.toString());
      }, 500);
    }
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });
      if (searchQuery) params.append("search", searchQuery);
      if (tierFilter !== "all") params.append("tier", tierFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();
      console.log("Users API Response:", data); // Debug log
      if (data.success) {
        setUsers(data.users || []);
        setTotalPages(data.pagination?.totalPages || 1);
        console.log(`Loaded ${data.users?.length || 0} users`); // Debug log
      } else {
        console.error("Failed to fetch users:", data.error);
        setUsers([]);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const updateUserTier = async (userId: string, tier: string) => {
    setUpdating(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionTier: tier }),
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Failed to update user:", error);
    } finally {
      setUpdating(null);
    }
  };

  const updateUserStatus = async (userId: string, status: string) => {
    setUpdating(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionStatus: status }),
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Failed to update user:", error);
    } finally {
      setUpdating(null);
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

  const getTierDisplayName = (tier: string) => {
    if (tier === "admin") return "ADMIN PLAN";
    return tier.toUpperCase();
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "expired":
        return "bg-red-100 text-red-700";
      case "cancelled":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  // Prepare chart data
  const tierChartData = [
    {
      name: "Free",
      value: users.filter((u) => u.subscriptionTier === "free").length,
    },
    {
      name: "Pro",
      value: users.filter((u) => u.subscriptionTier === "pro").length,
    },
    {
      name: "Lifetime",
      value: users.filter((u) => u.subscriptionTier === "lifetime").length,
    },
    // Note: Admin users are excluded from this chart as they have separate management
  ];

  const statusChartData = [
    {
      name: "Active",
      value: users.filter((u) => u.subscriptionStatus === "active").length,
    },
    {
      name: "Expired",
      value: users.filter((u) => u.subscriptionStatus === "expired").length,
    },
    {
      name: "Cancelled",
      value: users.filter((u) => u.subscriptionStatus === "cancelled").length,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
        <p className="text-slate-400">
          Manage users, subscriptions, and permissions
        </p>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Users by Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={tierChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" fill="#8884d8">
                  {tierChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.name === "Free"
                          ? "#60a5fa"
                          : entry.name === "Pro"
                            ? "#a78bfa"
                            : "#fbbf24"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Users by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statusChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" fill="#8884d8">
                  {statusChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.name === "Active"
                          ? "#10b981"
                          : entry.name === "Expired"
                            ? "#ef4444"
                            : "#6b7280"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="Search by email or name..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10 bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>
            <select
              value={tierFilter}
              onChange={(e) => {
                setTierFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
            >
              <option value="all">All Tiers</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="lifetime">Lifetime</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No users found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-900/50 border-b border-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Tier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Businesses
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-800/30">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <button
                              onClick={() => viewUserDetails(user.id)}
                              className="text-sm font-medium text-white hover:text-indigo-400 transition-colors cursor-pointer text-left"
                            >
                              {user.name || "No name"}
                            </button>
                            <div className="text-sm text-slate-400">
                              {user.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={user.subscriptionTier}
                            onChange={(e) =>
                              updateUserTier(user.id, e.target.value)
                            }
                            disabled={updating === user.id}
                            className={`px-2 py-1 rounded text-xs font-medium ${getTierBadgeColor(user.subscriptionTier)} border-0 bg-transparent`}
                          >
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                            <option value="lifetime">Lifetime</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={user.subscriptionStatus === "active"}
                              onCheckedChange={(checked) =>
                                updateUserStatus(
                                  user.id,
                                  checked ? "active" : "cancelled",
                                )
                              }
                              disabled={updating === user.id}
                            />
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(user.subscriptionStatus)}`}
                            >
                              {user.subscriptionStatus}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                          {user.businessCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewUserDetails(user.id)}
                            className="mr-2 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-between">
                  <div className="text-sm text-slate-400">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="bg-slate-700 border-slate-600 text-white"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                      className="bg-slate-700 border-slate-600 text-white"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-800 border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">User Details</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUser(null)}
                  className="text-slate-400"
                >
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">Email</label>
                <p className="text-white">{selectedUser.email}</p>
              </div>
              <div>
                <label className="text-sm text-slate-400">Name</label>
                <p className="text-white">
                  {selectedUser.name || "Not provided"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">
                    Subscription Tier
                  </label>
                  {selectedUser.role === "superadmin" ? (
                    <span
                      className={`inline-block px-3 py-2 rounded text-sm font-medium ${getTierBadgeColor("admin")}`}
                    >
                      ADMIN PLAN
                    </span>
                  ) : (
                    <select
                      value={selectedUser.subscriptionTier}
                      onChange={async (e) => {
                        await updateUserTier(selectedUser.id, e.target.value);
                        viewUserDetails(selectedUser.id);
                      }}
                      disabled={updating === selectedUser.id}
                      className={`px-3 py-2 rounded text-sm font-medium ${getTierBadgeColor(selectedUser.subscriptionTier)} border-0 bg-slate-900 text-white`}
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="lifetime">Lifetime</option>
                    </select>
                  )}
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">
                    Status
                  </label>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={selectedUser.subscriptionStatus === "active"}
                      onCheckedChange={async (checked) => {
                        await updateUserStatus(
                          selectedUser.id,
                          checked ? "active" : "cancelled",
                        );
                        viewUserDetails(selectedUser.id);
                      }}
                      disabled={updating === selectedUser.id}
                    />
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(selectedUser.subscriptionStatus)}`}
                    >
                      {selectedUser.subscriptionStatus}
                    </span>
                  </div>
                </div>
              </div>
              {selectedUser.subscriptionStartDate && (
                <div>
                  <label className="text-sm text-slate-400">
                    Subscription Start
                  </label>
                  <p className="text-white">
                    {new Date(
                      selectedUser.subscriptionStartDate,
                    ).toLocaleDateString()}
                  </p>
                </div>
              )}
              {selectedUser.subscriptionEndDate && (
                <div>
                  <label className="text-sm text-slate-400">
                    Subscription End
                  </label>
                  <p className="text-white">
                    {new Date(
                      selectedUser.subscriptionEndDate,
                    ).toLocaleDateString()}
                  </p>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm text-slate-400 font-medium">
                    Registered Businesses ({selectedUser.businessCount})
                  </label>
                  <div className="text-xs text-slate-400">
                    {selectedUser.businesses?.filter((b: any) => b.isActive)
                      .length || 0}{" "}
                    active,{" "}
                    {selectedUser.businesses?.filter((b: any) => !b.isActive)
                      .length || 0}{" "}
                    deleted
                  </div>
                </div>
                <div className="mt-2 space-y-3">
                  {selectedUser.businesses?.length === 0 ? (
                    <p className="text-slate-400 text-sm">
                      No businesses registered
                    </p>
                  ) : (
                    selectedUser.businesses?.map((business: any) => (
                      <div
                        key={business.id}
                        className="p-4 bg-slate-900 rounded-lg border border-slate-700 hover:border-indigo-500/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <button
                                onClick={() => viewBusinessDetails(business.id)}
                                className="text-white font-medium text-base hover:text-indigo-400 transition-colors cursor-pointer text-left"
                              >
                                {business.businessName}
                              </button>
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  selectedUser.subscriptionTier === "free"
                                    ? "bg-blue-100 text-blue-700"
                                    : selectedUser.subscriptionTier === "pro"
                                      ? "bg-purple-100 text-purple-700"
                                      : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {selectedUser.subscriptionTier.toUpperCase()}{" "}
                                Plan
                              </span>
                              {selectedUser.subscriptionTier !== "free" && (
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                  Subscribed
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-400 mb-3">
                              {business.businessType}
                            </p>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className="bg-slate-800/50 p-2 rounded">
                                <span className="text-slate-400">
                                  Generations:
                                </span>
                                <span className="text-white font-medium ml-2">
                                  {business.generationCount} /{" "}
                                  {selectedUser.role === "superadmin"
                                    ? "∞"
                                    : selectedUser.subscriptionTier === "free"
                                      ? "5"
                                      : "∞"}
                                </span>
                                {selectedUser.role !== "superadmin" &&
                                  selectedUser.subscriptionTier === "free" &&
                                  business.generationCount >= 5 && (
                                    <span className="ml-2 text-red-400 text-xs">
                                      (Limit Reached)
                                    </span>
                                  )}
                              </div>
                              <div className="bg-slate-800/50 p-2 rounded">
                                <span className="text-slate-400">
                                  Feedbacks:
                                </span>
                                <span className="text-white font-medium ml-2">
                                  {business.feedbackCount}
                                </span>
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-slate-500">
                              Created:{" "}
                              {new Date(
                                business.createdAt,
                              ).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Switch
                              checked={business.isActive}
                              onCheckedChange={async (checked) => {
                                try {
                                  const response = await fetch(
                                    `/api/admin/businesses/${business.id}`,
                                    {
                                      method: "PUT",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        isActive: checked,
                                      }),
                                    },
                                  );
                                  if (response.ok) {
                                    // Refresh user details
                                    viewUserDetails(selectedUser.id);
                                  }
                                } catch (error) {
                                  console.error(
                                    "Failed to update business:",
                                    error,
                                  );
                                }
                              }}
                            />
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                business.isActive
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {business.isActive ? "Active" : "Deleted"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {/* Subscription Summary */}
                {selectedUser.businessCount > 0 && (
                  <div className="mt-4 p-3 bg-indigo-900/20 border border-indigo-700/50 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">
                        Businesses with Subscription:
                      </span>
                      <span className="text-indigo-400 font-medium">
                        {selectedUser.role === "superadmin"
                          ? `${selectedUser.businessCount} (ADMIN PLAN - no restrictions)`
                          : selectedUser.subscriptionTier !== "free"
                            ? `${selectedUser.businessCount} (All on ${selectedUser.subscriptionTier} plan)`
                            : "0 (Free tier - no subscription)"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Business Details Modal for UsersTab */}
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
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">Business Name</label>
                <p className="text-white">{selectedBusiness.businessName}</p>
              </div>
              <div>
                <label className="text-sm text-slate-400">Business Type</label>
                <p className="text-white">{selectedBusiness.businessType}</p>
              </div>
              <div>
                <label className="text-sm text-slate-400">
                  Google Maps URL
                </label>
                <p className="text-white break-all text-sm">
                  {selectedBusiness.googleMapsUrl}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400">
                    Generation Count
                  </label>
                  <p className="text-white">
                    {selectedBusiness.generationCount} /{" "}
                    {selectedBusiness.owner?.role === "superadmin"
                      ? "∞"
                      : selectedBusiness.owner?.subscriptionTier === "free"
                        ? "5"
                        : "∞"}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Status</label>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        selectedBusiness.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {selectedBusiness.isActive ? "Active" : "Deleted"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subscription Details Section */}
              {selectedBusiness.owner && (
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
                          {selectedBusiness.owner.role === "superadmin" ? (
                            <span className="px-3 py-1 rounded text-sm font-medium bg-indigo-100 text-indigo-700">
                              ADMIN PLAN
                            </span>
                          ) : (
                            <span
                              className={`px-3 py-1 rounded text-sm font-medium ${
                                selectedBusiness.owner.subscriptionTier ===
                                "free"
                                  ? "bg-blue-100 text-blue-700"
                                  : selectedBusiness.owner.subscriptionTier ===
                                      "pro"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {selectedBusiness.owner.subscriptionTier?.toUpperCase() ||
                                "FREE"}
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
                              selectedBusiness.owner.subscriptionStatus ===
                              "active"
                                ? "bg-green-100 text-green-700"
                                : selectedBusiness.owner.subscriptionStatus ===
                                    "cancelled"
                                  ? "bg-red-100 text-red-700"
                                  : selectedBusiness.owner
                                        .subscriptionStatus === "expired"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {selectedBusiness.owner.subscriptionStatus?.toUpperCase() ||
                              "ACTIVE"}
                          </span>
                        </div>
                      </div>
                    </div>
                    {selectedBusiness.owner.subscriptionStartDate && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-slate-400">
                            Subscription Start Date
                          </label>
                          <p className="text-white text-sm mt-1">
                            {new Date(
                              selectedBusiness.owner.subscriptionStartDate,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        {selectedBusiness.owner.subscriptionEndDate && (
                          <div>
                            <label className="text-sm text-slate-400">
                              Subscription End Date
                            </label>
                            <p className="text-white text-sm mt-1">
                              {new Date(
                                selectedBusiness.owner.subscriptionEndDate,
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
                          {selectedBusiness.owner.businessLimit === -1
                            ? "Unlimited"
                            : `${selectedBusiness.owner.businessLimit} businesses`}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-slate-400">
                          Feedback Limit per Business
                        </label>
                        <p className="text-white text-sm mt-1">
                          {selectedBusiness.owner.feedbackLimit === -1
                            ? "Unlimited"
                            : `${selectedBusiness.owner.feedbackLimit} generations`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Businesses Tab Component
function BusinessesTab() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBusiness, setSelectedBusiness] = useState<any | null>(null);
  const [showReactivationModal, setShowReactivationModal] = useState(false);
  const [showActivitiesModal, setShowActivitiesModal] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchBusinesses();
  }, [searchQuery, ownerFilter, tierFilter, statusFilter, page]);

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });
      if (searchQuery) params.append("search", searchQuery);
      if (ownerFilter) params.append("ownerId", ownerFilter);
      if (tierFilter !== "all") params.append("tier", tierFilter);
      if (statusFilter !== "all")
        params.append("isActive", statusFilter === "active" ? "true" : "false");

      const response = await fetch(`/api/admin/businesses?${params}`);
      const data = await response.json();
      console.log("Businesses API Response:", data); // Debug log
      if (data.success) {
        setBusinesses(data.businesses || []);
        setTotalPages(data.pagination?.totalPages || 1);
        console.log(`Loaded ${data.businesses?.length || 0} businesses`); // Debug log
      } else {
        console.error("Failed to fetch businesses:", data.error);
        setBusinesses([]);
      }
    } catch (error) {
      console.error("Failed to fetch businesses:", error);
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  };

  const viewBusinessDetails = async (businessId: string) => {
    try {
      setShowActivitiesModal(false); // Close activities modal if open
      const response = await fetch(`/api/admin/businesses/${businessId}`);
      const data = await response.json();
      if (data.success) {
        setSelectedBusiness(data.business);
      }
    } catch (error) {
      console.error("Failed to fetch business details:", error);
    }
  };

  const toggleBusinessStatus = async (
    businessId: string,
    currentStatus: boolean,
  ) => {
    try {
      const response = await fetch(`/api/admin/businesses/${businessId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        fetchBusinesses();
      }
    } catch (error) {
      console.error("Failed to update business:", error);
    }
  };

  const resetGenerationCount = async (businessId: string) => {
    if (!confirm("Are you sure you want to reset the generation count to 0?"))
      return;

    try {
      const response = await fetch(`/api/admin/businesses/${businessId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generationCount: 0 }),
      });

      if (response.ok) {
        fetchBusinesses();
        if (selectedBusiness?.id === businessId) {
          viewBusinessDetails(businessId);
        }
      }
    } catch (error) {
      console.error("Failed to reset generation count:", error);
    }
  };

  const changeBusinessPlan = async (
    businessId: string,
    subscriptionTier: string,
    subscriptionStatus?: string,
  ) => {
    if (
      !confirm(
        `Are you sure you want to change this business's plan to ${subscriptionTier}?`,
      )
    )
      return;

    try {
      const response = await fetch(
        `/api/admin/businesses/${businessId}/change-plan`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscriptionTier,
            subscriptionStatus: subscriptionStatus || "active",
          }),
        },
      );

      const data = await response.json();
      if (data.success) {
        fetchBusinesses();
        if (selectedBusiness?.id === businessId) {
          viewBusinessDetails(businessId);
        }
        alert(`Plan changed successfully to ${subscriptionTier}`);
      } else {
        alert(`Failed to change plan: ${data.error}`);
      }
    } catch (error) {
      console.error("Failed to change business plan:", error);
      alert("Failed to change plan. Please try again.");
    }
  };

  const handleReactivation = async (resetCount: boolean, reason: string) => {
    if (!selectedBusiness) return;

    setReactivating(true);
    try {
      const response = await fetch(
        `/api/admin/businesses/${selectedBusiness.id}/reactivate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resetGenerationCount: resetCount,
            reason: reason || "Admin reactivation",
          }),
        },
      );

      const data = await response.json();
      if (data.success) {
        setShowReactivationModal(false);
        fetchBusinesses();
        if (selectedBusiness) {
          viewBusinessDetails(selectedBusiness.id);
        }
      }
    } catch (error) {
      console.error("Failed to reactivate business:", error);
    } finally {
      setReactivating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Business Management
        </h1>
        <p className="text-slate-400">
          Manage businesses, reactivations, and generation limits
        </p>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="Search by business name or type..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10 bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>
            <select
              value={tierFilter}
              onChange={(e) => {
                setTierFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
            >
              <option value="all">All Tiers</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="lifetime">Lifetime</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="deleted">Deleted</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Businesses Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            </div>
          ) : businesses.length === 0 ? (
            <div className="py-12 text-center">
              <Store className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No businesses found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-900/50 border-b border-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Business
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Owner
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Generations
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {businesses.map((business) => (
                      <tr key={business.id} className="hover:bg-slate-800/30">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <button
                              onClick={() => viewBusinessDetails(business.id)}
                              className="text-sm font-medium text-white hover:text-indigo-400 transition-colors cursor-pointer text-left"
                            >
                              {business.businessName}
                            </button>
                            <div className="text-sm text-slate-400">
                              {business.businessType}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-white">
                              {business.owner.name || business.owner.email}
                            </div>
                            <div className="text-xs text-slate-400">
                              {business.owner.email}
                            </div>
                            <span
                              className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${
                                business.owner.subscriptionTier === "free"
                                  ? "bg-blue-100 text-blue-700"
                                  : business.owner.subscriptionTier === "pro"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {business.owner.subscriptionTier}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-300">
                            {business.generationCount} /{" "}
                            {business.owner.subscriptionTier === "free"
                              ? "5"
                              : "∞"}
                          </div>
                          {business.owner.subscriptionTier === "free" &&
                            business.generationCount >= 5 && (
                              <div className="text-xs text-red-400 mt-1">
                                Limit reached
                              </div>
                            )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              business.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {business.isActive ? "Active" : "Deleted"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                          {new Date(business.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewBusinessDetails(business.id)}
                              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                            >
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedBusiness(business);
                                setShowActivitiesModal(true);
                              }}
                              className="bg-indigo-700 border-indigo-600 text-white hover:bg-indigo-600"
                            >
                              Activities
                            </Button>
                            {!business.isActive && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedBusiness(business);
                                  setShowReactivationModal(true);
                                }}
                                className="bg-green-700 border-green-600 text-white hover:bg-green-600"
                              >
                                Reactivate
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-between">
                  <div className="text-sm text-slate-400">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="bg-slate-700 border-slate-600 text-white"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                      className="bg-slate-700 border-slate-600 text-white"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Activities Modal */}
      {showActivitiesModal && selectedBusiness && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-800 border-slate-700 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">
                  Business Activities - {selectedBusiness.businessName}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowActivitiesModal(false);
                    setSelectedBusiness(null);
                  }}
                  className="text-slate-400"
                >
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <BusinessActivityLog
                businessId={selectedBusiness.id}
                isAdmin={true}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Business Details Modal */}
      {selectedBusiness && !showActivitiesModal && !showReactivationModal && (
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
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">Business Name</label>
                <p className="text-white">{selectedBusiness.businessName}</p>
              </div>
              <div>
                <label className="text-sm text-slate-400">Business Type</label>
                <p className="text-white">{selectedBusiness.businessType}</p>
              </div>
              <div>
                <label className="text-sm text-slate-400">
                  Google Maps URL
                </label>
                <p className="text-white break-all text-sm">
                  {selectedBusiness.googleMapsUrl}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400">
                    Generation Count
                  </label>
                  <p className="text-white">
                    {selectedBusiness.generationCount} /{" "}
                    {selectedBusiness.owner?.role === "superadmin"
                      ? "∞"
                      : selectedBusiness.owner?.subscriptionTier === "free"
                        ? "5"
                        : "∞"}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Owner Plan</label>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedBusiness.owner?.role === "superadmin" ? (
                      <span className="px-3 py-1 rounded text-sm font-medium bg-indigo-100 text-indigo-700">
                        ADMIN PLAN
                      </span>
                    ) : (
                      <select
                        value={
                          selectedBusiness.owner?.subscriptionTier || "free"
                        }
                        onChange={(e) =>
                          changeBusinessPlan(
                            selectedBusiness.id,
                            e.target.value,
                          )
                        }
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          selectedBusiness.owner?.subscriptionTier === "free"
                            ? "bg-blue-100 text-blue-700"
                            : selectedBusiness.owner?.subscriptionTier === "pro"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-yellow-100 text-yellow-700"
                        } border-0 bg-slate-900 text-white`}
                      >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="lifetime">Lifetime</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-400">Status</label>
                <div className="flex items-center gap-2 mt-1">
                  <Switch
                    checked={selectedBusiness.isActive}
                    onCheckedChange={async (checked) => {
                      try {
                        const response = await fetch(
                          `/api/admin/businesses/${selectedBusiness.id}`,
                          {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ isActive: checked }),
                          },
                        );
                        if (response.ok) {
                          viewBusinessDetails(selectedBusiness.id);
                          fetchBusinesses();
                        }
                      } catch (error) {
                        console.error("Failed to update business:", error);
                      }
                    }}
                  />
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedBusiness.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {selectedBusiness.isActive ? "Active" : "Deleted"}
                  </span>
                </div>
              </div>
              {selectedBusiness.deletedAt && (
                <div>
                  <label className="text-sm text-slate-400">Deleted At</label>
                  <p className="text-white">
                    {new Date(selectedBusiness.deletedAt).toLocaleString()}
                  </p>
                </div>
              )}
              {selectedBusiness.products &&
                selectedBusiness.products.length > 0 && (
                  <div>
                    <label className="text-sm text-slate-400">
                      Products/Services
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedBusiness.products.map((product: any) => (
                        <span
                          key={product.id}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                        >
                          {product.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              {selectedBusiness.employees &&
                selectedBusiness.employees.length > 0 && (
                  <div>
                    <label className="text-sm text-slate-400">Employees</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedBusiness.employees.map((employee: any) => (
                        <span
                          key={employee.id}
                          className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm"
                        >
                          {employee.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              {selectedBusiness.reactivations &&
                selectedBusiness.reactivations.length > 0 && (
                  <div>
                    <label className="text-sm text-slate-400">
                      Reactivation History
                    </label>
                    <div className="mt-2 space-y-2">
                      {selectedBusiness.reactivations.map(
                        (reactivation: any) => (
                          <div
                            key={reactivation.id}
                            className="p-3 bg-slate-900 rounded-lg"
                          >
                            <p className="text-white text-sm">
                              Reactivated on{" "}
                              {new Date(
                                reactivation.reactivatedAt,
                              ).toLocaleDateString()}
                            </p>
                            <p className="text-slate-400 text-xs mt-1">
                              Previous count:{" "}
                              {reactivation.previousGenerationCount} • Reason:{" "}
                              {reactivation.reason || "N/A"}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

              {/* Subscription Details Section (Admin Only) */}
              {selectedBusiness.owner && (
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
                          {selectedBusiness.owner.role === "superadmin" ? (
                            <span className="px-3 py-1 rounded text-sm font-medium bg-indigo-100 text-indigo-700">
                              ADMIN PLAN
                            </span>
                          ) : (
                            <span
                              className={`px-3 py-1 rounded text-sm font-medium ${
                                selectedBusiness.owner.subscriptionTier ===
                                "free"
                                  ? "bg-blue-100 text-blue-700"
                                  : selectedBusiness.owner.subscriptionTier ===
                                      "pro"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {selectedBusiness.owner.subscriptionTier?.toUpperCase() ||
                                "FREE"}
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
                              selectedBusiness.owner.subscriptionStatus ===
                              "active"
                                ? "bg-green-100 text-green-700"
                                : selectedBusiness.owner.subscriptionStatus ===
                                    "cancelled"
                                  ? "bg-red-100 text-red-700"
                                  : selectedBusiness.owner
                                        .subscriptionStatus === "expired"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {selectedBusiness.owner.subscriptionStatus?.toUpperCase() ||
                              "ACTIVE"}
                          </span>
                        </div>
                      </div>
                    </div>
                    {selectedBusiness.owner.role === "superadmin" ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-slate-400">
                            Plan Type
                          </label>
                          <p className="text-white text-sm mt-1">
                            Lifetime (Admin)
                          </p>
                        </div>
                        <div>
                          <label className="text-sm text-slate-400">
                            Payment Activity
                          </label>
                          <p className="text-white text-sm mt-1">
                            No payment required
                          </p>
                        </div>
                      </div>
                    ) : (
                      selectedBusiness.owner.subscriptionStartDate && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm text-slate-400">
                              Subscription Start Date
                            </label>
                            <p className="text-white text-sm mt-1">
                              {new Date(
                                selectedBusiness.owner.subscriptionStartDate,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          {selectedBusiness.owner.subscriptionEndDate && (
                            <div>
                              <label className="text-sm text-slate-400">
                                Subscription End Date
                              </label>
                              <p className="text-white text-sm mt-1">
                                {new Date(
                                  selectedBusiness.owner.subscriptionEndDate,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-slate-400">
                          Business Limit
                        </label>
                        <p className="text-white text-sm mt-1">
                          {selectedBusiness.owner.businessLimit === -1
                            ? "Unlimited"
                            : `${selectedBusiness.owner.businessLimit} businesses`}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-slate-400">
                          Feedback Limit per Business
                        </label>
                        <p className="text-white text-sm mt-1">
                          {selectedBusiness.owner.feedbackLimit === -1
                            ? "Unlimited"
                            : `${selectedBusiness.owner.feedbackLimit} generations`}
                        </p>
                      </div>
                    </div>
                    {selectedBusiness.owner.stripeCustomerId && (
                      <div>
                        <label className="text-sm text-slate-400">
                          Stripe Customer ID
                        </label>
                        <p className="text-white text-sm mt-1 font-mono">
                          {selectedBusiness.owner.stripeCustomerId}
                        </p>
                      </div>
                    )}
                    {selectedBusiness.owner.stripeSubscriptionId && (
                      <div>
                        <label className="text-sm text-slate-400">
                          Stripe Subscription ID
                        </label>
                        <p className="text-white text-sm mt-1 font-mono">
                          {selectedBusiness.owner.stripeSubscriptionId}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() =>
                    toggleBusinessStatus(
                      selectedBusiness.id,
                      selectedBusiness.isActive,
                    )
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                >
                  {selectedBusiness.isActive ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => resetGenerationCount(selectedBusiness.id)}
                  className="bg-yellow-700 border-yellow-600 text-white"
                >
                  Reset Generation Count
                </Button>
                {!selectedBusiness.isActive && (
                  <Button
                    variant="outline"
                    onClick={() => setShowReactivationModal(true)}
                    className="bg-green-700 border-green-600 text-white"
                  >
                    Reactivate
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reactivation Modal */}
      {showReactivationModal && selectedBusiness && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-800 border-slate-700 max-w-md w-full">
            <CardHeader>
              <CardTitle className="text-white">Reactivate Business</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-300">
                Reactivate <strong>{selectedBusiness.businessName}</strong>?
              </p>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-slate-300">
                  <input type="checkbox" id="resetCount" className="rounded" />
                  <span>Reset generation count to 0</span>
                </label>
                <div>
                  <label className="text-sm text-slate-400">
                    Reason (optional)
                  </label>
                  <Textarea
                    id="reason"
                    placeholder="Reason for reactivation..."
                    className="mt-1 bg-slate-900 border-slate-700 text-white"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReactivationModal(false);
                    const resetCount =
                      (
                        document.getElementById(
                          "resetCount",
                        ) as HTMLInputElement
                      )?.checked || false;
                    const reason =
                      (document.getElementById("reason") as HTMLInputElement)
                        ?.value || "";
                    handleReactivation(resetCount, reason);
                  }}
                  disabled={reactivating}
                  className="bg-green-700 border-green-600 text-white flex-1"
                >
                  {reactivating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Reactivating...
                    </>
                  ) : (
                    "Reactivate"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowReactivationModal(false)}
                  className="bg-slate-700 border-slate-600 text-white"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Payments Tab Component
function PaymentsTab() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(`/api/admin/payments?${params}`);
      const data = await response.json();
      if (data.success) {
        setPayments(data.payments);
      }
    } catch (error) {
      console.error("Failed to fetch payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case "expiring_soon":
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case "expired":
        return <XCircle className="w-5 h-5 text-red-400" />;
      case "cancelled":
        return <XCircle className="w-5 h-5 text-gray-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 border-green-200";
      case "expiring_soon":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "expired":
        return "bg-red-100 text-red-700 border-red-200";
      case "cancelled":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const isExpiringSoon = (endDate: string | null) => {
    if (!endDate) return false;
    const end = new Date(endDate);
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return end <= sevenDaysFromNow && end >= now;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Payment Management
        </h1>
        <p className="text-slate-400">
          Track subscription status and payment information
        </p>
      </div>

      {/* Filter */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expiring_soon">Expiring Soon</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            </div>
          ) : payments.length === 0 ? (
            <div className="py-12 text-center">
              <CreditCard className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No payment records found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {payments.map((payment) => (
                <div
                  key={payment.userId}
                  className="p-6 hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getPaymentStatusIcon(payment.paymentStatus)}
                        <div>
                          <h3 className="text-white font-medium">
                            {payment.name || payment.email}
                          </h3>
                          <p className="text-sm text-slate-400">
                            {payment.email}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <label className="text-xs text-slate-400">
                            Subscription Tier
                          </label>
                          <p
                            className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${
                              payment.subscriptionTier === "free"
                                ? "bg-blue-100 text-blue-700"
                                : payment.subscriptionTier === "pro"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {payment.subscriptionTier}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs text-slate-400">
                            Status
                          </label>
                          <p
                            className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium border ${getPaymentStatusColor(payment.paymentStatus)}`}
                          >
                            {payment.paymentStatus.replace("_", " ")}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs text-slate-400">
                            Start Date
                          </label>
                          <p className="text-white text-sm mt-1">
                            {payment.subscriptionStartDate
                              ? new Date(
                                  payment.subscriptionStartDate,
                                ).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs text-slate-400">
                            End Date
                          </label>
                          <p
                            className={`text-sm mt-1 ${
                              isExpiringSoon(payment.subscriptionEndDate)
                                ? "text-yellow-400 font-medium"
                                : payment.subscriptionEndDate &&
                                    new Date(payment.subscriptionEndDate) <
                                      new Date()
                                  ? "text-red-400 font-medium"
                                  : "text-white"
                            }`}
                          >
                            {payment.subscriptionEndDate
                              ? new Date(
                                  payment.subscriptionEndDate,
                                ).toLocaleDateString()
                              : "N/A"}
                            {isExpiringSoon(payment.subscriptionEndDate) && (
                              <span className="ml-2 text-xs">
                                ⚠️ Expiring soon
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      {payment.stripeCustomerId && (
                        <div className="mt-3 text-xs text-slate-400">
                          Stripe Customer: {payment.stripeCustomerId}
                        </div>
                      )}
                      <div className="mt-2 text-xs text-slate-400">
                        Businesses: {payment.businessCount}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Activity Log Tab Component
function ActivityTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityTypeFilter, setEntityTypeFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [entityTypeFilter, actionFilter, page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });
      if (entityTypeFilter !== "all")
        params.append("entityType", entityTypeFilter);
      if (actionFilter !== "all") params.append("action", actionFilter);

      const response = await fetch(`/api/admin/activity-log?${params}`);
      const data = await response.json();
      if (data.success) {
        setLogs(data.logs);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch activity logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes("user")) return <Users className="w-4 h-4" />;
    if (action.includes("business")) return <Store className="w-4 h-4" />;
    if (action.includes("subscription"))
      return <CreditCard className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes("delete") || action.includes("deactivate"))
      return "text-red-400";
    if (
      action.includes("create") ||
      action.includes("activate") ||
      action.includes("reactivate")
    )
      return "text-green-400";
    if (action.includes("update")) return "text-blue-400";
    return "text-slate-400";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Activity Log</h1>
        <p className="text-slate-400">
          View all admin actions and system events
        </p>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={entityTypeFilter}
              onChange={(e) => {
                setEntityTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
            >
              <option value="all">All Entity Types</option>
              <option value="user">Users</option>
              <option value="business">Businesses</option>
              <option value="subscription">Subscriptions</option>
            </select>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
            >
              <option value="all">All Actions</option>
              <option value="user_updated">User Updated</option>
              <option value="user_deleted">User Deleted</option>
              <option value="business_updated">Business Updated</option>
              <option value="business_deleted">Business Deleted</option>
              <option value="business_reactivated">Business Reactivated</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Activity Log List */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center">
              <Activity className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No activity logs found</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-700">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-6 hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 ${getActionColor(log.action)}`}>
                        {getActionIcon(log.action)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3
                            className={`text-sm font-medium ${getActionColor(log.action)}`}
                          >
                            {log.action
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </h3>
                          <span className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs">
                            {log.entityType}
                          </span>
                        </div>
                        <div className="text-sm text-slate-400 mb-2">
                          Admin:{" "}
                          <span className="text-slate-300">
                            {log.admin.email}
                          </span>
                          {log.admin.name && (
                            <span className="text-slate-500">
                              {" "}
                              ({log.admin.name})
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-slate-400 mb-2">
                          Entity ID:{" "}
                          <span className="text-slate-300 font-mono text-xs">
                            {log.entityId}
                          </span>
                        </div>
                        {log.details && (
                          <div className="mt-3 p-3 bg-slate-900 rounded-lg">
                            <p className="text-xs text-slate-400 mb-1">
                              Details:
                            </p>
                            <pre className="text-xs text-slate-300 overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        )}
                        <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-between">
                  <div className="text-sm text-slate-400">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="bg-slate-700 border-slate-600 text-white"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                      className="bg-slate-700 border-slate-600 text-white"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
