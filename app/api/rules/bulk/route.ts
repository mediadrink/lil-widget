// =============================
// /app/api/rules/bulk/route.ts
// =============================

import { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { normalizeRule, badRequest, unauthorized } from '../../_utils';

export async function POST(req: NextRequest) {
const body = await req.json().catch(() => ({} as any));
const widget_id = body?.widget_id as string;
const texts = (body?.texts as string[] | undefined)?.map(normalizeRule) ?? [];
if (!widget_id || texts.length === 0) return badRequest('widget_id and texts[] required');

const supabase = await supabaseServer();
const { data: { user } } = await supabase.auth.getUser();
if (!user) return unauthorized();

// Get existing rules to skip duplicates (case-insensitive)
const { data: existing } = await supabase
.from('rules')
.select('text, position')
.eq('widget_id', widget_id);
const existingSet = new Set((existing ?? []).map(r => r.text.toLowerCase()));

const valid = texts
.map(t => t.trim())
.filter(t => t.length >= 3 && t.length <= 280)
.filter(t => !existingSet.has(t.toLowerCase()));

if (valid.length === 0) return Response.json({ inserted: [], skipped: texts }, { status: 200 });

const maxPos = (existing ?? []).reduce((m, r) => Math.max(m, r.position ?? 0), 0);
const rows = valid.map((t, i) => ({ user_id: user.id, widget_id, text: t, position: maxPos + 1 + i }));

const { data, error } = await supabase.from('rules').insert(rows).select('*');
if (error) return Response.json({ error: error.message }, { status: 500 });

return Response.json({ inserted: data, skipped: texts.filter(t => !valid.includes(t)) });
}