import { NextRequest, NextResponse } from "next/server";
import { signIn, generateToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 },
      );
    }

    // Normalize email to lowercase (case-insensitive login)
    email = email.trim().toLowerCase();

    const user = await signIn(email, password);
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
    console.error("Login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Login failed",
      },
      { status: 400 },
    );
  }
}
