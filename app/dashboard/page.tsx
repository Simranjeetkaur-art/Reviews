"use client";

import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Plus,
  TrendingUp,
  Download,
  Link as LinkIcon,
  Copy,
  Share2,
  CheckCircle2,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
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
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  AlertCircle,
  User,
  ExternalLink,
  X,
  Loader2,
  Users,
} from "lucide-react";
import { UsageWarning } from "@/components/UsageWarning";
import { validateAndNormalizeGoogleMapsUrl } from "@/lib/url-normalizer";

export default function DashboardPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [businessData, setBusinessData] = useState({
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
  const [previewFeedbacks, setPreviewFeedbacks] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [reviewLink, setReviewLink] = useState<string>("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [generatedFeedbacks, setGeneratedFeedbacks] = useState<any[]>([]);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [copiedFeedbackId, setCopiedFeedbackId] = useState<string | null>(null);
  const [urlValidationError, setUrlValidationError] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<{
    message: string;
    showFormData: boolean;
    errorType?: string;
    isAdmin?: boolean;
    previousRegistration?: {
      businessName: string;
      businessType: string;
      googleMapsUrl: string;
      products: string[];
      employees: string[];
      registeredAt: string;
      deletedAt: string | null;
      generationCount: number;
      status: string;
    };
    existingBusiness?: {
      id?: string;
      businessName: string;
      businessType: string;
      googleMapsUrl: string;
      generationCount?: number;
      isActive?: boolean;
      registeredAt: string;
    };
    ownerDetails?: {
      id: string;
      email: string;
      name: string | null;
      subscriptionTier: string;
      subscriptionStatus: string;
      businessLimit: number;
      feedbackLimit: number;
      businessCount: number;
    };
    resolutionOptions?: string[];
  } | null>(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const [newOwnerEmail, setNewOwnerEmail] = useState("");
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [usageData, setUsageData] = useState<any>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [currentBusinessUsage, setCurrentBusinessUsage] = useState<{
    generationCount: number;
    limit: number;
    status: "available" | "warning" | "limit_reached";
  } | null>(null);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  // Fetch available users for reassignment (admin only)
  const fetchAvailableUsers = async () => {
    try {
      // Fetch all users including admin for reassignment
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
    if (!error?.existingBusiness?.id || !newOwnerEmail) {
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
        `/api/admin/businesses/${error.existingBusiness.id}/reassign`,
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
        setError(null);
        // Optionally refresh or redirect
        window.location.reload();
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

  useEffect(() => {
    if (businessId) {
      // Generate review link for customers (this is the page where they select reviews)
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const link = `${origin}/review/${businessId}`;
      setReviewLink(link);
      // QR code also points to the review page
      setQrCodeUrl(link);
    }
  }, [businessId]);

  // Fetch usage data
  const fetchUsageData = async () => {
    if (!user || user.subscriptionTier !== "free") return;

    setLoadingUsage(true);
    try {
      const response = await fetch("/api/usage");
      const data = await response.json();
      if (data.success) {
        setUsageData(data.usage);

        // If we have a businessId, find its usage
        if (businessId) {
          const businessUsage = data.usage.businesses.find(
            (b: any) => b.id === businessId,
          );
          if (businessUsage) {
            setCurrentBusinessUsage({
              generationCount: businessUsage.generationCount,
              limit: businessUsage.limit,
              status: businessUsage.status,
            });
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch usage data:", error);
    } finally {
      setLoadingUsage(false);
    }
  };

  // Fetch usage data on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchUsageData();
    }
  }, [user]);

  // Update current business usage when businessId or usageData changes
  useEffect(() => {
    if (businessId && usageData && user?.subscriptionTier === "free") {
      const businessUsage = usageData.businesses.find(
        (b: any) => b.id === businessId,
      );
      if (businessUsage) {
        setCurrentBusinessUsage({
          generationCount: businessUsage.generationCount,
          limit: businessUsage.limit,
          status: businessUsage.status,
        });
      }
    }
  }, [businessId, usageData, user]);

  const handleCopyFeedback = async (feedbackId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedFeedbackId(feedbackId);
      setTimeout(() => setCopiedFeedbackId(null), 2000);
    } catch (error) {
      console.error("Failed to copy feedback:", error);
    }
  };

  const handleShareToGoogle = () => {
    if (businessData.googleMapsUrl) {
      window.open(businessData.googleMapsUrl, "_blank");
    }
  };

  const handleDownloadQR = () => {
    if (!qrCodeRef.current || !qrCodeUrl) return;

    const svg = qrCodeRef.current.querySelector("svg");
    if (!svg) return;

    try {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      const svgBlob = new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) {
              const link = document.createElement("a");
              link.download = `${businessData.businessName.replace(/[^a-z0-9]/gi, "_")}-qr-code.png`;
              link.href = URL.createObjectURL(blob);
              link.click();
              URL.revokeObjectURL(link.href);
            }
            URL.revokeObjectURL(url);
          });
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch (error) {
      console.error("Error downloading QR code:", error);
    }
  };

  const addProduct = () => {
    setBusinessData((prev) => ({
      ...prev,
      products: [...prev.products, ""],
    }));
  };

  const updateProduct = (index: number, value: string) => {
    const newProducts = [...businessData.products];
    newProducts[index] = value;
    setBusinessData((prev) => ({ ...prev, products: newProducts }));
  };

  const addEmployee = () => {
    setBusinessData((prev) => ({
      ...prev,
      employees: [...prev.employees, ""],
    }));
  };

  const updateEmployee = (index: number, value: string) => {
    const newEmployees = [...businessData.employees];
    newEmployees[index] = value;
    setBusinessData((prev) => ({ ...prev, employees: newEmployees }));
  };

  const handleSubmit = async () => {
    // Validate Google Maps URL before submission
    const urlValidation = validateAndNormalizeGoogleMapsUrl(
      businessData.googleMapsUrl,
    );
    if (!urlValidation.valid) {
      setUrlValidationError(urlValidation.error || "Invalid URL format");
      setError({
        message:
          urlValidation.error || "Please enter a valid Google Maps Review URL.",
        showFormData: false,
        errorType: "INVALID_GOOGLE_MAPS_URL",
      });
      return;
    }
    setUrlValidationError(null);

    setLoading(true);
    setError(null);
    try {
      // Step 1: Create the business
      const businessResponse = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessData.businessName,
          businessType: businessData.businessType,
          googleMapsUrl: businessData.googleMapsUrl,
          googleMapsAboutUrl: businessData.googleMapsAboutUrl || undefined,
          businessLocation: businessData.businessLocation || undefined,
          products: businessData.products.filter((p) => p.trim() !== ""),
          employees: businessData.employees.filter((e) => e.trim() !== ""),
        }),
      });

      const businessData_result = await businessResponse.json();
      if (!businessData_result.success) {
        // Check if it's a duplicate business error, duplicate URL error, or server error
        const isDuplicateError =
          businessData_result.errorType === "DUPLICATE_BUSINESS_NAME" ||
          businessData_result.errorType === "DUPLICATE_GOOGLE_MAPS_URL" ||
          businessData_result.error?.includes("already exists");
        const isServerError = businessResponse.status >= 500;

        if (isDuplicateError || isServerError) {
          // Pre-fill form with previous registration details (except business name)
          if (businessData_result.previousRegistration) {
            setBusinessData((prev) => ({
              ...prev,
              businessType:
                businessData_result.previousRegistration.businessType ||
                prev.businessType,
              googleMapsUrl:
                businessData_result.previousRegistration.googleMapsUrl ||
                prev.googleMapsUrl,
              products:
                businessData_result.previousRegistration.products.length > 0
                  ? businessData_result.previousRegistration.products
                  : prev.products,
              employees:
                businessData_result.previousRegistration.employees.length > 0
                  ? businessData_result.previousRegistration.employees
                  : prev.employees,
              // Keep the current business name (user needs to change it)
            }));
          }

          // Handle different error types with user-friendly messages
          let errorMessage =
            businessData_result.error || "An error occurred. Please try again.";

          // Handle schema mismatch errors (Prisma client out of sync)
          if (
            businessData_result.errorType === "SCHEMA_MISMATCH" ||
            businessData_result.errorType === "DATABASE_ERROR" ||
            businessData_result.error?.includes("Unknown argument") ||
            businessData_result.error?.includes("__TURBOPACK__")
          ) {
            errorMessage =
              "The system is being updated. Please refresh the page and try again. If the problem persists, please contact support.";
          }

          setError({
            message: errorMessage,
            showFormData:
              businessData_result.errorType !== "SCHEMA_MISMATCH" &&
              businessData_result.errorType !== "DATABASE_ERROR",
            errorType: businessData_result.errorType || "SERVER_ERROR",
            isAdmin: businessData_result.isAdmin || false,
            previousRegistration: businessData_result.previousRegistration,
            existingBusiness: businessData_result.existingBusiness,
            ownerDetails: businessData_result.ownerDetails,
            resolutionOptions: businessData_result.resolutionOptions,
          });

          // For admin users with duplicate Google Maps URL, automatically fetch users for reassignment
          if (
            businessData_result.isAdmin &&
            businessData_result.errorType === "DUPLICATE_GOOGLE_MAPS_URL"
          ) {
            fetchAvailableUsers();
          }

          setStep(1); // Go back to step 1 to show the form with error
          setLoading(false);
          return;
        }
        throw new Error(
          businessData_result.error || "Failed to create business",
        );
      }

      const createdBusinessId = businessData_result.business.id;
      setBusinessId(createdBusinessId);

      // Step 2: Generate preview first
      setPreviewLoading(true);
      try {
        const previewResponse = await fetch("/api/feedbacks/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessName: businessData.businessName,
            businessType: businessData.businessType,
            googleMapsAboutUrl: businessData.googleMapsAboutUrl || undefined,
            products: businessData.products
              .filter((p) => p.trim() !== "")
              .map((name) => ({ name })),
            employees: businessData.employees
              .filter((e) => e.trim() !== "")
              .map((name) => ({ name })),
          }),
        });

        const previewData = await previewResponse.json();
        if (previewData.success) {
          setPreviewFeedbacks(previewData.preview);
          setStep(2.5); // Go to preview step
          setLoading(false);
          setPreviewLoading(false);
          return; // Don't generate full feedbacks yet
        }
      } catch (error) {
        console.error("Error generating preview:", error);
        // Continue with full generation if preview fails
      } finally {
        setPreviewLoading(false);
      }

      // Step 2: Generate feedbacks (if preview skipped or failed)
      const feedbackResponse = await fetch("/api/feedbacks/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: createdBusinessId,
          businessName: businessData.businessName,
          businessType: businessData.businessType,
          googleMapsAboutUrl: businessData.googleMapsAboutUrl || undefined,
          products: businessData.products
            .filter((p) => p.trim() !== "")
            .map((name) => ({ name })),
          employees: businessData.employees
            .filter((e) => e.trim() !== "")
            .map((name) => ({ name })),
        }),
      });

      const feedbackData = await feedbackResponse.json();
      if (!feedbackData.success) {
        if (feedbackData.requiresUpgrade) {
          // Update current business usage if provided
          if (feedbackData.usage) {
            setCurrentBusinessUsage({
              generationCount: feedbackData.usage.generationCount,
              limit: feedbackData.usage.limit,
              status: feedbackData.usage.status,
            });
          } else if (
            feedbackData.currentUsage !== undefined &&
            feedbackData.limit !== undefined
          ) {
            setCurrentBusinessUsage({
              generationCount: feedbackData.currentUsage,
              limit: feedbackData.limit,
              status: "limit_reached",
            });
          }

          const upgrade = confirm(
            `${feedbackData.error}\n\nWould you like to view pricing plans?`,
          );
          if (upgrade) {
            window.location.href = feedbackData.upgradeUrl || "/pricing";
          }
          setError({
            message: feedbackData.error,
            showFormData: false,
            errorType: "USAGE_LIMIT_REACHED",
          });
          setStep(2); // Stay on Step 2 to show the error
          setLoading(false);
          return;
        }

        // If it's a server error during feedback generation, show form data
        if (feedbackResponse.status >= 500) {
          setError({
            message:
              feedbackData.error ||
              feedbackData.details ||
              "An error occurred while generating reviews. Please try again with your business details.",
            showFormData: true,
            errorType: feedbackData.errorType || "GENERATION_ERROR",
          });
          setStep(1); // Go back to step 1 to show the form with error
          setLoading(false);
          return;
        }

        throw new Error(feedbackData.error || "Failed to generate feedbacks");
      }

      setFeedbackCount(feedbackData.count || 0);

      // Update current business usage if provided in response
      if (feedbackData.usage && user?.subscriptionTier === "free") {
        setCurrentBusinessUsage({
          generationCount: feedbackData.usage.generationCount,
          limit: feedbackData.usage.limit,
          status: feedbackData.usage.status,
        });
      }

      // Step 3: Fetch all generated feedbacks to display
      const allFeedbacksResponse = await fetch(
        `/api/feedbacks/${createdBusinessId}?all=true`,
      );
      const allFeedbacksData = await allFeedbacksResponse.json();
      if (allFeedbacksData.success) {
        setGeneratedFeedbacks(allFeedbacksData.feedbacks || []);
      }

      setStep(3);
      setError(null); // Clear any previous errors

      // Refresh usage data after successful generation
      await fetchUsageData();
    } catch (error) {
      console.error("Error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create business and generate feedbacks";

      // For any other errors, also show form data
      setError({
        message: errorMessage,
        showFormData: true,
      });
      setStep(1); // Go back to step 1
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="border-b border-white/20 bg-white/50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-indigo-600" />
              <span className="text-2xl font-bold gradient-text">
                ReviewBoost
              </span>
            </Link>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link href="/admin">Manage Businesses</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    step >= s
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-16 h-1 mx-2 transition-all ${
                      step > s ? "bg-indigo-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-16 mt-4">
            <span
              className={`text-sm ${step >= 1 ? "text-indigo-600 font-semibold" : "text-gray-500"}`}
            >
              Business Info
            </span>
            <span
              className={`text-sm ${step >= 2 ? "text-indigo-600 font-semibold" : "text-gray-500"}`}
            >
              Generate Reviews
            </span>
            <span
              className={`text-sm ${step >= 3 ? "text-indigo-600 font-semibold" : "text-gray-500"}`}
            >
              Get Your Link
            </span>
          </div>
        </div>

        {/* Step 1: Business Information */}
        {step === 1 && (
          <>
            {/* Usage Warning for Free Tier */}
            {usageData && user?.subscriptionTier === "free" && (
              <UsageWarning
                subscriptionTier={usageData.subscriptionTier}
                businesses={usageData.businesses}
                summary={usageData.summary}
              />
            )}
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">
                  Tell Us About Your Business
                </CardTitle>
                <CardDescription>
                  We'll use this information to generate personalized review
                  templates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Error Message */}
                {error && (
                  <div
                    className={`border-2 rounded-lg p-4 space-y-3 ${
                      error.errorType === "SCHEMA_MISMATCH" ||
                      error.errorType === "DATABASE_ERROR"
                        ? "bg-blue-50 border-blue-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                          error.errorType === "SCHEMA_MISMATCH" ||
                          error.errorType === "DATABASE_ERROR"
                            ? "text-blue-600"
                            : "text-red-600"
                        }`}
                      >
                        {error.errorType === "SCHEMA_MISMATCH" ||
                        error.errorType === "DATABASE_ERROR"
                          ? "ℹ️"
                          : "⚠️"}
                      </div>
                      <div className="flex-1">
                        <h3
                          className={`font-semibold mb-1 ${
                            error.errorType === "SCHEMA_MISMATCH" ||
                            error.errorType === "DATABASE_ERROR"
                              ? "text-blue-900"
                              : "text-red-900"
                          }`}
                        >
                          {error.message}
                        </h3>
                        {(error.errorType === "SCHEMA_MISMATCH" ||
                          error.errorType === "DATABASE_ERROR") && (
                          <div className="mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.location.reload()}
                              className="bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                            >
                              Refresh Page
                            </Button>
                          </div>
                        )}
                        {error.errorType &&
                          error.errorType !== "SCHEMA_MISMATCH" &&
                          error.errorType !== "DATABASE_ERROR" && (
                            <p
                              className={`text-xs mb-2 ${
                                error.errorType === "SCHEMA_MISMATCH" ||
                                error.errorType === "DATABASE_ERROR"
                                  ? "text-blue-700"
                                  : "text-red-700"
                              }`}
                            >
                              <span className="font-semibold">Error Type:</span>{" "}
                              <span
                                className={`font-mono px-2 py-0.5 rounded ${
                                  error.errorType === "SCHEMA_MISMATCH" ||
                                  error.errorType === "DATABASE_ERROR"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {error.errorType}
                              </span>
                            </p>
                          )}

                        {/* Regular user: Duplicate Google Maps URL - Contact Support */}
                        {!error.isAdmin &&
                          error.errorType === "DUPLICATE_GOOGLE_MAPS_URL" && (
                            <div className="mt-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 space-y-3">
                              <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <h4 className="font-semibold text-yellow-900 mb-2">
                                    Business Already Registered
                                  </h4>
                                  <p className="text-sm text-yellow-800 mb-3">
                                    This business is already registered with
                                    another account. Each Google Maps location
                                    can only be registered once.
                                  </p>
                                  <div className="bg-white rounded-md p-3 border border-yellow-200 space-y-2 text-sm">
                                    <p className="font-medium text-gray-700">
                                      To resolve this issue, please contact our
                                      Support team for assistance with business
                                      reassignment.
                                    </p>
                                    <p className="text-gray-600">
                                      Our support team can help you reassign
                                      this business to your account or provide
                                      alternative solutions.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                        {/* Admin-specific: Duplicate Google Maps URL with owner details */}
                        {error.isAdmin &&
                          error.errorType === "DUPLICATE_GOOGLE_MAPS_URL" &&
                          error.ownerDetails && (
                            <div className="mt-4 bg-indigo-50 border-2 border-indigo-300 rounded-lg p-4 space-y-3">
                              <h4 className="font-semibold text-indigo-900 text-sm flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Current Business Owner Details
                              </h4>
                              <div className="bg-white rounded-md p-3 border border-indigo-200 space-y-2 text-sm">
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Owner Name:
                                  </span>{" "}
                                  <span className="text-gray-900">
                                    {error.ownerDetails.name || "N/A"}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Owner Email:
                                  </span>{" "}
                                  <span className="text-gray-900">
                                    {error.ownerDetails.email}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Subscription Plan:
                                  </span>{" "}
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      error.ownerDetails.subscriptionTier ===
                                      "free"
                                        ? "bg-blue-100 text-blue-700"
                                        : error.ownerDetails
                                              .subscriptionTier === "pro"
                                          ? "bg-purple-100 text-purple-700"
                                          : error.ownerDetails
                                                .subscriptionTier === "lifetime"
                                            ? "bg-yellow-100 text-yellow-700"
                                            : "bg-gray-100 text-gray-700"
                                    }`}
                                  >
                                    {error.ownerDetails.subscriptionTier.toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Subscription Status:
                                  </span>{" "}
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      error.ownerDetails.subscriptionStatus ===
                                      "active"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-700"
                                    }`}
                                  >
                                    {error.ownerDetails.subscriptionStatus}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Business Allocation:
                                  </span>{" "}
                                  <span className="text-gray-900">
                                    {error.ownerDetails.businessCount} /{" "}
                                    {error.ownerDetails.businessLimit === -1
                                      ? "∞"
                                      : error.ownerDetails.businessLimit}{" "}
                                    businesses
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Feedback Limit:
                                  </span>{" "}
                                  <span className="text-gray-900">
                                    {error.ownerDetails.feedbackLimit === -1
                                      ? "Unlimited"
                                      : `${error.ownerDetails.feedbackLimit} per business`}
                                  </span>
                                </div>
                                {error.existingBusiness && (
                                  <div>
                                    <span className="font-medium text-gray-700">
                                      Generations Used:
                                    </span>{" "}
                                    <span className="text-gray-900">
                                      {error.existingBusiness.generationCount ||
                                        0}{" "}
                                      /{" "}
                                      {error.ownerDetails.feedbackLimit === -1
                                        ? "∞"
                                        : error.ownerDetails.feedbackLimit}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2 mt-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    window.open(
                                      `/admin/dashboard?tab=users&userId=${error.ownerDetails?.id}`,
                                      "_blank",
                                    )
                                  }
                                  className="text-indigo-600 border-indigo-300"
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  View User Page
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => {
                                    setShowReassignModal(true);
                                    fetchAvailableUsers();
                                  }}
                                  className="bg-indigo-600 hover:bg-indigo-700"
                                >
                                  <Users className="w-4 h-4 mr-2" />
                                  Reassign Business
                                </Button>
                              </div>
                            </div>
                          )}

                        {/* Previous Registration Details (for duplicate business errors) */}
                        {error.previousRegistration && (
                          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
                            <h4 className="font-semibold text-yellow-900 text-sm">
                              📋 Previous Registration Details
                            </h4>
                            <div className="bg-white rounded-md p-3 border border-yellow-200 space-y-2 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">
                                  Business Name:
                                </span>{" "}
                                <span className="text-gray-900">
                                  {error.previousRegistration.businessName}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">
                                  Business Type:
                                </span>{" "}
                                <span className="text-gray-900">
                                  {error.previousRegistration.businessType}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">
                                  Google Maps URL:
                                </span>{" "}
                                <span className="text-gray-900 break-all text-xs">
                                  {error.previousRegistration.googleMapsUrl}
                                </span>
                              </div>
                              {error.previousRegistration.products.length >
                                0 && (
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Products/Services:
                                  </span>{" "}
                                  <span className="text-gray-900">
                                    {error.previousRegistration.products.join(
                                      ", ",
                                    )}
                                  </span>
                                </div>
                              )}
                              {error.previousRegistration.employees.length >
                                0 && (
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Employees:
                                  </span>{" "}
                                  <span className="text-gray-900">
                                    {error.previousRegistration.employees.join(
                                      ", ",
                                    )}
                                  </span>
                                </div>
                              )}
                              <div>
                                <span className="font-medium text-gray-700">
                                  Status:
                                </span>{" "}
                                <span
                                  className={`px-2 py-0.5 rounded text-xs ${
                                    error.previousRegistration.status ===
                                    "active"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {error.previousRegistration.status ===
                                  "active"
                                    ? "Active"
                                    : "Deleted"}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">
                                  Registered:
                                </span>{" "}
                                <span className="text-gray-900">
                                  {new Date(
                                    error.previousRegistration.registeredAt,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              {error.previousRegistration.deletedAt && (
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Deleted:
                                  </span>{" "}
                                  <span className="text-gray-900">
                                    {new Date(
                                      error.previousRegistration.deletedAt,
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                              <div>
                                <span className="font-medium text-gray-700">
                                  Generations Used:
                                </span>{" "}
                                <span className="text-gray-900">
                                  {error.previousRegistration.generationCount} /
                                  5
                                </span>
                              </div>
                            </div>

                            {/* Resolution Options */}
                            {error.resolutionOptions &&
                              error.resolutionOptions.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-xs font-medium text-yellow-800 mb-2">
                                    Resolution Options:
                                  </p>
                                  <ul className="list-disc list-inside space-y-1 text-xs text-yellow-700">
                                    {error.resolutionOptions.map(
                                      (option, idx) => (
                                        <li key={idx}>{option}</li>
                                      ),
                                    )}
                                  </ul>
                                  <div className="flex gap-2 mt-3">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setBusinessData((prev) => ({
                                          ...prev,
                                          businessName: "",
                                        }));
                                        setError(null);
                                      }}
                                      className="text-xs"
                                    >
                                      Use Different Name
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        (window.location.href = "/pricing")
                                      }
                                      className="text-xs"
                                    >
                                      Upgrade to Pro
                                    </Button>
                                  </div>
                                </div>
                              )}
                          </div>
                        )}

                        {error.showFormData && !error.previousRegistration && (
                          <div className="mt-3 space-y-2">
                            <p className="text-sm text-red-800 font-medium">
                              Please re-register your business with the details
                              below:
                            </p>
                            <div className="bg-white rounded-md p-3 border border-red-200 space-y-2 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">
                                  Business Name:
                                </span>{" "}
                                <span className="text-gray-900">
                                  {businessData.businessName || "Not provided"}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">
                                  Business Type:
                                </span>{" "}
                                <span className="text-gray-900">
                                  {businessData.businessType || "Not provided"}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">
                                  Google Maps URL:
                                </span>{" "}
                                <span className="text-gray-900 break-all">
                                  {businessData.googleMapsUrl || "Not provided"}
                                </span>
                              </div>
                              {businessData.products.filter(
                                (p) => p.trim() !== "",
                              ).length > 0 && (
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Products/Services:
                                  </span>{" "}
                                  <span className="text-gray-900">
                                    {businessData.products
                                      .filter((p) => p.trim() !== "")
                                      .join(", ")}
                                  </span>
                                </div>
                              )}
                              {businessData.employees.filter(
                                (e) => e.trim() !== "",
                              ).length > 0 && (
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Employees:
                                  </span>{" "}
                                  <span className="text-gray-900">
                                    {businessData.employees
                                      .filter((e) => e.trim() !== "")
                                      .join(", ")}
                                  </span>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-red-700 mt-2">
                              💡 All your details are pre-filled below. Please
                              review and try again, or modify any fields if
                              needed.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name *
                  </label>
                  <Input
                    placeholder="e.g., Joe's Coffee Shop"
                    value={businessData.businessName}
                    onChange={(e) =>
                      setBusinessData((prev) => ({
                        ...prev,
                        businessName: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Type *
                  </label>
                  <Input
                    placeholder="e.g., Coffee Shop, Restaurant, Salon"
                    value={businessData.businessType}
                    onChange={(e) =>
                      setBusinessData((prev) => ({
                        ...prev,
                        businessType: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Google Maps Review URL *
                  </label>
                  <Input
                    placeholder="https://g.page/r/... or https://maps.google.com/..."
                    value={businessData.googleMapsUrl}
                    onChange={(e) => {
                      const value = e.target.value;
                      setBusinessData((prev) => ({
                        ...prev,
                        googleMapsUrl: value,
                      }));
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
                    className={urlValidationError ? "border-red-500" : ""}
                  />
                  {urlValidationError && (
                    <p className="text-xs text-red-500 mt-1">
                      {urlValidationError}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    This is where customers will be redirected to leave their
                    review. Enter a valid Google Maps Review URL.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Google Maps About URL{" "}
                    <span className="text-gray-400">(Optional)</span>
                  </label>
                  <Input
                    placeholder="https://www.google.com/maps/place/..."
                    value={businessData.googleMapsAboutUrl}
                    onChange={(e) =>
                      setBusinessData((prev) => ({
                        ...prev,
                        googleMapsAboutUrl: e.target.value,
                      }))
                    }
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    We'll use this to extract business details (accessibility,
                    service options, highlights) to create more personalized
                    reviews.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Location{" "}
                    <span className="text-gray-400">(Optional)</span>
                  </label>
                  <Input
                    placeholder="e.g., 123 Main Street, City, State, ZIP Code"
                    value={businessData.businessLocation || ""}
                    onChange={(e) =>
                      setBusinessData((prev) => ({
                        ...prev,
                        businessLocation: e.target.value,
                      }))
                    }
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Physical address or location of your business
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    About Business{" "}
                    <span className="text-gray-400">
                      (Optional, max 50 words)
                    </span>
                  </label>
                  <Textarea
                    placeholder="Tell us about your business in a few words..."
                    value={businessData.aboutBusiness || ""}
                    onChange={(e) => {
                      const text = e.target.value;
                      const wordCount = text
                        .trim()
                        .split(/\s+/)
                        .filter(Boolean).length;
                      if (wordCount <= 50 || text.trim() === "") {
                        setBusinessData((prev) => ({
                          ...prev,
                          aboutBusiness: text,
                        }));
                      }
                    }}
                    className="w-full"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {businessData.aboutBusiness
                      ? `${businessData.aboutBusiness.trim().split(/\s+/).filter(Boolean).length} / 50 words`
                      : "0 / 50 words"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand Logo URL{" "}
                    <span className="text-gray-400">(Optional)</span>
                  </label>
                  <Input
                    placeholder="https://example.com/logo.png or /images/logo.png"
                    value={businessData.brandLogo || ""}
                    onChange={(e) =>
                      setBusinessData((prev) => ({
                        ...prev,
                        brandLogo: e.target.value,
                      }))
                    }
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the URL or path to your brand logo image
                  </p>
                  {businessData.brandLogo && (
                    <div className="mt-2">
                      <img
                        src={businessData.brandLogo}
                        alt="Brand Logo Preview"
                        className="h-20 w-20 object-contain border border-gray-300 rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Products/Services
                  </label>
                  {businessData.products.map((product, index) => (
                    <div key={index} className="mb-2">
                      <Input
                        placeholder="e.g., Cappuccino, Latte, Pastries"
                        value={product}
                        onChange={(e) => updateProduct(index, e.target.value)}
                      />
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addProduct}
                    className="mt-2"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product/Service
                  </Button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee Names (Optional)
                  </label>
                  {businessData.employees.map((employee, index) => (
                    <div key={index} className="mb-2">
                      <Input
                        placeholder="e.g., Sarah, Mike"
                        value={employee}
                        onChange={(e) => updateEmployee(index, e.target.value)}
                      />
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addEmployee}
                    className="mt-2"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Employee
                  </Button>
                </div>

                <div className="space-y-3">
                  {error && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setError(null);
                      }}
                    >
                      Clear Error & Continue
                    </Button>
                  )}
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={async () => {
                      setError(null);
                      setUrlValidationError(null);
                      setLoading(true);

                      try {
                        // Step 1: Validate URL before proceeding (for both new and existing businesses)
                        const urlValidationResponse = await fetch(
                          "/api/businesses",
                          {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              googleMapsUrl: businessData.googleMapsUrl,
                            }),
                          },
                        );

                        const urlValidationData =
                          await urlValidationResponse.json();

                        if (!urlValidationData.success) {
                          if (
                            urlValidationData.errorType ===
                              "DUPLICATE_GOOGLE_MAPS_URL" ||
                            urlValidationData.errorType ===
                              "DUPLICATE_GOOGLE_MAPS_URL_OWN"
                          ) {
                            setError({
                              message: urlValidationData.error,
                              showFormData: true,
                              errorType: urlValidationData.errorType,
                              isAdmin: urlValidationData.isAdmin,
                              existingBusiness:
                                urlValidationData.existingBusiness,
                              resolutionOptions:
                                urlValidationData.resolutionOptions,
                              supportMessage: urlValidationData.supportMessage,
                            });

                            // For admin users with duplicate Google Maps URL, automatically fetch users for reassignment
                            if (
                              urlValidationData.isAdmin &&
                              urlValidationData.errorType ===
                                "DUPLICATE_GOOGLE_MAPS_URL"
                            ) {
                              fetchAvailableUsers();
                            }

                            setLoading(false);
                            return; // Don't proceed to step 2
                          } else if (
                            urlValidationData.errorType ===
                            "INVALID_GOOGLE_MAPS_URL"
                          ) {
                            setUrlValidationError(urlValidationData.error);
                            setError({
                              message: urlValidationData.error,
                              showFormData: false,
                              errorType: urlValidationData.errorType,
                            });
                            setLoading(false);
                            return;
                          }
                        }

                        // URL is valid, continue with usage validation if business exists
                        if (businessId) {
                          // If business already exists, validate usage before proceeding
                          const usageResponse = await fetch(
                            "/api/businesses/validate-usage",
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ businessId }),
                            },
                          );

                          const usageData = await usageResponse.json();

                          if (!usageData.success || !usageData.canGenerate) {
                            // Update current business usage state
                            if (usageData.usage) {
                              setCurrentBusinessUsage({
                                generationCount:
                                  usageData.usage.generationCount,
                                limit: usageData.usage.limit,
                                status: usageData.usage.status,
                              });
                            }

                            // Show error if limit reached
                            if (usageData.requiresUpgrade) {
                              const upgrade = confirm(
                                `${usageData.error}\n\nWould you like to view pricing plans?`,
                              );
                              if (upgrade) {
                                window.location.href =
                                  usageData.upgradeUrl || "/pricing";
                              }
                              setError({
                                message: usageData.error,
                                showFormData: false,
                                errorType: "USAGE_LIMIT_REACHED",
                              });
                              setLoading(false);
                              return;
                            }

                            setError({
                              message:
                                usageData.error ||
                                "Cannot proceed to review generation",
                              showFormData: false,
                              errorType: "USAGE_LIMIT_REACHED",
                            });
                            setLoading(false);
                            return;
                          }

                          // Update usage state if available
                          if (usageData.usage) {
                            setCurrentBusinessUsage({
                              generationCount: usageData.usage.generationCount,
                              limit: usageData.usage.limit,
                              status: usageData.usage.status,
                            });
                          }
                        }

                        // Both URL and usage are valid, proceed to Step 2
                        setStep(2);
                      } catch (error) {
                        console.error("Error validating:", error);
                        setError({
                          message: "Failed to validate. Please try again.",
                          showFormData: false,
                        });
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={
                      !businessData.businessName ||
                      !businessData.businessType ||
                      !businessData.googleMapsUrl ||
                      loading
                    }
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Validating...
                      </>
                    ) : (
                      "Continue to Review Generation"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Step 2: Generate Reviews */}
        {step === 2 && (
          <>
            {/* Usage Warning for Free Tier */}
            {usageData && user?.subscriptionTier === "free" && (
              <UsageWarning
                subscriptionTier={usageData.subscriptionTier}
                businesses={usageData.businesses}
                summary={usageData.summary}
              />
            )}
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">
                  Generate Review Templates
                </CardTitle>
                <CardDescription>
                  Our AI will create 100+ unique review templates for your
                  business
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                  <h3 className="font-semibold text-indigo-900 mb-2">
                    What we'll generate:
                  </h3>
                  <ul className="space-y-2 text-sm text-indigo-700">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">✓</span>
                      <span>70 positive review templates (4-5 star tone)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">✓</span>
                      <span>30 neutral review templates (3-4 star tone)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">✓</span>
                      <span>
                        Personalized mentions of your products and staff
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">✓</span>
                      <span>Natural, authentic language variations</span>
                    </li>
                  </ul>
                </div>

                {/* Current Business Usage Display (if editing existing business) */}
                {currentBusinessUsage && user?.subscriptionTier === "free" && (
                  <div
                    className={`p-4 rounded-lg border ${
                      currentBusinessUsage.status === "limit_reached"
                        ? "bg-red-50 border-red-300"
                        : currentBusinessUsage.status === "warning"
                          ? "bg-yellow-50 border-yellow-300"
                          : "bg-green-50 border-green-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">
                        Free Tier Usage: {currentBusinessUsage.generationCount}{" "}
                        / {currentBusinessUsage.limit} generations
                      </span>
                      {currentBusinessUsage.status === "limit_reached" && (
                        <span className="text-sm text-red-600 font-medium">
                          Limit Reached
                        </span>
                      )}
                      {currentBusinessUsage.status === "warning" && (
                        <span className="text-sm text-yellow-600 font-medium">
                          Warning
                        </span>
                      )}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          currentBusinessUsage.status === "limit_reached"
                            ? "bg-red-500"
                            : currentBusinessUsage.status === "warning"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                        style={{
                          width: `${Math.min(100, (currentBusinessUsage.generationCount / currentBusinessUsage.limit) * 100)}%`,
                        }}
                      />
                    </div>
                    {currentBusinessUsage.status === "limit_reached" && (
                      <div className="space-y-2">
                        <p className="text-sm text-red-700">
                          This business has reached the{" "}
                          {currentBusinessUsage.limit}-generation limit. Please
                          upgrade to Pro (₹9,999 / 6 months) to continue
                          generating reviews.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => (window.location.href = "/pricing")}
                          className="w-full border-red-300 text-red-700 hover:bg-red-50"
                        >
                          Upgrade to Pro
                        </Button>
                      </div>
                    )}
                    {currentBusinessUsage.status === "warning" && (
                      <p className="text-sm text-yellow-700">
                        You're approaching your limit.{" "}
                        {currentBusinessUsage.generationCount} of{" "}
                        {currentBusinessUsage.limit} generations used.{" "}
                        {currentBusinessUsage.limit -
                          currentBusinessUsage.generationCount}{" "}
                        generation
                        {currentBusinessUsage.limit -
                          currentBusinessUsage.generationCount !==
                        1
                          ? "s"
                          : ""}{" "}
                        remaining.
                      </p>
                    )}
                    {currentBusinessUsage.status === "available" && (
                      <p className="text-sm text-green-700">
                        {currentBusinessUsage.limit -
                          currentBusinessUsage.generationCount}{" "}
                        generation
                        {currentBusinessUsage.limit -
                          currentBusinessUsage.generationCount !==
                        1
                          ? "s"
                          : ""}{" "}
                        remaining on your free tier.
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={
                      loading ||
                      (currentBusinessUsage?.status === "limit_reached" &&
                        user?.subscriptionTier === "free")
                    }
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Generating Reviews...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Generate Reviews with AI
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setStep(1)}
                    disabled={loading}
                  >
                    Back
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Step 2.5: Preview Feedbacks */}
        {step === 2.5 && (
          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">
                Preview Generated Reviews
              </CardTitle>
              <CardDescription>
                Review a sample of the feedbacks that will be generated for your
                business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {previewLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-gray-600">Generating preview...</p>
                </div>
              ) : previewFeedbacks.length > 0 ? (
                <>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <p className="text-sm text-indigo-700">
                      <strong>Preview:</strong> This is a sample of 10
                      feedbacks. The system will generate 100 total feedbacks
                      (70 positive, 30 neutral) when you proceed.
                    </p>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {previewFeedbacks.map((feedback, index) => (
                      <div
                        key={index}
                        className="bg-white p-4 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <span
                            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                              feedback.sentiment === "positive"
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {feedback.sentiment === "positive"
                              ? "Positive"
                              : "Neutral"}
                          </span>
                          <span className="text-xs text-gray-500 capitalize">
                            {feedback.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {feedback.content}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={async () => {
                        if (!businessId) return;
                        setLoading(true);
                        try {
                          const feedbackResponse = await fetch(
                            "/api/feedbacks/generate",
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                businessId,
                                businessName: businessData.businessName,
                                businessType: businessData.businessType,
                                googleMapsAboutUrl:
                                  businessData.googleMapsAboutUrl || undefined,
                                products: businessData.products
                                  .filter((p) => p.trim() !== "")
                                  .map((name) => ({ name })),
                                employees: businessData.employees
                                  .filter((e) => e.trim() !== "")
                                  .map((name) => ({ name })),
                              }),
                            },
                          );

                          const feedbackData = await feedbackResponse.json();
                          if (!feedbackData.success) {
                            throw new Error(
                              feedbackData.error ||
                                "Failed to generate feedbacks",
                            );
                          }

                          setFeedbackCount(feedbackData.count || 0);

                          // Fetch all generated feedbacks
                          const allFeedbacksResponse = await fetch(
                            `/api/feedbacks/${businessId}?all=true`,
                          );
                          const allFeedbacksData =
                            await allFeedbacksResponse.json();
                          if (allFeedbacksData.success) {
                            setGeneratedFeedbacks(
                              allFeedbacksData.feedbacks || [],
                            );
                          }

                          setStep(3);
                          await fetchUsageData();
                        } catch (error) {
                          console.error("Error generating feedbacks:", error);
                          setError({
                            message:
                              error instanceof Error
                                ? error.message
                                : "Failed to generate feedbacks",
                            showFormData: false,
                          });
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                          Generating All Reviews...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Generate All 100 Reviews & Continue
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={async () => {
                        setPreviewLoading(true);
                        try {
                          const previewResponse = await fetch(
                            "/api/feedbacks/preview",
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                businessName: businessData.businessName,
                                businessType: businessData.businessType,
                                googleMapsAboutUrl:
                                  businessData.googleMapsAboutUrl || undefined,
                                products: businessData.products
                                  .filter((p) => p.trim() !== "")
                                  .map((name) => ({ name })),
                                employees: businessData.employees
                                  .filter((e) => e.trim() !== "")
                                  .map((name) => ({ name })),
                              }),
                            },
                          );
                          const data = await previewResponse.json();
                          if (data.success) {
                            setPreviewFeedbacks(data.preview);
                          }
                        } catch (error) {
                          console.error("Error regenerating preview:", error);
                        } finally {
                          setPreviewLoading(false);
                        }
                      }}
                      disabled={previewLoading}
                    >
                      Regenerate Preview
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setStep(2)}
                      disabled={loading || previewLoading}
                    >
                      Back
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No preview available</p>
                  <Button onClick={() => setStep(2)}>Go Back</Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Share Your Review Link */}
        {step === 3 && businessId && (
          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">
                Your Review Link is Ready!
              </CardTitle>
              <CardDescription>
                Send this branded link to customers right after their purchase
                or service. They can leave reviews in seconds—no forms, no
                account creation needed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Review Link Section */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                <h3 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  Your Review Link
                </h3>
                <div className="bg-white rounded-lg p-4 border border-indigo-200 mb-4">
                  <p className="text-sm font-mono text-gray-800 break-all">
                    {reviewLink}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(reviewLink);
                        setLinkCopied(true);
                        setTimeout(() => setLinkCopied(false), 2000);
                      } catch (error) {
                        console.error("Failed to copy:", error);
                      }
                    }}
                  >
                    {linkCopied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      // Open the review page directly in a new tab
                      window.open(reviewLink, "_blank");
                    }}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Open Review Page
                  </Button>
                </div>
              </div>

              {/* QR Code Section */}
              {qrCodeUrl && (
                <div className="bg-white p-8 rounded-lg border-2 border-dashed border-indigo-300 text-center">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    QR Code for Your Customers
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    When scanned, customers will see review templates they can
                    copy and share on Google
                  </p>
                  <div className="flex flex-col items-center justify-center">
                    <div
                      ref={qrCodeRef}
                      className="bg-white p-4 rounded-lg inline-block mb-4"
                    >
                      <QRCodeSVG
                        value={reviewLink}
                        size={256}
                        level="H"
                        includeMargin={true}
                        fgColor="#4f46e5"
                        bgColor="#ffffff"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Points to: {reviewLink}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Button className="w-full" size="lg" asChild>
                  <Link href={`/review/${businessId}`}>
                    Preview Customer Experience
                  </Link>
                </Button>
                {qrCodeUrl && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleDownloadQR}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download QR Code
                  </Button>
                )}
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">
                  Next Steps:
                </h4>
                <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
                  <li>
                    Copy your review link and send it to customers right after
                    their purchase or service
                  </li>
                  <li>Share via email, SMS, or include in receipts</li>
                  <li>
                    Display the QR code at your location for in-person customers
                  </li>
                  <li>
                    Watch reviews come in effortlessly—no more chasing
                    customers!
                  </li>
                </ol>
              </div>

              {/* Display All Generated Feedbacks */}
              {generatedFeedbacks.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Generated Review Templates ({feedbackCount} total)
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Copy any review below and share it on Google Reviews
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-[500px] overflow-y-auto">
                    <div className="space-y-4">
                      {generatedFeedbacks.map((feedback, index) => (
                        <div
                          key={feedback.id || index}
                          className={`bg-white p-4 rounded-lg border-2 transition-all ${
                            copiedFeedbackId === feedback.id
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 hover:border-indigo-300"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <span
                              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                                feedback.sentiment === "positive"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {feedback.sentiment === "positive"
                                ? "5-Star Review"
                                : "4-Star Review"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed mb-4">
                            {feedback.content}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={
                                copiedFeedbackId === feedback.id
                                  ? "default"
                                  : "outline"
                              }
                              className={`flex-1 ${
                                copiedFeedbackId === feedback.id
                                  ? "bg-green-600 hover:bg-green-700 text-white"
                                  : ""
                              }`}
                              onClick={() =>
                                handleCopyFeedback(
                                  feedback.id,
                                  feedback.content,
                                )
                              }
                            >
                              {copiedFeedbackId === feedback.id ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Copy
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                              onClick={handleShareToGoogle}
                            >
                              <Share2 className="w-4 h-4 mr-2" />
                              Share on Google
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    These personalized reviews mention your products and staff
                    members (like{" "}
                    {businessData.employees
                      .filter((e) => e.trim() !== "")
                      .slice(0, 2)
                      .join(", ") || "your staff"}
                    ) to make them feel authentic and humanized.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Reassign Business Modal (Admin Only) */}
        {showReassignModal && error?.isAdmin && error?.existingBusiness && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Reassign Business</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowReassignModal(false);
                      setNewOwnerEmail("");
                    }}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <CardDescription>
                  Reassign "{error.existingBusiness.businessName}" to another
                  user
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select New Owner
                  </label>
                  <select
                    value={newOwnerEmail}
                    onChange={(e) => setNewOwnerEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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

                {error.ownerDetails && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Current Owner:</strong>{" "}
                      {error.ownerDetails.name || error.ownerDetails.email}
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

        {/* Reassign Business Modal (Admin Only) */}
        {showReassignModal && error?.isAdmin && error?.existingBusiness && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Reassign Business</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowReassignModal(false);
                      setNewOwnerEmail("");
                    }}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <CardDescription>
                  Reassign "{error.existingBusiness.businessName}" to another
                  user
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select New Owner
                  </label>
                  <select
                    value={newOwnerEmail}
                    onChange={(e) => setNewOwnerEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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

                {error.ownerDetails && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Current Owner:</strong>{" "}
                      {error.ownerDetails.name || error.ownerDetails.email}
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
    </div>
  );
}
