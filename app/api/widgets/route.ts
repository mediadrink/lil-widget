// app/api/widgets/route.ts
// POST -> Create a new widget
// GET  -> List all widgets for the authenticated user

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(req: NextRequest) {
  const supabase = await supabaseServer();

  // Require authentication
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch all widgets owned by this user
  const { data, error } = await supabase
    .from('widgets')
    .select('id, title, url, persona_text, style, position, crawl_tier, created_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ widgets: data ?? [] }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const supabase = await supabaseServer();

  // Require authentication
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse request body
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const title = String(body?.title ?? '').trim();
  const url = String(body?.url ?? '').trim();
  const persona_text = String(body?.persona_text ?? '').trim();
  const style = String(body?.style ?? 'style-1').trim();
  const position = String(body?.position ?? 'bottom-right').trim();
  const crawl_tier = String(body?.crawl_tier ?? 'basic').trim();
  const industry = String(body?.industry ?? 'custom').trim();

  if (!title) {
    return NextResponse.json({ error: 'Widget title is required' }, { status: 400 });
  }

  // Validate crawl_tier
  if (!['basic', 'deep'].includes(crawl_tier)) {
    return NextResponse.json({ error: 'Invalid crawl tier' }, { status: 400 });
  }

  // Check widget limits based on subscription tier
  const subscriptionTier = user?.user_metadata?.subscription_tier || 'free';
  const widgetLimit = subscriptionTier === 'paid' ? 2 : 1;

  // Count existing widgets
  const { count, error: countError } = await supabase
    .from('widgets')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', user.id);

  if (countError) {
    console.error('Widget count error:', countError);
    return NextResponse.json({ error: 'Failed to check widget limit' }, { status: 500 });
  }

  if (count !== null && count >= widgetLimit) {
    const tierName = subscriptionTier === 'paid' ? 'Growth' : 'Basic';
    return NextResponse.json({
      error: `${tierName} plan allows ${widgetLimit} widget${widgetLimit > 1 ? 's' : ''}. Please upgrade to create more widgets.`,
      limitReached: true,
      currentCount: count,
      limit: widgetLimit,
      tier: subscriptionTier
    }, { status: 403 });
  }

  // Create widget
  const { data, error } = await supabase
    .from('widgets')
    .insert({
      owner_id: user.id,
      title,
      url: url || null,
      persona_text: persona_text || null,
      style,
      position,
      crawl_tier,
    })
    .select('id, title, url, persona_text, style, position, crawl_tier, created_at')
    .single();

  if (error) {
    console.error('Widget creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ widget: data }, { status: 201 });
}
