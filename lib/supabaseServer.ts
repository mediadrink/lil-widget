// Lil Widget — Step 2 API routes
// Implements minimal REST endpoints for rules + suggested_rules
// Next.js (App Router) with Supabase RLS (auth required)
//
// File tree:
// /lib/supabaseServer.ts
// /app/api/rules/route.ts            (GET list, POST create)
// /app/api/rules/bulk/route.ts       (POST bulk create)
// /app/api/rules/[id]/route.ts       (PATCH update, DELETE)
// /app/api/rules/suggestions/route.ts (GET suggestions)
//
// Notes:
// - Expects Supabase project URL/ANON/Service envs already wired.
// - Assumes user is logged in (cookies contain Supabase session). RLS enforces user_id.
// - Frontend must include user_id when inserting; server verifies and overwrites for safety.
// - Text normalized and length-checked on server; duplicates per widget are handled by DB unique constraint.

// =============================
// /lib/supabaseServer.ts
// =============================

import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options, maxAge: 0 });
        },
      },
    }
  );
}

