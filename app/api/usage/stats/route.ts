// app/api/usage/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

/**
 * GET /api/usage/stats
 * Returns usage statistics for the current user
 */
export async function GET(req: NextRequest) {
  const supabase = await supabaseServer();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get user's widgets
    const { data: widgets } = await supabase
      .from("widgets")
      .select("id")
      .eq("owner_id", user.id);

    const widgetIds = widgets?.map((w) => w.id) || [];

    // Calculate billing period (rolling 30 days from signup)
    const now = new Date();
    const userCreatedAt = user.created_at ? new Date(user.created_at) : now;
    const daysSinceSignup = Math.floor((now.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
    const completeCycles = Math.floor(daysSinceSignup / 30);
    const billingPeriodStart = new Date(userCreatedAt.getTime() + (completeCycles * 30 * 24 * 60 * 60 * 1000));
    const billingPeriodEnd = new Date(billingPeriodStart.getTime() + (30 * 24 * 60 * 60 * 1000));
    const daysRemaining = Math.ceil((billingPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const { count: conversationsThisPeriod } = await supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .in("widget_id", widgetIds)
      .gte("created_at", billingPeriodStart.toISOString())
      .eq("is_test", false);

    // Total widgets
    const totalWidgets = widgetIds.length;

    return NextResponse.json({
      conversationsThisMonth: conversationsThisPeriod || 0, // Keep same key for backward compatibility
      totalWidgets,
      billingPeriodStart: billingPeriodStart.toISOString(),
      billingPeriodEnd: billingPeriodEnd.toISOString(),
      daysRemaining,
    });
  } catch (err: any) {
    console.error("Usage stats error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to get usage stats" },
      { status: 500 }
    );
  }
}
