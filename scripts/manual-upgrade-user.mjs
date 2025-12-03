// Quick script to manually upgrade user who already paid
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const userId = 'fa786658-92c8-40bb-a229-79aa2383d723'; // From payment metadata
const subscriptionId = 'sub_1SUidvEVxGVhW8BvjF3gT0Nk';
const customerId = 'cus_TRbr8RtpUgxHVW';

console.log('Upgrading user to paid tier...');

const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
  user_metadata: {
    subscription_tier: 'paid',
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
  },
});

if (error) {
  console.error('❌ Error:', error);
  process.exit(1);
} else {
  console.log('✅ User upgraded successfully!');
  console.log('User:', data);
  console.log('\nRefresh /dashboard/upgrade to see the changes.');
}
