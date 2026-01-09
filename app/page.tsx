"use client";

import Link from "next/link";
import {
  Sparkles,
  QrCode,
  TrendingUp,
  Zap,
  Star,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navigation, AuthButtons } from "@/components/Navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="border-b border-white/20 bg-white/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-indigo-600" />
              <span className="text-2xl font-bold gradient-text">
                ReviewBoost
              </span>
            </div>
            <Navigation />
            <AuthButtons />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-indigo-200 mb-8">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-600">
              Review Collection, Simplified
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Collect Customer Reviews
            <br />
            <span className="gradient-text">Effortlessly</span>
          </h1>

          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Stop chasing customers for feedback. Send them a simple, branded
            link right after their purchase or service. Customers leave reviews
            in seconds—no complex forms, no account creation. Use that social
            proof to build trust and grow your business.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button
              size="lg"
              asChild
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-8"
            >
              <Link href="/signup">Start Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                label: "Review Response Rate",
                value: "85%",
                icon: TrendingUp,
              },
              { label: "Review Time", value: "< 30 sec", icon: Zap },
              { label: "Setup Time", value: "5 min", icon: Star },
            ].map((stat, index) => (
              <Card
                key={index}
                className="border-none shadow-lg bg-white/80 backdrop-blur-sm"
              >
                <CardContent className="pt-6 text-center">
                  <stat.icon className="w-8 h-8 mx-auto mb-3 text-indigo-600" />
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Businesses Love Us
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to collect reviews effortlessly and build
              trust with your customers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "One-Click Reviews",
                description:
                  "No complex forms or account creation. Customers leave reviews in seconds with just one click.",
              },
              {
                icon: TrendingUp,
                title: "Higher Conversion",
                description:
                  "Capture feedback while the experience is fresh. Get 85%+ response rates vs traditional methods.",
              },
              {
                icon: Sparkles,
                title: "Branded Experience",
                description:
                  "Customize your review page to match your brand. Send customers a simple, branded link they'll trust.",
              },
              {
                icon: CheckCircle2,
                title: "AI-Powered Templates",
                description:
                  "100+ personalized review templates mentioning your products and staff for authentic reviews.",
              },
              {
                icon: Star,
                title: "Actionable Insights",
                description:
                  "Collect and manage all feedback in one place. Track response rates and review performance.",
              },
              {
                icon: QrCode,
                title: "Multiple Channels",
                description:
                  "Share via email, SMS, QR codes, or embed on your website. Reach customers wherever they are.",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="border-none shadow-lg hover:shadow-xl transition-all hover:scale-105 bg-white"
              >
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Three simple steps to start collecting reviews effortlessly
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Set Up Your Business",
                description:
                  "Enter your business details, products, and staff. Our AI generates 100+ personalized review templates in minutes.",
              },
              {
                step: "02",
                title: "Send Your Branded Link",
                description:
                  "Get your unique review link and send it to customers right after their purchase or service. Share via email, SMS, or QR code.",
              },
              {
                step: "03",
                title: "Collect Reviews Effortlessly",
                description:
                  "Customers click your link, select a review template, and submit in seconds. No forms, no hassle—just authentic reviews.",
              },
            ].map((step, index) => (
              <div key={index} className="relative">
                <div className="text-6xl font-bold text-indigo-100 mb-4">
                  {step.step}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Collect Reviews Effortlessly?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join businesses that are making review collection simple. No more
            chasing customers—just send a link and watch the reviews come in.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/dashboard">Get Started Free</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/50 border-t border-gray-200 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center text-gray-600">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            <span className="text-xl font-bold gradient-text">ReviewBoost</span>
          </div>
          <p className="text-sm">© 2024 ReviewBoost. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
