// =============================
// /app/api/rules/suggestions/route.ts
// =============================

import { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { badRequest, unauthorized } from '../../_utils';

export async function GET(req: NextRequest) {
const { searchParams } = new URL(req.url);
const widget_id = searchParams.get('widget_id');
if (!widget_id) return badRequest('widget_id is required');

const supabase = await supabaseServer();
const { data: { user } } = await supabase.auth.getUser();
if (!user) return unauthorized();

const { data, error } = await supabase
.from('suggested_rules')
.select('*')
.eq('widget_id', widget_id)
.order('created_at', { ascending: false })
.limit(50);

if (error) return Response.json({ error: error.message }, { status: 500 });
return Response.json({ suggestions: data ?? [] });
}
