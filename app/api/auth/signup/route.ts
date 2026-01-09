import { NextRequest, NextResponse } from "next/server";
import { signUp, generateToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 },
      );
    }

    // Normalize email to lowercase (case-insensitive)
    email = email.trim().toLowerCase();

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    const user = await signUp(email, password, name);
    const token = generateToken(user);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Signup failed",
      },
      { status: 400 },
    );
  }
}
