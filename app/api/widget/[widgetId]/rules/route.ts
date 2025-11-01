// app/api/widget/[widgetId]/rules/route.ts
// GET  -> list rules for a widget
// POST -> create a new rule for a widget
// Expects Supabase server client at '@/lib/supabaseServer'
// Tables: widget_rules(id, widget_id, version, text, created_at)
//         widgets(id, owner_id)

import { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

type RouteContext = { params: Promise<{ widgetId: string }> };

function bad(msg: string, status = 400) {
  return Response.json({ error: msg }, { status });
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const supabase = await supabaseServer();
  const params = await context.params;
  const widgetId = String(params?.widgetId ?? '').trim();
  if (!widgetId) return bad('widgetId is required in the route');

  // Optional auth/ownership gate (will no-op if no user/owner_id set).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If the widget has an owner, make sure requester is that owner.
  const { data: widget, error: widgetErr } = await supabase
    .from('widgets')
    .select('id, owner_id')
    .eq('id', widgetId)
    .single();

  if (widgetErr || !widget) {
    return bad('Widget not found', 404);
  }
  if (widget.owner_id && (!user || user.id !== widget.owner_id)) {
    return bad('Forbidden', 403);
  }

  const { data, error } = await supabase
    .from('widget_rules')
    .select('id, widget_id, version, text, created_at')
    .eq('widget_id', widgetId)
    .order('created_at', { ascending: false });

  if (error) return bad(error.message, 500);
  return Response.json({ rules: data ?? [] });
}

export async function POST(req: NextRequest, context: RouteContext) {
  const supabase = await supabaseServer();
  const params = await context.params;
  const widgetId = String(params?.widgetId ?? '').trim();
  if (!widgetId) return bad('widgetId is required in the route');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return bad('Unauthorized', 401);

  // Ensure user owns the widget (when owner_id is set)
  const { data: widget, error: widgetErr } = await supabase
    .from('widgets')
    .select('id, owner_id')
    .eq('id', widgetId)
    .single();

  if (widgetErr || !widget) {
    return bad('Widget not found', 404);
  }
  if (widget.owner_id && user.id !== widget.owner_id) {
    return bad('Forbidden', 403);
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return bad('Invalid JSON body');
  }

  const text = String(body?.text ?? '').trim();
  const version = body?.version ? String(body.version).trim() : null;

  if (!text) return bad('text is required');
  if (text.length > 5000) return bad('text too long (max 5000 chars)');

  const payload = {
    widget_id: widgetId,
    text,
    version: version ?? null, // NULL is fine per schema
  };

  const { data, error } = await supabase
    .from('widget_rules')
    .insert(payload)
    .select('id, widget_id, version, text, created_at')
    .single();

  if (error) return bad(error.message, 500);
  return Response.json({ rule: data }, { status: 201 });
}

// (Optional) allow preflight if you’re calling from the dashboard via fetch()
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
