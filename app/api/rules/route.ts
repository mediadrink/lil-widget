// =============================
// /app/api/rules/route.ts
// =============================

import { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { normalizeRule, badRequest, conflict, unauthorized } from '../_utils';

export async function GET(req: NextRequest) {
const { searchParams } = new URL(req.url);
const widget_id = searchParams.get('widget_id');
if (!widget_id) return badRequest('widget_id is required');

const supabase = await supabaseServer();
const {
data: { user },
} = await supabase.auth.getUser();
if (!user) return unauthorized();

const { data, error } = await supabase
.from('rules')
.select('*')
.eq('widget_id', widget_id)
.order('position', { ascending: true })
.order('created_at', { ascending: true });

if (error) return Response.json({ error: error.message }, { status: 500 });
return Response.json({ rules: data ?? [] });
}

export async function POST(req: NextRequest) {
const body = await req.json().catch(() => ({} as any));
const widget_id = body?.widget_id as string;
let text = String(body?.text ?? '');
if (!widget_id || !text) return badRequest('widget_id and text are required');

const supabase = await supabaseServer();
const {
data: { user },
} = await supabase.auth.getUser();
if (!user) return unauthorized();

text = normalizeRule(text);
if (text.length < 3 || text.length > 280) return badRequest('text length 3..280');

// Fetch current max position for the widget
const { data: maxPosRow } = await supabase
.from('rules')
.select('position')
.eq('widget_id', widget_id)
.order('position', { ascending: false })
.limit(1)
.maybeSingle();

const position = (maxPosRow?.position ?? 0) + 1;

const { data, error } = await supabase
.from('rules')
.insert({ user_id: user.id, widget_id, text, position })
.select()
.single();

if (error) {
if (error.code === '23505') return conflict('Duplicate rule for widget');
return Response.json({ error: error.message }, { status: 500 });
}

return Response.json({ rule: data });
}
