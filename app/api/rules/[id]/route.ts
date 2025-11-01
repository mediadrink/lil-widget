// =============================
import { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { normalizeRule, badRequest, conflict, unauthorized } from '../../_utils';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: Ctx) {
const params = await context.params;
const id = params.id;
const body = await req.json().catch(() => ({} as any));
let text = body?.text as string | undefined;
const enabled = body?.enabled as boolean | undefined;
const position = body?.position as number | undefined;

const supabase = await supabaseServer();
const { data: { user } } = await supabase.auth.getUser();
if (!user) return unauthorized();

const patch: any = {};
if (typeof text === 'string') {
text = normalizeRule(text);
if (text.length < 3 || text.length > 280) return badRequest('text length 3..280');
patch.text = text;
}
if (typeof enabled === 'boolean') patch.enabled = enabled;
if (typeof position === 'number') patch.position = position;
if (Object.keys(patch).length === 0) return badRequest('No valid fields');

const { data, error } = await supabase
.from('rules')
.update(patch)
.eq('id', id)
.select('*')
.single();

if (error) {
if (error.code === '23505') return conflict('Duplicate rule for widget');
return Response.json({ error: error.message }, { status: 500 });
}

return Response.json({ rule: data });
}

export async function DELETE(req: NextRequest, context: Ctx) {
const params = await context.params;
const id = params.id;
const supabase = await supabaseServer();
const { data: { user } } = await supabase.auth.getUser();
if (!user) return unauthorized();

const { error } = await supabase.from('rules').delete().eq('id', id);
if (error) return Response.json({ error: error.message }, { status: 500 });
return new Response(null, { status: 204 });
}
