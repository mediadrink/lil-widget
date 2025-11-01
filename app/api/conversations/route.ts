// app/api/conversations/route.ts
import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(_req: NextRequest) {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Join conversations -> widgets to enforce ownership
  // Filter out test conversations from admin panel
  const { data, error } = await supabase
    .from("conversations")
    .select(
      `
      id,
      widget_id,
      started_at,
      message_count,
      char_count,
      widgets!inner(id, owner_id, title)
    `
    )
    .eq("is_test", false)
    .order("started_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const rows =
    (data || [])
      .filter((r) => {
        const widget = Array.isArray(r.widgets) ? r.widgets[0] : r.widgets;
        return widget?.owner_id === user.id;
      })
      .map((r: any) => {
        const widget = Array.isArray(r.widgets) ? r.widgets[0] : r.widgets;
        return {
          id: r.id,
          widget_id: r.widget_id,
          started_at: r.started_at,
          message_count: r.message_count ?? 0,
          char_count: r.char_count ?? 0,
          widget_title: widget?.title ?? "",
        };
      }) ?? [];

  return Response.json({ conversations: rows });
}
