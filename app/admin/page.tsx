"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Copy,
  ExternalLink,
  QrCode,
  CheckCircle2,
  Store,
  RefreshCw,
  Download,
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
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

interface Business {
  id: string;
  businessName: string;
  businessType: string;
  googleMapsUrl: string;
  products: string[];
  employees: string[];
  feedbackCount: number;
  createdAt: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Redirect superadmins to the new admin dashboard
  useEffect(() => {
    if (!authLoading && user && user.role === "superadmin") {
      router.push("/admin/dashboard");
    }
  }, [user, authLoading, router]);
  const [editForm, setEditForm] = useState<{
    businessName: string;
    businessType: string;
    googleMapsUrl: string;
    products: string[];
    employees: string[];
  }>({
    businessName: "",
    businessType: "",
    googleMapsUrl: "",
    products: [""],
    employees: [""],
  });
  const [saving, setSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [showQR, setShowQR] = useState<string | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const response = await fetch("/api/businesses");
      const data = await response.json();
      if (data.success) {
        setBusinesses(data.businesses);
      }
    } catch (error) {
      console.error("Error fetching businesses:", error);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (business: Business) => {
    setEditingId(business.id);
    setEditForm({
      businessName: business.businessName,
      businessType: business.businessType,
      googleMapsUrl: business.googleMapsUrl,
      products: business.products.length > 0 ? business.products : [""],
      employees: business.employees.length > 0 ? business.employees : [""],
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({
      businessName: "",
      businessType: "",
      googleMapsUrl: "",
      products: [""],
      employees: [""],
    });
  };

  const saveChanges = async (businessId: string) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/businesses/${businessId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: editForm.businessName,
          businessType: editForm.businessType,
          googleMapsUrl: editForm.googleMapsUrl,
          products: editForm.products.filter((p) => p.trim() !== ""),
          employees: editForm.employees.filter((e) => e.trim() !== ""),
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Refresh businesses list
        await fetchBusinesses();
        cancelEditing();
      } else {
        alert(data.error || "Failed to update business");
      }
    } catch (error) {
      console.error("Error updating business:", error);
      alert("Failed to update business");
    } finally {
      setSaving(false);
    }
  };

  const deleteBusiness = async (businessId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this business? This will also delete all reviews and analytics.",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/businesses/${businessId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        await fetchBusinesses();
      } else {
        alert(data.error || "Failed to delete business");
      }
    } catch (error) {
      console.error("Error deleting business:", error);
      alert("Failed to delete business");
    }
  };

  const copyReviewLink = async (businessId: string) => {
    const link = `${window.location.origin}/review/${businessId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(businessId);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const getReviewLink = (businessId: string) => {
    return typeof window !== "undefined"
      ? `${window.location.origin}/review/${businessId}`
      : `/review/${businessId}`;
  };

  const downloadQR = (businessId: string, businessName: string) => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

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
            link.download = `${businessName.replace(/[^a-z0-9]/gi, "_")}-qr-code.png`;
            link.href = URL.createObjectURL(blob);
            link.click();
            URL.revokeObjectURL(link.href);
          }
          URL.revokeObjectURL(url);
        });
      }
    };
    img.src = url;
  };

  const addProduct = () => {
    setEditForm((prev) => ({
      ...prev,
      products: [...prev.products, ""],
    }));
  };

  const updateProduct = (index: number, value: string) => {
    const newProducts = [...editForm.products];
    newProducts[index] = value;
    setEditForm((prev) => ({ ...prev, products: newProducts }));
  };

  const removeProduct = (index: number) => {
    if (editForm.products.length > 1) {
      const newProducts = editForm.products.filter((_, i) => i !== index);
      setEditForm((prev) => ({ ...prev, products: newProducts }));
    }
  };

  const addEmployee = () => {
    setEditForm((prev) => ({
      ...prev,
      employees: [...prev.employees, ""],
    }));
  };

  const updateEmployee = (index: number, value: string) => {
    const newEmployees = [...editForm.employees];
    newEmployees[index] = value;
    setEditForm((prev) => ({ ...prev, employees: newEmployees }));
  };

  const removeEmployee = (index: number) => {
    if (editForm.employees.length > 1) {
      const newEmployees = editForm.employees.filter((_, i) => i !== index);
      setEditForm((prev) => ({ ...prev, employees: newEmployees }));
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
                <Link href="/dashboard">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Business
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Business Management
              </h1>
              <p className="text-gray-600">
                Manage your businesses, review links, and settings
              </p>
            </div>
            {user && user.role === "superadmin" && (
              <Button asChild>
                <Link href="/admin/dashboard">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Admin Dashboard
                </Link>
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
          </div>
        ) : businesses.length === 0 ? (
          <Card className="border-none shadow-xl">
            <CardContent className="py-12 text-center">
              <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No Businesses Yet
              </h3>
              <p className="text-gray-500 mb-6">
                Create your first business to start collecting reviews
              </p>
              <Button asChild>
                <Link href="/dashboard">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Business
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {businesses.map((business) => (
              <Card
                key={business.id}
                className="border-none shadow-xl overflow-hidden"
              >
                {editingId === business.id ? (
                  // Edit Mode
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Edit2 className="w-5 h-5 text-indigo-600" />
                      Edit Business Details
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Business Name *
                        </label>
                        <Input
                          value={editForm.businessName}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              businessName: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Business Type *
                        </label>
                        <Input
                          value={editForm.businessType}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              businessType: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Google Maps Review URL *
                        </label>
                        <Input
                          value={editForm.googleMapsUrl}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              googleMapsUrl: e.target.value,
                            }))
                          }
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          This is where customers will be redirected to leave
                          their review
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Products/Services
                        </label>
                        {editForm.products.map((product, index) => (
                          <div key={index} className="flex gap-2 mb-2">
                            <Input
                              value={product}
                              onChange={(e) =>
                                updateProduct(index, e.target.value)
                              }
                              placeholder="Product name"
                            />
                            {editForm.products.length > 1 && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => removeProduct(index)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addProduct}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Product
                        </Button>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Employees
                        </label>
                        {editForm.employees.map((employee, index) => (
                          <div key={index} className="flex gap-2 mb-2">
                            <Input
                              value={employee}
                              onChange={(e) =>
                                updateEmployee(index, e.target.value)
                              }
                              placeholder="Employee name"
                            />
                            {editForm.employees.length > 1 && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => removeEmployee(index)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addEmployee}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Employee
                        </Button>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button
                          onClick={() => saveChanges(business.id)}
                          disabled={
                            saving ||
                            !editForm.businessName ||
                            !editForm.businessType ||
                            !editForm.googleMapsUrl
                          }
                        >
                          {saving ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                        <Button variant="outline" onClick={cancelEditing}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                ) : (
                  // View Mode
                  <>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl">
                            {business.businessName}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {business.businessType} • {business.feedbackCount}{" "}
                            reviews generated
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEditing(business)}
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteBusiness(business.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Review Link */}
                      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                        <h4 className="font-medium text-indigo-900 mb-2">
                          Customer Review Link
                        </h4>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-white px-3 py-2 rounded border border-indigo-200 text-sm break-all">
                            {getReviewLink(business.id)}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyReviewLink(business.id)}
                          >
                            {copiedLink === business.id ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(getReviewLink(business.id), "_blank")
                            }
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setShowQR(
                                showQR === business.id ? null : business.id,
                              )
                            }
                          >
                            <QrCode className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* QR Code (toggleable) */}
                      {showQR === business.id && (
                        <div className="bg-white border-2 border-dashed border-indigo-300 rounded-lg p-6 text-center">
                          <div ref={qrRef} className="inline-block mb-4">
                            <QRCodeSVG
                              value={getReviewLink(business.id)}
                              size={200}
                              level="H"
                              includeMargin={true}
                              fgColor="#4f46e5"
                              bgColor="#ffffff"
                            />
                          </div>
                          <p className="text-sm text-gray-500 mb-3">
                            Scan to open review page
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              downloadQR(business.id, business.businessName)
                            }
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download QR Code
                          </Button>
                        </div>
                      )}

                      {/* Google Maps URL */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-700 mb-2">
                          Google Maps Review URL
                        </h4>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-white px-3 py-2 rounded border text-sm text-gray-600 break-all truncate">
                            {business.googleMapsUrl}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(business.googleMapsUrl, "_blank")
                            }
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Products & Employees */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">
                            Products/Services
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {business.products.length > 0 ? (
                              business.products.map((product, i) => (
                                <span
                                  key={i}
                                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                                >
                                  {product}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-400 text-sm">
                                No products added
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">
                            Employees
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {business.employees.length > 0 ? (
                              business.employees.map((employee, i) => (
                                <span
                                  key={i}
                                  className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                                >
                                  {employee}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-400 text-sm">
                                No employees added
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
