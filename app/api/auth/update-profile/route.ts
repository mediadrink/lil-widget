import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { full_name, subscription_tier } = await req.json();

  const updateData: any = {};
  if (full_name !== undefined) {
    updateData.full_name = full_name || null;
  }
  if (subscription_tier !== undefined) {
    updateData.subscription_tier = subscription_tier;
  }

  const { error } = await supabase.auth.updateUser({
    data: updateData,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
