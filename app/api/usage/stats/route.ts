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

    // Get conversations this month (exclude test conversations)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const { count: conversationsThisMonth } = await supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .in("widget_id", widgetIds)
      .gte("created_at", startOfMonth.toISOString())
      .eq("is_test", false);

    // Total widgets
    const totalWidgets = widgetIds.length;

    return NextResponse.json({
      conversationsThisMonth: conversationsThisMonth || 0,
      totalWidgets,
    });
  } catch (err: any) {
    console.error("Usage stats error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to get usage stats" },
      { status: 500 }
    );
  }
}
