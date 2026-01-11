// app/api/widgets/[id]/analyze-site/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import Anthropic from "@anthropic-ai/sdk";
import { type WidgetCustomization } from "@/lib/widgetStyles";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

/**
 * POST /api/widgets/:id/analyze-site
 * Analyzes the widget's website and generates a custom style that matches the brand
 * Requires authentication (owner only)
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await supabaseServer();
  const { id: widgetId } = await context.params;

  // Auth (owner-only)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get widget info
    const { data: widget, error: widgetError } = await supabase
      .from("widgets")
      .select("id, owner_id, url, title")
      .eq("id", widgetId)
      .single();

    if (widgetError) throw widgetError;

    if (!widget) {
      return NextResponse.json({ error: "Widget not found" }, { status: 404 });
    }

    if (widget.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!widget.url) {
      return NextResponse.json(
        { error: "Widget has no URL configured" },
        { status: 400 }
      );
    }

    // Normalize URL - ensure it has a protocol
    let normalizedUrl = widget.url.trim();
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    // Fetch the website HTML
    const siteResponse = await fetch(normalizedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; LilWidgetBot/1.0; +https://lilwidget.com)",
      },
    });

    if (!siteResponse.ok) {
      throw new Error(`Failed to fetch website: ${siteResponse.status}`);
    }

    const html = await siteResponse.text();

    // Use Claude to analyze the website and generate a custom style
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Analyze this website HTML and extract the design language to create a matching chat widget style.

Website URL: ${widget.url}
Website HTML (first 50KB):
${html.substring(0, 50000)}

Please analyze the website's:
1. Primary brand color (from logo, buttons, headers, links)
2. Secondary/accent colors
3. Body font family (look for font-family in CSS, Google Fonts links, or common patterns)
4. Design style (modern, minimal, playful, professional, etc.)
5. Border radius style (sharp, rounded, very rounded)

Based on this analysis, generate a JSON object with these exact fields:
{
  "primaryColor": "#hexcolor",
  "userMsgColor": "#hexcolor (same as primaryColor)",
  "assistantMsgColor": "#hexcolor (light/neutral background for assistant messages)",
  "assistantMsgBorder": "#hexcolor (subtle border for assistant messages)",
  "widgetBg": "#ffffff or slight tint matching site background",
  "borderRadius": "8px to 20px based on site style",
  "fontFamily": "Site's body font FIRST, then fallbacks (e.g. 'Poppins', system-ui, sans-serif)",
  "headerText": "Friendly chat header text (2-4 words, no emoji)",
  "headerIcon": "Single emoji that fits the brand (e.g. 💬, 👋, ✨, 🏠, 💼)",
  "buttonHoverColor": "#hexcolor (darker shade of primaryColor)",
  "inputBorderColor": "#hexcolor (subtle border)",
  "inputFocusColor": "#hexcolor (accent when focused, often primaryColor)"
}

IMPORTANT: For fontFamily, put the website's actual font as the FIRST value, followed by system-ui, sans-serif as fallbacks.

Respond with ONLY the JSON object, no explanation.`,
        },
      ],
    });

    // Extract JSON from Claude's response
    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Try to parse the JSON response
    let customization: WidgetCustomization;
    try {
      // Remove markdown code blocks if present
      const jsonText = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      customization = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Failed to parse AI response:", responseText);
      throw new Error("Failed to generate valid style configuration");
    }

    // Validate the customization object has required fields
    const requiredFields = [
      "primaryColor",
      "userMsgColor",
      "assistantMsgColor",
      "assistantMsgBorder",
      "widgetBg",
      "borderRadius",
      "fontFamily",
      "headerText",
      "buttonHoverColor",
      "inputBorderColor",
      "inputFocusColor",
    ];

    for (const field of requiredFields) {
      if (!(field in customization)) {
        throw new Error(`Generated style missing field: ${field}`);
      }
    }

    // Default headerIcon if not provided
    if (!customization.headerIcon) {
      customization.headerIcon = "💬";
    }

    return NextResponse.json({
      success: true,
      customization,
      message: "Website analyzed successfully",
    });
  } catch (err: any) {
    console.error("Analyze site error:", err);
    return NextResponse.json(
      {
        error: err.message || "Failed to analyze website",
      },
      { status: 500 }
    );
  }
}
