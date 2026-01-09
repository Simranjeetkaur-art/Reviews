"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Plan data (matching lib/auth.ts)
const PLAN_DATA = {
  pro: {
    name: "Pro",
    priceDisplay: "₹9,999",
    fullPriceDisplay: "₹9,999 / 6 months",
    features: [
      "Unlimited Businesses",
      "Unlimited AI-generated review generations per business",
      "Custom QR codes",
      "Priority support",
      "Full analytics dashboard",
    ],
  },
  lifetime: {
    name: "Lifetime",
    priceDisplay: "₹39,999",
    fullPriceDisplay: "₹39,999 – One-time payment",
    features: [
      "Unlimited Businesses",
      "Unlimited AI-generated reviews",
      "One business, one QR code — valid for the entire lifetime of your business",
      "Customized brand page (Logo & Background)",
      "White-label custom QR codes",
      "Advanced analytics",
      "Full white-label option",
      "Dedicated priority support",
      "No subscription. No renewals. Ever.",
    ],
  },
};
import { Sparkles, Loader2, Check } from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    const plan = searchParams.get("plan");
    if (plan && ["pro", "lifetime"].includes(plan)) {
      setSelectedPlan(plan);
    } else {
      router.push("/pricing");
    }
  }, [searchParams, router]);

  const handlePayment = async () => {
    if (!selectedPlan || !user) return;

    setLoading(true);
    try {
      // TODO: Integrate with payment gateway (Razorpay, Stripe, etc.)
      // For now, create a mock payment flow

      const response = await fetch("/api/payments/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh user data
        if (refreshUser) await refreshUser();
        // Redirect to success page
        router.push(`/checkout/success?plan=${selectedPlan}`);
      } else {
        alert(data.error || "Payment failed. Please try again.");
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("An error occurred during payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  const plan = PLAN_DATA[selectedPlan as keyof typeof PLAN_DATA];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-indigo-400" />
            <span className="text-2xl font-bold text-white">ReviewBoost</span>
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-16">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-2xl">
              Complete Your Purchase
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Plan Summary */}
            <div className="bg-slate-900/50 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">
                {plan.name} Plan
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">
                  {plan.fullPriceDisplay || plan.priceDisplay}
                </span>
                {selectedPlan === "lifetime" && (
                  <span className="text-sm text-slate-400">(One-time)</span>
                )}
              </div>
              {selectedPlan === "pro" && (
                <p className="text-xs text-slate-400 mt-1">
                  Subscription renews every 6 months
                </p>
              )}
            </div>

            {/* Features */}
            <div>
              <h4 className="text-white font-medium mb-3">What you get:</h4>
              <ul className="space-y-2">
                {plan.features.slice(0, 5).map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Payment Button */}
            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              size="lg"
              onClick={handlePayment}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ${plan.priceDisplay} ${selectedPlan === "lifetime" ? "Once" : "Now"}`
              )}
            </Button>

            <Link
              href="/pricing"
              className="block text-center text-sm text-slate-400 hover:text-slate-300"
            >
              ← Back to Pricing
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
