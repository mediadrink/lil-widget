// app/api/widget/[widgetId]/rules/[ruleId]/route.ts
// PUT    -> update a rule's text/version
// DELETE -> remove a rule
// Requires '@/lib/supabaseServer' and tables: widgets, widget_rules

import { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

type Ctx = { params: Promise<{ widgetId: string; ruleId: string }> };

function bad(msg: string, status = 400) {
  return Response.json({ error: msg }, { status });
}

async function assertOwnership(supabase: any, widgetId: string) {
  // If the widget has an owner, only that user can modify
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw bad('Unauthorized', 401);

  const { data: widget, error } = await supabase
    .from('widgets')
    .select('id, owner_id')
    .eq('id', widgetId)
    .single();

  if (error || !widget) throw bad('Widget not found', 404);
  if (widget.owner_id && widget.owner_id !== user.id) throw bad('Forbidden', 403);
}

export async function PUT(req: NextRequest, context: Ctx) {
  const params = await context.params;
  const supabase = await supabaseServer();
  const widgetId = String(params?.widgetId ?? '').trim();
  const ruleId = String(params?.ruleId ?? '').trim();
  if (!widgetId) return bad('widgetId is required');
  if (!ruleId) return bad('ruleId is required');

  try {
    await assertOwnership(supabase, widgetId);
  } catch (e: any) {
    return e instanceof Response ? e : bad('Forbidden', 403);
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return bad('Invalid JSON body');
  }

  const text = typeof body?.text === 'string' ? body.text.trim() : undefined;
  const version =
    body?.version === null || body?.version === undefined
      ? undefined
      : String(body.version);

  if (!text && version === undefined) {
    return bad('Provide text and/or version to update');
  }

  const update: Record<string, any> = {};
  if (text !== undefined) {
    if (!text) return bad('text cannot be empty');
    if (text.length > 5000) return bad('text too long (max 5000 chars)');
    update.text = text;
  }
  if (version !== undefined) update.version = version || null;

  const { data, error } = await supabase
    .from('widget_rules')
    .update(update)
    .eq('id', ruleId)
    .eq('widget_id', widgetId) // guard: only within this widget
    .select('id, widget_id, version, text, created_at')
    .single();

  if (error) return bad(error.message, 500);
  if (!data) return bad('Rule not found', 404);
  return Response.json({ rule: data });
}

export async function DELETE(_req: NextRequest, context: Ctx) {
  const params = await context.params;
  const supabase = await supabaseServer();
  const widgetId = String(params?.widgetId ?? '').trim();
  const ruleId = String(params?.ruleId ?? '').trim();
  if (!widgetId) return bad('widgetId is required');
  if (!ruleId) return bad('ruleId is required');

  try {
    await assertOwnership(supabase, widgetId);
  } catch (e: any) {
    return e instanceof Response ? e : bad('Forbidden', 403);
  }

  // Only delete if the rule belongs to this widget
  const { error } = await supabase
    .from('widget_rules')
    .delete()
    .eq('id', ruleId)
    .eq('widget_id', widgetId);

  if (error) return bad(error.message, 500);
  return new Response(null, { status: 204 });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
