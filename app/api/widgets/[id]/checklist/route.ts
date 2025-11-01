import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await supabaseServer();
  const { id: widgetId } = await context.params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    // Get widget info
    const { data: widget, error: widgetError } = await supabase
      .from("widgets")
      .select("id, owner_id, persona_text, persona_updated_at")
      .eq("id", widgetId)
      .single();

    if (widgetError) throw widgetError;
    if (!widget) {
      return NextResponse.json({ error: "Widget not found" }, { status: 404 });
    }
    if (widget.owner_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get ping count (widget installations)
    const { count: pingCount, error: pingError } = await supabase
      .from("widget_pings")
      .select("id", { count: "exact", head: true })
      .eq("widget_id", widgetId);

    if (pingError) throw pingError;

    // Get conversation count for this widget (exclude test conversations)
    const { count: conversationCount, error: convoError } = await supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("widget_id", widgetId)
      .eq("is_test", false);

    if (convoError) throw convoError;

    // Get rules count for this widget
    const { count: rulesCount, error: rulesError } = await supabase
      .from("widget_rules")
      .select("id", { count: "exact", head: true })
      .eq("widget_id", widgetId);

    if (rulesError) throw rulesError;

    // Check if persona has been manually edited (has persona_updated_at timestamp)
    const personaCustomized = widget.persona_updated_at !== null;

    // Build checklist items
    const items = [
      {
        id: "widget_created",
        label: "Widget created",
        completed: true, // Always true if viewing this widget
        description: "You've created your widget",
      },
      {
        id: "code_installed",
        label: "Embed code installed",
        completed: (pingCount || 0) > 0,
        description: "Add the code to your website",
      },
      {
        id: "first_conversation",
        label: "First conversation received",
        completed: (conversationCount || 0) > 0,
        description: "A visitor has chatted with your widget",
      },
      {
        id: "persona_customized",
        label: "Personality customized",
        completed: personaCustomized,
        description: "Edit your widget's tone and behavior",
      },
      {
        id: "first_rule",
        label: "First rule added",
        completed: (rulesCount || 0) > 0,
        description: "Add a rule to improve responses",
      },
    ];

    return NextResponse.json({ items });
  } catch (err: any) {
    console.error("Widget checklist error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load checklist" },
      { status: 500 }
    );
  }
}
