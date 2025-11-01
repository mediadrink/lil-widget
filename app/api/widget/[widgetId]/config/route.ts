// app/api/widget/[widgetId]/config/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { resolveWidgetStyle, type WidgetCustomization } from "@/lib/widgetStyles";

/**
 * GET /api/widget/:widgetId/config
 * Public endpoint (no auth required) - returns widget configuration for embedding
 * Response: { position, customization }
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ widgetId: string }> }
) {
  const supabase = await supabaseServer();
  const { widgetId } = await context.params;

  if (!widgetId) {
    return NextResponse.json(
      { error: "Missing widget ID" },
      { status: 400 }
    );
  }

  try {
    // Fetch widget configuration (no auth check - public data)
    const { data: widget, error } = await supabase
      .from("widgets")
      .select("id, style, position, customization, logo_url, auto_open_delay, owner_id")
      .eq("id", widgetId)
      .single();

    if (error) throw error;

    if (!widget) {
      return NextResponse.json(
        { error: "Widget not found" },
        { status: 404 }
      );
    }

    // Get owner's subscription tier
    let subscriptionTier = "free";
    try {
      const { data: { user: owner } } = await supabase.auth.admin.getUserById(widget.owner_id);
      subscriptionTier = owner?.user_metadata?.subscription_tier || "free";
    } catch (err) {
      // Default to free if we can't get tier
      console.error("Failed to get subscription tier:", err);
    }

    // Resolve the final customization based on style and custom overrides
    const customization = resolveWidgetStyle(
      widget.style,
      widget.customization as WidgetCustomization | null
    );

    return NextResponse.json({
      position: widget.position || "bottom-right",
      customization,
      logoUrl: widget.logo_url || null,
      autoOpenDelay: widget.auto_open_delay || 0,
      subscriptionTier,
    });
  } catch (err: any) {
    console.error("Widget config error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch widget config" },
      { status: 500 }
    );
  }
}
