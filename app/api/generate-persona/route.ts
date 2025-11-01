import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const {
      widgetName,
      websiteUrl,
      industry,
      crawlType, // "basic" or "deep"
      crawledData, // The metadata from crawling
    } = await req.json();

    if (!widgetName || !industry) {
      return NextResponse.json(
        { error: "Widget name and industry are required" },
        { status: 400 }
      );
    }

    // Build context based on crawl depth
    let websiteContext = "";
    if (crawledData) {
      const { title, description, location, phone, email, services, aboutText, servicesCount } = crawledData;

      if (crawlType === "deep") {
        websiteContext = `
DEEP WEBSITE ANALYSIS:
- Company: ${title || widgetName}
- Website: ${websiteUrl || "not provided"}
- Description: ${description || "not provided"}
- Location: ${location || "not provided"}
- Contact: ${phone ? `Phone: ${phone}` : ""} ${email ? `Email: ${email}` : ""}
- Services Found: ${servicesCount || 0} services analyzed
- About: ${aboutText || "not provided"}

Note: This is a DEEP CRAWL with comprehensive business information from multiple pages.`;
      } else {
        websiteContext = `
BASIC WEBSITE ANALYSIS:
- Company: ${title || widgetName}
- Website: ${websiteUrl || "not provided"}
- Description: ${description || "not provided"}
- Location: ${location || "not provided"}
- About: ${aboutText || "not provided"}

Note: This is a BASIC CRAWL from the homepage only. Information may be limited.`;
      }
    } else {
      websiteContext = `
NO WEBSITE DATA:
- Widget Name: ${widgetName}
- Website: ${websiteUrl || "not provided"}

Note: No website crawl was performed. Create a general persona based on industry only.`;
    }

    // Industry-specific guidance
    const industryGuidance: Record<string, string> = {
      legal: "Be professional and authoritative. Never provide legal advice. Always recommend scheduling a consultation for specific legal matters. Show empathy for sensitive situations.",
      healthcare: "Be compassionate and informative. Never provide medical diagnosis. Always recommend consulting with a healthcare professional for specific concerns. Maintain patient privacy.",
      restaurant: "Be enthusiastic and welcoming. Help with reservations, menu questions, hours, and directions. Make guests excited to visit.",
      realestate: "Be knowledgeable and trustworthy. Help with property questions, neighborhoods, and the buying/selling process. Encourage scheduling viewings or consultations.",
      consulting: "Demonstrate expertise while being approachable. Focus on understanding client needs and scheduling discovery calls.",
      ecommerce: "Help customers find products, answer shipping/returns questions, and make recommendations. Be helpful without being pushy.",
      saas: "Explain features clearly and help with technical questions. Guide users toward demos or trials. Balance being technical with being accessible.",
      fitness: "Be motivational and supportive. Help with class schedules, membership questions, and booking sessions. Encourage healthy habits.",
      education: "Be encouraging and informative. Help with course information, enrollment, and scheduling.",
      custom: "Be helpful, professional, and responsive to visitor needs.",
    };

    const guidance = industryGuidance[industry] || industryGuidance.custom;

    const systemPrompt = `You are an expert at creating AI assistant personas for customer-facing chat widgets.

Your task: Generate a SINGLE, COHESIVE persona for a chat widget that will be embedded on a business website.

IMPORTANT REQUIREMENTS:
1. Write in SECOND PERSON ("You are...") - this will be used as system instructions for the AI
2. Create ONE unified persona - DO NOT include multiple "You are..." statements
3. Be specific and actionable - include concrete details from the website data
4. Match the industry's tone and requirements
5. Keep it under 200 words
6. Make it sound natural and professional
7. If crawl data is limited, create a solid general persona based on industry

CONTEXT:
Industry: ${industry}
${websiteContext}

Industry Requirements:
${guidance}

Generate the persona now. Return ONLY the persona text, no preamble or explanation.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: "Generate the persona for this chat widget assistant.",
        },
      ],
      temperature: 0.7,
      max_tokens: 400,
    });

    const personaText = response.choices?.[0]?.message?.content?.trim() || "";

    if (!personaText) {
      throw new Error("Failed to generate persona");
    }

    return NextResponse.json({
      persona: personaText,
      crawlType,
      success: true,
    });
  } catch (error: any) {
    console.error("Generate persona error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate persona" },
      { status: 500 }
    );
  }
}
