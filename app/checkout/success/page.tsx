"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const plan = searchParams.get("plan");

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
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <CardTitle className="text-white text-2xl">
              Payment Successful!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <p className="text-slate-300">
              Your {plan === "lifetime" ? "Lifetime" : "Pro"} subscription has
              been activated.
            </p>

            {plan === "lifetime" && (
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-sm text-yellow-400">
                  ✓ You now have lifetime access to ReviewBoost. No renewals
                  required!
                </p>
              </div>
            )}

            {plan === "pro" && (
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                <p className="text-sm text-purple-400">
                  ✓ Your Pro subscription is active for 6 months. You'll be
                  notified before renewal.
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
                <Link href="/my-businesses">
                  Go to My Businesses
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/pricing">View Plans</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
