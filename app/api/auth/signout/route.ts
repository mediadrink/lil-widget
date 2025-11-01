import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
  const supabase = await supabaseServer();

  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}
