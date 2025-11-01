import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ widgetId: string }> }
) {
  const supabase = await supabaseServer();
  const { widgetId } = await context.params;

  try {
    const body = await req.json();
    const { url, referrer } = body;

    // Verify widget exists (no auth required for ping - it's from public widget)
    const { data: widget, error: widgetError } = await supabase
      .from("widgets")
      .select("id, owner_id")
      .eq("id", widgetId)
      .single();

    if (widgetError || !widget) {
      return NextResponse.json(
        { error: "Widget not found" },
        { status: 404 }
      );
    }

    // Record the installation ping
    // We'll store this in a simple table to track when widgets are installed
    const { error: pingError } = await supabase.from("widget_pings").insert({
      widget_id: widgetId,
      url: url || null,
      referrer: referrer || null,
      user_agent: req.headers.get("user-agent") || null,
    });

    if (pingError) {
      console.error("Failed to record ping:", pingError);
      // Don't fail the request if ping recording fails
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Ping error:", err);
    return NextResponse.json(
      { error: "Failed to process ping" },
      { status: 500 }
    );
  }
}
