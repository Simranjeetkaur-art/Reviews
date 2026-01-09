"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface BusinessUsage {
  id: string;
  name: string;
  generationCount: number;
  limit: number;
  percentageUsed: number;
  status: "available" | "warning" | "limit_reached";
}

interface UsageWarningProps {
  subscriptionTier: string;
  businesses: BusinessUsage[];
  summary?: {
    totalGenerationsUsed: number;
    businessesAtLimit: number;
    businessesWithWarnings: number;
  };
}

export function UsageWarning({
  subscriptionTier,
  businesses,
  summary,
}: UsageWarningProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Don't show for pro/lifetime users
  if (subscriptionTier !== "free") {
    return null;
  }

  // Don't show if no businesses
  if (!businesses || businesses.length === 0) {
    return null;
  }

  // Filter businesses that need attention (warning or limit reached)
  const businessesNeedingAttention = businesses.filter(
    (b) => b.status === "warning" || b.status === "limit_reached",
  );

  // If no businesses need attention, don't show warning
  if (businessesNeedingAttention.length === 0) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "limit_reached":
        return "text-red-400 bg-red-500/10 border-red-500/30";
      case "warning":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
      default:
        return "text-green-400 bg-green-500/10 border-green-500/30";
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case "limit_reached":
        return "bg-red-500";
      case "warning":
        return "bg-yellow-500";
      default:
        return "bg-green-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "limit_reached":
        return <XCircle className="w-5 h-5" />;
      case "warning":
        return <AlertCircle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <Card className="bg-slate-900/50 border-slate-700 mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <CardTitle className="text-white">Usage Limit Warning</CardTitle>
          </div>
          {businessesNeedingAttention.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-400 hover:text-slate-300"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
        <CardDescription className="text-slate-400">
          {summary?.businessesAtLimit || 0 > 0
            ? `${summary.businessesAtLimit} business${summary.businessesAtLimit > 1 ? "es" : ""} reached the limit`
            : `${summary?.businessesWithWarnings || 0} business${(summary?.businessesWithWarnings || 0) > 1 ? "es" : ""} approaching limit`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isExpanded && (
          <>
            {businessesNeedingAttention.map((business) => (
              <div
                key={business.id}
                className={`p-4 rounded-lg border ${getStatusColor(business.status)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(business.status)}
                    <h4 className="font-semibold text-white">
                      {business.name}
                    </h4>
                  </div>
                  <span className="text-sm font-medium">
                    {business.generationCount}/{business.limit}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-700 rounded-full h-2 mb-3">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(
                      business.status,
                    )}`}
                    style={{
                      width: `${Math.min(100, business.percentageUsed)}%`,
                    }}
                    role="progressbar"
                    aria-valuenow={business.generationCount}
                    aria-valuemin={0}
                    aria-valuemax={business.limit}
                    aria-label={`${business.name}: ${business.generationCount} of ${business.limit} generations used`}
                  />
                </div>

                {/* Status Message */}
                {business.status === "limit_reached" && (
                  <p className="text-sm text-red-300">
                    {business.name} has reached the 5-generation limit. Upgrade
                    to Pro to continue generating reviews.
                  </p>
                )}
                {business.status === "warning" && (
                  <p className="text-sm text-yellow-300">
                    You're approaching your limit for {business.name}.{" "}
                    {business.generationCount} of {business.limit} generations
                    used.
                  </p>
                )}
              </div>
            ))}

            {/* Upgrade CTA */}
            <div className="pt-2 border-t border-slate-700">
              <Button
                asChild
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
              >
                <Link href="/pricing">
                  Upgrade to Pro (₹9,999 / 6 months)
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
