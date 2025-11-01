import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

type Ctx = { params: Promise<{ widgetId: string }> };

export async function GET(
  req: NextRequest,
  context: Ctx
) {
  const supabase = await supabaseServer();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const { widgetId } = params;

    // Verify widget ownership
    const { data: widget } = await supabase
      .from("widgets")
      .select("id, owner_id")
      .eq("id", widgetId)
      .single();

    if (!widget || widget.owner_id !== user.id) {
      return NextResponse.json({ error: "Widget not found" }, { status: 404 });
    }

    // Fetch knowledge base
    const { data: kb, error } = await supabase
      .from("widget_knowledge_base")
      .select("data, last_crawled_at")
      .eq("widget_id", widgetId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found" error - that's okay
      throw error;
    }

    return NextResponse.json({
      data: kb?.data || null,
      last_crawled_at: kb?.last_crawled_at || null,
    });
  } catch (err: any) {
    console.error("Knowledge base fetch error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch knowledge base" },
      { status: 500 }
    );
  }
}
