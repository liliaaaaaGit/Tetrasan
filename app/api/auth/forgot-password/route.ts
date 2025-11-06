import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Password Reset Request API
 * POST /api/auth/forgot-password
 * Body: { identifier: string } (email or personal number)
 * 
 * For admins (email): Sends Supabase password reset email
 * For employees (personal number): Creates entry in password_reset_requests table
 */
export async function POST(request: NextRequest) {
  try {
    const { identifier } = await request.json();

    if (!identifier || typeof identifier !== "string") {
      // Return success to prevent user enumeration
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const trimmedIdentifier = identifier.trim();
    const isEmail = trimmedIdentifier.includes("@");

    if (isEmail) {
      // Admin reset via Supabase email
      return await handleAdminReset(trimmedIdentifier);
    } else {
      // Employee reset via personal number
      return await handleEmployeeReset(trimmedIdentifier);
    }
  } catch (error) {
    console.error("[ForgotPassword] Error:", error);
    // Return success to prevent user enumeration
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

/**
 * Handle admin password reset via Supabase email
 */
async function handleAdminReset(email: string) {
  try {
    // Get base URL for redirect
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                    "http://localhost:3000");
    
    const redirectTo = `${baseUrl}/auth/reset-password`;

    // Check if user exists by querying profiles (using admin client to bypass RLS)
    const admin = getAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("id, role")
      .eq("email", email.toLowerCase())
      .eq("active", true)
      .maybeSingle();

    // Only send reset email for admin accounts
    if (!profile || profile.role !== "admin") {
      // Return success even if user doesn't exist or is not admin (prevent enumeration)
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Use admin client to send reset email (bypasses RLS)
    // Note: resetPasswordForEmail works with regular client too, but admin client ensures we can check profiles
    const { error } = await admin.auth.resetPasswordForEmail(email.toLowerCase(), {
      redirectTo,
    });

    if (error) {
      console.error("[ForgotPassword] Supabase reset error:", error);
      // Still return success to prevent user enumeration
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[ForgotPassword] Admin reset error:", error);
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

/**
 * Handle employee password reset via personal number
 */
async function handleEmployeeReset(personalNumber: string) {
  try {
    // Validate personal number format (5 digits)
    if (!/^\d{5}$/.test(personalNumber)) {
      // Return success to prevent user enumeration
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const admin = getAdminClient();

    // Find user by personal number
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, personal_number")
      .eq("personal_number", personalNumber)
      .eq("role", "employee")
      .eq("active", true)
      .maybeSingle();

    if (profileError || !profile) {
      // Return success even if profile doesn't exist (prevent enumeration)
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Check if password_reset_requests table exists, if not create entry
    // For now, we'll try to insert and handle errors gracefully
    const { error: insertError } = await admin
      .from("password_reset_requests")
      .insert({
        user_id: profile.id,
        personal_number: personalNumber,
        status: "open",
      });

    if (insertError) {
      // If table doesn't exist, log but still return success
      console.error("[ForgotPassword] Error inserting reset request:", insertError);
      // Table might not exist yet - that's okay, we'll create it via migration
    }

    // Optional: Send email to office (if OFFICE_EMAIL is configured)
    const officeEmail = process.env.OFFICE_EMAIL;
    if (officeEmail) {
      try {
        // You could use a service like Resend, SendGrid, or Supabase Edge Functions here
        // For now, we'll just log it
        console.log(`[ForgotPassword] Password reset requested for personal number ${personalNumber}. Office email: ${officeEmail}`);
      } catch (emailError) {
        console.error("[ForgotPassword] Error sending office email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[ForgotPassword] Employee reset error:", error);
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

