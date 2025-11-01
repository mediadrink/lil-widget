import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ✅ memoize the client
let supabase: ReturnType<typeof createBrowserClient> | null = null;

export const createClient = () => {
  if (!supabase) {
    supabase = createBrowserClient(supabaseUrl, supabaseKey);
  }
  return supabase;
};
