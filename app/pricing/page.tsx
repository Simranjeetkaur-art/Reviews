"use client";

import { useState } from "react";
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
import { useAuth } from "@/context/AuthContext";
import {
  Sparkles,
  Check,
  Zap,
  Crown,
  ArrowRight,
  Star,
  Infinity,
} from "lucide-react";

const plans = [
  {
    name: "Free",
    tier: "free",
    price: 0,
    priceDisplay: "Free",
    description: "Perfect for trying out ReviewBoost",
    subDescription:
      "Best for individuals or small businesses who want to explore how ReviewBoost works before upgrading.",
    icon: Sparkles,
    features: [
      {
        text: "5 AI-generated review generations for your business",
        included: true,
      },
      { text: "1 Basic QR code", included: true },
      { text: "Email support", included: true },
      { text: "Analytics dashboard", included: true },
      { text: "Custom branding", included: true },
      {
        text: "Upgrade to Pro after limit (₹9,999 / 6 months)",
        included: true,
      },
    ],
    cta: "Get Started Free",
    popular: false,
    recommended: false,
    badge: null,
    whyChoose:
      "Start risk-free and see how ReviewBoost helps you collect authentic customer reviews in minutes.",
  },
  {
    name: "Pro",
    tier: "pro",
    price: 9999,
    priceDisplay: "₹9,999",
    pricePeriod: "6 months",
    fullPriceDisplay: "₹9,999 / 6 months",
    description: "Built for growing businesses",
    subDescription:
      "Ideal for businesses that want consistent review generation with advanced insights and flexibility.",
    icon: Zap,
    features: [
      { text: "Unlimited businesses", included: true },
      {
        text: "Unlimited AI-generated review generations per business",
        included: true,
      },
      { text: "Custom QR codes", included: true },
      { text: "Priority support", included: true },
      { text: "Full analytics dashboard", included: true },
    ],
    cta: "Upgrade to Pro",
    popular: true,
    recommended: false,
    badge: "Most Common",
    whyChoose:
      "Pro is the most common choice for growing businesses that want ongoing review collection, deeper analytics, and premium support—without committing to a lifetime plan.",
    pricingNote: "(Subscription model + one-time setup)",
  },
  {
    name: "Lifetime",
    tier: "lifetime",
    price: 39999,
    priceDisplay: "₹39,999",
    fullPriceDisplay: "₹39,999 – One-time payment",
    description: "One-time payment. Reviews for life. No subscriptions.",
    subDescription:
      "Designed for serious business owners who want maximum value with zero recurring costs.",
    icon: Crown,
    features: [
      { text: "Unlimited businesses", included: true },
      { text: "Unlimited AI-generated reviews", included: true },
      {
        text: "One business, one QR code — valid for the entire lifetime of your business",
        included: true,
      },
      { text: "Customized brand page (Logo & Background)", included: true },
      { text: "White-label custom QR codes", included: true },
      { text: "Advanced analytics", included: true },
      { text: "Full white-label option", included: true },
      { text: "Dedicated priority support", included: true },
      { text: "No subscription. No renewals. Ever.", included: true },
    ],
    cta: "Get Lifetime Access",
    popular: false,
    recommended: true,
    badge: "Recommended",
    whyChoose:
      "Pay once, use forever. No monthly or yearly fees. Best long-term value. Perfect for agencies, franchises, and brand-focused businesses. Lifetime access to reviews using a single QR per business.",
    benefits: [
      "Pay once, use forever",
      "No monthly or yearly fees",
      "Best long-term value",
      "Perfect for agencies, franchises, and brand-focused businesses",
      "Lifetime access to reviews using a single QR per business",
    ],
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const currentTier = user?.subscriptionTier || "free";

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
              {user ? (
                <>
                  <Button variant="outline" asChild>
                    <Link href="/my-businesses">My Businesses</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/profile">Profile</Link>
                  </Button>
                </>
              ) : (
                <Button asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Select the perfect plan for your business needs. Start free or
            upgrade for unlimited reviews.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => {
            const isCurrentPlan = currentTier === plan.tier;
            const Icon = plan.icon;

            return (
              <motion.div
                key={plan.tier}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`relative h-full ${
                    plan.recommended
                      ? "bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 border-yellow-500/50"
                      : plan.popular
                        ? "bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/50"
                        : "bg-slate-800/50 border-slate-700"
                  }`}
                >
                  {/* Badges */}
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          plan.recommended
                            ? "bg-yellow-500 text-yellow-900"
                            : "bg-purple-500 text-purple-900"
                        }`}
                      >
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500 text-green-900">
                        Current Plan
                      </span>
                    </div>
                  )}

                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          plan.recommended
                            ? "bg-yellow-500/20"
                            : plan.popular
                              ? "bg-purple-500/20"
                              : "bg-indigo-500/20"
                        }`}
                      >
                        <Icon
                          className={`w-6 h-6 ${
                            plan.recommended
                              ? "text-yellow-400"
                              : plan.popular
                                ? "text-purple-400"
                                : "text-indigo-400"
                          }`}
                        />
                      </div>
                      <CardTitle className="text-2xl text-white">
                        {plan.name}
                      </CardTitle>
                    </div>
                    <CardDescription className="text-slate-300">
                      {plan.description}
                    </CardDescription>
                    {plan.subDescription && (
                      <p className="text-sm text-slate-400 mt-2">
                        {plan.subDescription}
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Pricing */}
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-white">
                          {plan.priceDisplay}
                        </span>
                        {plan.pricePeriod && (
                          <span className="text-slate-400">
                            / {plan.pricePeriod}
                          </span>
                        )}
                        {plan.tier === "lifetime" && (
                          <Infinity className="w-6 h-6 text-yellow-400" />
                        )}
                      </div>
                      {plan.pricingNote && (
                        <p className="text-xs text-slate-400 mt-1">
                          {plan.pricingNote}
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-slate-300">
                        What you get:
                      </h3>
                      <ul className="space-y-2">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-slate-300">
                              {feature.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Why Choose Section */}
                    {plan.whyChoose && (
                      <div className="bg-slate-900/50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-slate-300 mb-2">
                          Why choose {plan.name}?
                        </h4>
                        <p className="text-xs text-slate-400">
                          {plan.whyChoose}
                        </p>
                        {plan.benefits && (
                          <ul className="mt-3 space-y-1">
                            {plan.benefits.map((benefit, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2 text-xs text-slate-400"
                              >
                                <span className="text-green-400">✔</span>
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {/* CTA Button */}
                    <Button
                      className={`w-full ${
                        plan.recommended
                          ? "bg-yellow-500 hover:bg-yellow-600 text-yellow-900"
                          : plan.popular
                            ? "bg-purple-600 hover:bg-purple-700"
                            : "bg-indigo-600 hover:bg-indigo-700"
                      }`}
                      size="lg"
                      disabled={isCurrentPlan}
                      asChild
                    >
                      {isCurrentPlan ? (
                        <span>Current Plan</span>
                      ) : (
                        <Link href={`/checkout?plan=${plan.tier}`}>
                          {plan.cta}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
