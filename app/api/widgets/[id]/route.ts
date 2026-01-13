// app/api/widgets/[id]/route.ts
import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/widgets/:id
 * Returns the widget record for the owner.
 * Response: { id, title, url, persona_text, style, position }
 */
export async function GET(
  _req: NextRequest,
  context: Ctx
) {
  const supabase = await supabaseServer();

  // Auth (owner-only)
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;
  const widgetId = params.id?.trim();
  if (!widgetId) {
    return Response.json({ error: "Missing widget id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("widgets")
    .select("id, owner_id, title, url, persona_text, style, position, customization, kb_type, external_kb_url, external_kb_api_key")
    .eq("id", widgetId)
    .maybeSingle();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (data.owner_id && data.owner_id !== user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { owner_id, ...safe } = data;
  return Response.json(safe, { status: 200 });
}

/**
 * PUT /api/widgets/:id
 * Updates widget (title, url, persona_text, style, position) for the owner.
 * Body: { title?, url?, persona_text?, style?, position? }
 */
export async function PUT(
  req: NextRequest,
  context: Ctx
) {
  const supabase = await supabaseServer();

  // Auth (owner-only)
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;
  const widgetId = params.id?.trim();
  if (!widgetId) {
    return Response.json({ error: "Missing widget id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const payload: {
    title?: string;
    url?: string;
    persona_text?: string;
    style?: string;
    position?: string;
    customization?: any;
    persona_updated_at?: string;
    kb_type?: string;
    external_kb_url?: string | null;
    external_kb_api_key?: string | null;
  } = {
    title: body?.title,
    url: body?.url,
    persona_text: body?.persona_text,
    style: body?.style,
    position: body?.position,
    customization: body?.customization,
    kb_type: body?.kb_type,
    external_kb_url: body?.external_kb_url,
    external_kb_api_key: body?.external_kb_api_key,
  };

  // If persona_text is being updated, set persona_updated_at timestamp
  if (body?.persona_text !== undefined) {
    payload.persona_updated_at = new Date().toISOString();
  }

  // Ensure the widget exists and belongs to the user
  const { data: existing, error: selErr } = await supabase
    .from("widgets")
    .select("id, owner_id")
    .eq("id", widgetId)
    .maybeSingle();

  if (selErr) {
    return Response.json({ error: selErr.message }, { status: 500 });
  }
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.owner_id && existing.owner_id !== user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Update
  const { data, error } = await supabase
    .from("widgets")
    .update(payload)
    .eq("id", widgetId)
    .select("id, title, url, persona_text, style, position, customization, kb_type, external_kb_url, external_kb_api_key")
    .maybeSingle();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data, { status: 200 });
}
