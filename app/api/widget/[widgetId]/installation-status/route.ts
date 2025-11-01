import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ widgetId: string }> }
) {
  const supabase = await supabaseServer();
  const { widgetId } = await context.params;

  try {
    // Check auth
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify widget ownership
    const { data: widget, error: widgetError } = await supabase
      .from("widgets")
      .select("id, owner_id")
      .eq("id", widgetId)
      .single();

    if (widgetError || !widget || widget.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Widget not found or unauthorized" },
        { status: 404 }
      );
    }

    // Check if widget has received any pings
    const { count, error: pingError } = await supabase
      .from("widget_pings")
      .select("id", { count: "exact", head: true })
      .eq("widget_id", widgetId);

    if (pingError) {
      throw pingError;
    }

    const isInstalled = (count ?? 0) > 0;

    return NextResponse.json({ isInstalled });
  } catch (err: any) {
    console.error("Installation status error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to check installation status" },
      { status: 500 }
    );
  }
}
