// app/api/demo-widget/route.ts
// Creates a demo widget without authentication - for homepage builder
// These widgets are marked as demos and can be used for lead capture

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/serverAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, name, personality } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.match(/^https?:\/\//i)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    // Validate URL format
    try {
      new URL(normalizedUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    // Crawl the website to get metadata
    let metadata: any = {};
    let crawlError = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(normalizedUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; LilWidget/1.0; +https://lilwidget.com)",
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const html = await response.text();
        metadata = extractMetadata(html, normalizedUrl);
      }
    } catch (err: any) {
      console.error("Demo widget crawl error:", err.message);
      crawlError = err.message;
      // Continue with empty metadata - don't fail the widget creation
    }

    // Generate a persona based on personality trait and crawled data
    const personaText = generatePersona(name, personality, metadata);

    // Create the demo widget
    const { data: widget, error: insertError } = await supabaseAdmin
      .from("widgets")
      .insert({
        owner_id: null, // Demo widgets have no owner
        title: name || "Demo Assistant",
        url: normalizedUrl,
        persona_text: personaText,
        style: "style-1",
        position: "bottom-right",
        crawl_tier: "basic",
        is_demo: true,
        demo_personality: personality,
        demo_metadata: metadata,
      })
      .select("id, title, url, persona_text")
      .single();

    if (insertError) {
      console.error("Demo widget insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create demo widget" },
        { status: 500 }
      );
    }

    // Store as a lead in demo_leads table (if it exists, otherwise just log)
    try {
      await supabaseAdmin.from("demo_leads").insert({
        widget_id: widget.id,
        url: normalizedUrl,
        assistant_name: name,
        personality,
        metadata,
      });
    } catch (leadErr) {
      // Table might not exist yet - that's okay
      console.log("Demo lead tracking:", { url: normalizedUrl, name, personality });
    }

    return NextResponse.json({
      success: true,
      widgetId: widget.id,
      widget: {
        id: widget.id,
        title: widget.title,
        url: widget.url,
      },
      metadata: {
        title: metadata.title,
        description: metadata.description,
        crawled: !crawlError,
      },
    });
  } catch (err: any) {
    console.error("Demo widget error:", err);
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}

// Extract metadata from HTML
function extractMetadata(html: string, url: string) {
  const cleanText = (text: string): string => {
    return text
      .replace(/&#8217;/g, "'")
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&#038;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&nbsp;/g, " ")
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  let title = "";
  let description = "";
  let services: string[] = [];
  let aboutText = "";

  try {
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    title = titleMatch ? cleanText(titleMatch[1]) : "";

    // Try H1 if no title
    if (!title || title.length < 3) {
      const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      if (h1Match) title = cleanText(h1Match[1]);
    }

    // Extract description
    let descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    if (!descMatch) {
      descMatch = html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
    }
    if (!descMatch) {
      descMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    }
    description = descMatch ? cleanText(descMatch[1]) : "";

    // If no description, try first paragraph
    if (!description) {
      const pMatch = html.match(/<p[^>]*>([^<]{20,200})<\/p>/i);
      if (pMatch) description = cleanText(pMatch[1]).substring(0, 200);
    }

    // Try to extract services from headings or list items
    const serviceMatches = html.match(/<h[2-3][^>]*>([^<]{5,60})<\/h[2-3]>/gi);
    if (serviceMatches) {
      services = serviceMatches
        .map((s) => cleanText(s))
        .filter((s) => s.length > 5 && s.length < 60)
        .filter((s) => !s.match(/^(home|about|contact|menu|blog|news|privacy|terms)/i))
        .slice(0, 5);
    }

    // Try to get about text
    const aboutMatch = html.match(/<p[^>]*>([^<]{100,500})<\/p>/i);
    if (aboutMatch) {
      aboutText = cleanText(aboutMatch[1]).substring(0, 300);
    }
  } catch (parseErr) {
    console.error("Metadata parse error:", parseErr);
  }

  return {
    title,
    description,
    services,
    aboutText,
    url,
  };
}

// Generate persona text based on personality and metadata
function generatePersona(name: string, personality: string, metadata: any): string {
  const businessName = metadata.title || "this business";
  const businessDesc = metadata.description || "";
  const services = metadata.services?.length > 0
    ? `Services include: ${metadata.services.join(", ")}.`
    : "";

  const personalityTraits: Record<string, string> = {
    friendly: "You are warm, approachable, and conversational. Use a casual but professional tone. Feel free to use occasional emojis. Make visitors feel welcome and comfortable.",
    professional: "You are polished, formal, and business-like. Maintain a professional demeanor at all times. Be precise and thorough in your responses.",
    witty: "You have a clever sense of humor and enjoy wordplay. Be engaging and entertaining while still being helpful. Don't be afraid to make the occasional joke.",
    helpful: "You are extremely supportive and go above and beyond to assist. Anticipate follow-up questions and provide comprehensive answers. Your goal is to be as helpful as possible.",
    concise: "You are brief and to the point. Give direct answers without unnecessary elaboration. Respect the visitor's time.",
    enthusiastic: "You are energetic and excited! Use exclamation points and show genuine enthusiasm. Make every interaction feel exciting and positive!",
  };

  const personalityText = personalityTraits[personality] || personalityTraits.friendly;

  let persona = `You are ${name}, an AI assistant for ${businessName}.

${personalityText}

${businessDesc ? `About the business: ${businessDesc}` : ""}
${services}

Your role is to:
- Answer questions about the business
- Help visitors find information they need
- Be engaging and represent the brand well
- If you don't know specific details, encourage visitors to contact the business directly or sign up for more personalized assistance

Keep responses concise but helpful. If asked about something you don't have information on, be honest and suggest they reach out directly for accurate details.`;

  return persona.trim();
}
