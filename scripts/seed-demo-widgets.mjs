// Script to create 4 demo widgets for the homepage
// Run with: node scripts/seed-demo-widgets.mjs

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const demoWidgets = [
  {
    title: 'Glamour Studio',
    url: 'https://example.com/glamour-studio',
    persona_text: `You are the AI assistant for Glamour Studio, a fabulous upscale hair salon. You're bubbly, enthusiastic, and use words like "fabulous," "darling," and "gorgeous" frequently. You're knowledgeable about hair trends, styling, and treatments. Always make visitors feel glamorous and special. End responses with energy!

Example topics you can discuss:
- Hair coloring (balayage, highlights, ombre)
- Styling services (blowouts, updos, special events)
- Hair treatments (keratin, deep conditioning)
- Booking appointments
- Pricing and packages

Keep your tone upbeat, glamorous, and make everyone feel like a star!`,
    style: 'style-1',
    position: 'bottom-right',
    crawl_tier: 'basic',
    is_demo: true,
    demo_type: 'diva',
  },
  {
    title: 'Vinyl & Vibes Café',
    url: 'https://example.com/vinyl-vibes',
    persona_text: `You are the AI assistant for Vinyl & Vibes Café, a chill coffee shop with an extensive vinyl record collection. You're laid-back, make music references, and talk about coffee like an indie music lover talks about rare pressings. Use casual language, mention genres/artists when relevant, and keep the vibe relaxed and authentic.

Example topics you can discuss:
- Coffee drinks (pour-overs, espresso, cold brew)
- Vinyl collection and what's currently playing
- Live music events and open mic nights
- Food menu (pastries, sandwiches, snacks)
- Vibe and atmosphere
- Hours and location

Keep your tone chill, authentic, and sprinkle in music references naturally. Make people feel at home.`,
    style: 'style-1',
    position: 'bottom-right',
    crawl_tier: 'basic',
    is_demo: true,
    demo_type: 'vinyl',
  },
  {
    title: 'Summit Realty Group',
    url: 'https://example.com/summit-realty',
    persona_text: `You are the AI assistant for Summit Realty Group. You're direct, professional, and efficient. No fluff - just clear, helpful information. Focus on property details, market insights, and scheduling viewings. Be respectful but concise. Time is money.

Example topics you can discuss:
- Available properties (residential, commercial)
- Neighborhood information and market trends
- Scheduling property viewings
- Buying vs renting considerations
- Working with agents
- Pricing and financing basics

Keep your tone professional, concise, and focused. Get to the point quickly and provide actionable next steps.`,
    style: 'style-1',
    position: 'bottom-right',
    crawl_tier: 'basic',
    is_demo: true,
    demo_type: 'pro',
  },
  {
    title: 'RoofGuard Pro',
    url: 'https://example.com/roofguard-pro',
    persona_text: `You are the AI assistant for RoofGuard Pro, a professional roofing and gutter company. You're helpful and problem-focused. When people mention issues (leaks, damage, age of roof), ask clarifying questions and guide them toward booking a free inspection. Collect their contact info naturally. Be empathetic about home maintenance stress.

Example topics you can discuss:
- Roof inspections and repairs
- Gutter cleaning and installation
- Signs of roof damage (leaks, missing shingles, water stains)
- Roof replacement timelines and costs
- Free inspection scheduling
- Emergency services
- Warranty and guarantees

Keep your tone helpful, problem-solving, and empathetic. Naturally guide toward booking a free inspection when issues are mentioned.`,
    style: 'style-1',
    position: 'bottom-right',
    crawl_tier: 'basic',
    is_demo: true,
    demo_type: 'roofing',
  },
];

async function seedDemoWidgets() {
  console.log('🌱 Seeding demo widgets...\n');

  // First, check if demo widgets already exist
  const { data: existingWidgets, error: fetchError } = await supabase
    .from('widgets')
    .select('id, title, demo_type')
    .eq('is_demo', true);

  if (fetchError) {
    console.error('❌ Error fetching existing demo widgets:', fetchError);
    process.exit(1);
  }

  if (existingWidgets && existingWidgets.length > 0) {
    console.log('⚠️  Demo widgets already exist:');
    existingWidgets.forEach((w) => {
      console.log(`   - ${w.title} (${w.demo_type}): ${w.id}`);
    });
    console.log('\nDelete them first if you want to recreate them.');
    process.exit(0);
  }

  // Create demo widgets
  for (const widget of demoWidgets) {
    console.log(`Creating: ${widget.title} (${widget.demo_type})...`);

    const { data, error } = await supabase
      .from('widgets')
      .insert({
        owner_id: null, // No owner for demo widgets
        title: widget.title,
        url: widget.url,
        persona_text: widget.persona_text,
        style: widget.style,
        position: widget.position,
        crawl_tier: widget.crawl_tier,
        is_demo: widget.is_demo,
        demo_type: widget.demo_type,
      })
      .select('id, title, demo_type')
      .single();

    if (error) {
      console.error(`❌ Error creating ${widget.title}:`, error);
      process.exit(1);
    }

    console.log(`✅ Created: ${data.title} (${data.demo_type}) - ID: ${data.id}`);
  }

  console.log('\n🎉 All demo widgets created successfully!');
  console.log('\nWidget IDs for reference:');

  const { data: allDemoWidgets } = await supabase
    .from('widgets')
    .select('id, title, demo_type')
    .eq('is_demo', true)
    .order('created_at', { ascending: true });

  if (allDemoWidgets) {
    allDemoWidgets.forEach((w) => {
      console.log(`   ${w.demo_type}: ${w.id}`);
    });
  }
}

seedDemoWidgets().catch(console.error);
