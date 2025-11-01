import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req: NextRequest) {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    // Get user's widgets
    const { data: widgets, error: widgetsError } = await supabase
      .from("widgets")
      .select("id, persona_text, persona_updated_at")
      .eq("owner_id", user.id);

    if (widgetsError) throw widgetsError;

    const hasWidgets = (widgets?.length || 0) > 0;

    // Get ping count (widget installations)
    const { count: pingCount, error: pingError } = await supabase
      .from("widget_pings")
      .select("id", { count: "exact", head: true })
      .in(
        "widget_id",
        widgets?.map((w) => w.id) || []
      );

    if (pingError) throw pingError;

    // Get conversation count (exclude test conversations)
    const { count: conversationCount, error: convoError } = await supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .in(
        "widget_id",
        widgets?.map((w) => w.id) || []
      )
      .eq("is_test", false);

    if (convoError) throw convoError;

    // Get rules count
    const { count: rulesCount, error: rulesError } = await supabase
      .from("widget_rules")
      .select("id", { count: "exact", head: true })
      .in(
        "widget_id",
        widgets?.map((w) => w.id) || []
      );

    if (rulesError) throw rulesError;

    // Check if persona has been manually edited (has persona_updated_at timestamp)
    const personaCustomized =
      widgets && widgets.length > 0 && widgets.some((w) => w.persona_updated_at !== null);

    // Build checklist items
    const items = [
      {
        id: "widget_created",
        label: "Widget created",
        completed: hasWidgets,
        description: "You've created your first widget",
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
    console.error("Checklist error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load checklist" },
      { status: 500 }
    );
  }
}
