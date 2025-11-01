import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
  const supabase = await supabaseServer();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Check if already verified
  if (user.email_confirmed_at) {
    return NextResponse.json(
      { message: "Email already verified" },
      { status: 200 }
    );
  }

  try {
    // Resend confirmation email
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: user.email!,
    });

    if (resendError) {
      console.error("Resend verification error:", resendError);
      return NextResponse.json(
        { error: "Failed to resend verification email" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Verification email sent" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Failed to resend verification email" },
      { status: 500 }
    );
  }
}
