"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Sparkles, LayoutDashboard, LogIn, UserPlus } from "lucide-react";

export function Navigation() {
  const { user } = useAuth();
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <nav className="hidden md:flex items-center gap-6">
      <Link
        href="#features"
        className="text-gray-600 hover:text-indigo-600 transition-colors"
      >
        Features
      </Link>
      <Link
        href="#how-it-works"
        className="text-gray-600 hover:text-indigo-600 transition-colors"
      >
        How It Works
      </Link>
      <Link
        href="/pricing"
        className="text-gray-600 hover:text-indigo-600 transition-colors"
      >
        Pricing
      </Link>
      {user && (
        <Link
          href={
            user.role === "superadmin" ? "/admin/dashboard" : "/my-businesses"
          }
          className="text-gray-600 hover:text-indigo-600 transition-colors flex items-center gap-1"
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </Link>
      )}
    </nav>
  );
}

export function AuthButtons() {
  const { user } = useAuth();

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <Button variant="ghost" asChild>
          <Link
            href={
              user.role === "superadmin" ? "/admin/dashboard" : "/my-businesses"
            }
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Button variant="ghost" asChild>
        <Link href="/login">
          <LogIn className="w-4 h-4 mr-2" />
          Sign In
        </Link>
      </Button>
      <Button
        asChild
        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
      >
        <Link href="/signup">
          <UserPlus className="w-4 h-4 mr-2" />
          Start Free Trial
        </Link>
      </Button>
    </div>
  );
}
