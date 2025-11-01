// app/api/test-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { supabaseServer } from "@/lib/supabaseServer";

/**
 * GET /api/test-email?template=limit-warning
 * Test endpoint to send yourself an email
 */
export async function GET(req: NextRequest) {
  const supabase = await supabaseServer();

  // Auth check - must be logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const template = searchParams.get("template") || "limit-warning";

  if (!["limit-warning", "limit-reached", "limit-recovery"].includes(template)) {
    return NextResponse.json(
      { error: "Invalid template. Use: limit-warning, limit-reached, or limit-recovery" },
      { status: 400 }
    );
  }

  try {
    // Send test email to the logged-in user
    await sendEmail(
      user.email!,
      template as any,
      {
        conversationsUsed: 8,
        conversationsLeft: 2,
        userName: user.email?.split("@")[0] || "there",
      }
    );

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${user.email}`,
      template,
    });
  } catch (err: any) {
    console.error("Test email error:", err);
    return NextResponse.json(
      {
        error: err.message || "Failed to send test email",
        hint: "Make sure RESEND_API_KEY is set in .env.local",
      },
      { status: 500 }
    );
  }
}
