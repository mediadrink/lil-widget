// app/api/widget/[widgetId]/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/serverAdmin";
import { OpenAI } from "openai";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rateLimit";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ widgetId: string }> };

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Build messages array for OpenAI
async function buildMessages(params: {
  widgetId: string;
  conversationId: string;
  message: string;
}) {
  const { widgetId, conversationId, message } = params;

  // Fetch widget config (persona and crawl tier)
  const { data: widget } = await supabaseAdmin
    .from("widgets")
    .select("persona_text, title, crawl_tier")
    .eq("id", widgetId)
    .single();

  // Fetch widget rules
  const { data: rules } = await supabaseAdmin
    .from("widget_rules")
    .select("text")
    .eq("widget_id", widgetId)
    .order("created_at", { ascending: false });

  // Fetch knowledge base if available (deep crawl data)
  let knowledgeBase = null;
  if (widget?.crawl_tier === "deep") {
    const { data: kb } = await supabaseAdmin
      .from("widget_knowledge_base")
      .select("data")
      .eq("widget_id", widgetId)
      .single();

    if (kb && kb.data) {
      knowledgeBase = kb.data;
    }
  }

  // Fetch conversation history (last 10 messages)
  const { data: conversationHistory } = await supabaseAdmin
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(10);

  // Build system message
  let systemMessage = "";

  // 1. Start with persona (tone, style, behavior)
  if (widget?.persona_text) {
    systemMessage += widget.persona_text + "\n\n";
  }

  // 2. Add knowledge base as reference tool (separate from persona)
  if (knowledgeBase) {
    systemMessage += "---\n\n";
    systemMessage += "KNOWLEDGE BASE - Reference Information About This Business:\n\n";
    systemMessage += "Use this information to answer visitor questions accurately. This is factual data about the business.\n\n";

    // Services
    if (knowledgeBase.services && knowledgeBase.services.length > 0) {
      systemMessage += "**Services/Offerings:**\n";
      knowledgeBase.services.forEach((service: string, idx: number) => {
        systemMessage += `${idx + 1}. ${service}\n`;
      });
      systemMessage += "\n";
    }

    // Team members
    if (knowledgeBase.team && knowledgeBase.team.length > 0) {
      systemMessage += "**Team Members:**\n";
      knowledgeBase.team.forEach((member: any) => {
        systemMessage += `- ${member.name}`;
        if (member.bio) {
          systemMessage += `: ${member.bio}`;
        }
        systemMessage += "\n";
      });
      systemMessage += "\n";
    }

    // Menu items (for restaurants)
    if (knowledgeBase.menuItems && knowledgeBase.menuItems.length > 0) {
      systemMessage += "**Menu Items:**\n";
      knowledgeBase.menuItems.slice(0, 50).forEach((item: any) => {
        systemMessage += `- ${item.name}`;
        if (item.price) {
          systemMessage += ` - ${item.price}`;
        }
        systemMessage += "\n";
      });
      systemMessage += "\n";
    }

    // Client work / Portfolio
    if (knowledgeBase.clientWork && knowledgeBase.clientWork.length > 0) {
      systemMessage += "**Portfolio/Client Work:**\n";
      knowledgeBase.clientWork.forEach((work: string) => {
        systemMessage += `- ${work}\n`;
      });
      systemMessage += "\n";
    }

    // FAQ
    if (knowledgeBase.faq && knowledgeBase.faq.length > 0) {
      systemMessage += "**Frequently Asked Questions:**\n";
      knowledgeBase.faq.forEach((item: any) => {
        systemMessage += `Q: ${item.question}\n`;
        systemMessage += `A: ${item.answer}\n\n`;
      });
    }

    // Locations
    if (knowledgeBase.locations && knowledgeBase.locations.length > 0) {
      systemMessage += "**Locations:**\n";
      knowledgeBase.locations.forEach((location: any) => {
        systemMessage += `- ${JSON.stringify(location)}\n`;
      });
      systemMessage += "\n";
    }

    systemMessage += "---\n\n";
  }

  // 3. Add custom rules
  if (rules && rules.length > 0) {
    systemMessage += "Important rules to follow:\n";
    rules.forEach((rule, idx) => {
      systemMessage += `${idx + 1}. ${rule.text}\n`;
    });
    systemMessage += "\n";
  }

  // 4. Add formatting instructions
  systemMessage += `---

FORMATTING INSTRUCTIONS:
- Use markdown formatting to make your responses clear and scannable
- Use **bold** for emphasis on important points
- Use bullet points (-) for lists of items
- Use numbered lists (1. 2. 3.) for sequential steps
- Use line breaks to separate ideas and make responses easy to read
- Keep responses conversational but well-structured`;

  // Build messages array for OpenAI
  const messages: any[] = [];

  // Add system message
  if (systemMessage.trim()) {
    messages.push({
      role: "system",
      content: systemMessage.trim(),
    });
  }

  // Add conversation history
  if (conversationHistory && conversationHistory.length > 0) {
    conversationHistory.forEach((msg) => {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    });
  }

  // Add current user message
  messages.push({
    role: "user",
    content: message,
  });

  return messages;
}

export async function POST(
  req: NextRequest,
  context: Ctx
) {
  try {
    const params = await context.params;
    const { widgetId } = params;
    const { conversationId, message, visitorId, isTest, stream } = await req.json();

    // Rate limiting - prevent bot abuse
    const clientIp = getClientIp(req);
    const rateLimitKey = `widget:${widgetId}:${clientIp}`;
    const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMITS.WIDGET_CHAT);

    if (!rateLimit.success) {
      const resetDate = new Date(rateLimit.reset).toISOString();
      return new Response(
        JSON.stringify({
          error: "Too many requests. Please try again later.",
          retryAfter: Math.ceil((rateLimit.reset - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "X-RateLimit-Limit": rateLimit.limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": resetDate,
            "Retry-After": Math.ceil((rateLimit.reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    if (!widgetId || !message) {
      return new Response(
        JSON.stringify({ error: "widgetId and message required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "X-RateLimit-Limit": rateLimit.limit.toString(),
            "X-RateLimit-Remaining": rateLimit.remaining.toString(),
          },
        }
      );
    }

    // Ensure widget exists and get owner + external KB settings
    const { data: widget } = await supabaseAdmin
      .from("widgets")
      .select("id, owner_id, kb_type, external_kb_url, external_kb_api_key")
      .eq("id", widgetId)
      .single();

    if (!widget) {
      return new Response(
        JSON.stringify({ error: "Widget not found" }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        }
      );
    }

    // Handle external knowledge base API
    if (widget.kb_type === "external" && widget.external_kb_url) {
      try {
        const externalHeaders: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (widget.external_kb_api_key) {
          externalHeaders["Authorization"] = `Bearer ${widget.external_kb_api_key}`;
        }

        const externalResponse = await fetch(widget.external_kb_url, {
          method: "POST",
          headers: externalHeaders,
          body: JSON.stringify({ question: message }),
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });

        if (!externalResponse.ok) {
          throw new Error(`External API returned ${externalResponse.status}`);
        }

        const externalData = await externalResponse.json();
        const reply = externalData.answer || externalData.response || "No response from knowledge base.";

        // Return as SSE stream format for widget compatibility
        const sseData = [
          `data: ${JSON.stringify({ conversationId: conversationId || null, content: reply })}\n\n`,
          `data: [DONE]\n\n`,
        ].join("");

        return new Response(sseData, {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "X-RateLimit-Limit": rateLimit.limit.toString(),
            "X-RateLimit-Remaining": rateLimit.remaining.toString(),
          },
        });
      } catch (externalError: any) {
        console.error("External KB error:", externalError);
        const errorReply = "Sorry, I'm having trouble connecting to the knowledge base. Please try again later.";
        const sseErrorData = [
          `data: ${JSON.stringify({ conversationId: conversationId || null, content: errorReply })}\n\n`,
          `data: [DONE]\n\n`,
        ].join("");

        return new Response(sseErrorData, {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      }
    }

    // Rate limiting: Check if user has exceeded free tier limit
    // Only enforce when creating a NEW conversation (not continuing existing one)
    // AND only for non-test conversations (test conversations always allowed)
    let conversationCount: number | null = null;
    let ownerEmail: string | undefined;
    let ownerName: string | undefined;
    let notificationsSent: { warning?: boolean; paused?: boolean } = {};

    if (!conversationId && isTest !== true) {
      try {
        // Get widget owner's subscription tier
        const { data: { user: owner } } = await supabaseAdmin.auth.admin.getUserById(widget.owner_id);
        const subscriptionTier = owner?.user_metadata?.subscription_tier || "free";
        ownerEmail = owner?.email;
        ownerName = owner?.user_metadata?.full_name || owner?.email?.split('@')[0];
        notificationsSent = owner?.user_metadata?.limit_notifications || {};

        // Only enforce limits for free tier
        if (subscriptionTier === "free") {
          // Count conversations in current billing period (rolling 30 days from signup)
          const now = new Date();
          const userCreatedAt = owner?.created_at ? new Date(owner.created_at) : now;

          // Calculate the start of the current billing period
          // Find how many complete 30-day cycles have passed since signup
          const daysSinceSignup = Math.floor((now.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
          const completeCycles = Math.floor(daysSinceSignup / 30);
          const billingPeriodStart = new Date(userCreatedAt.getTime() + (completeCycles * 30 * 24 * 60 * 60 * 1000));

          // Check if we're in a new billing period and need to reset notifications
          const lastNotificationPeriod = owner?.user_metadata?.limit_notification_period;
          const currentPeriod = completeCycles;
          if (lastNotificationPeriod !== currentPeriod) {
            // New billing period - reset notification flags
            notificationsSent = {};
            await supabaseAdmin.auth.admin.updateUserById(widget.owner_id, {
              user_metadata: {
                limit_notifications: {},
                limit_notification_period: currentPeriod,
              },
            });
          }

          // Get all widgets owned by this user
          const { data: userWidgets } = await supabaseAdmin
            .from("widgets")
            .select("id")
            .eq("owner_id", widget.owner_id);

          const widgetIds = userWidgets?.map((w) => w.id) || [];

          // Count non-test conversations in current billing period
          const { count } = await supabaseAdmin
            .from("conversations")
            .select("id", { count: "exact", head: true })
            .in("widget_id", widgetIds)
            .gte("created_at", billingPeriodStart.toISOString())
            .eq("is_test", false);

          conversationCount = count;

          // Free tier limit: 50 conversations per month
          if (count !== null && count >= 50) {
            // Send paused notification if not already sent this month
            if (ownerEmail && !notificationsSent.paused) {
              try {
                await sendEmail(ownerEmail, "limit-reached", {
                  conversationsUsed: count,
                  userName: ownerName,
                });
                // Mark notification as sent
                await supabaseAdmin.auth.admin.updateUserById(widget.owner_id, {
                  user_metadata: {
                    limit_notifications: { ...notificationsSent, paused: true },
                  },
                });
                console.log(`📧 Sent paused notification to ${ownerEmail}`);
              } catch (emailError) {
                console.error("Failed to send paused notification:", emailError);
              }
            }

            return new Response(
              JSON.stringify({
                error: "Monthly conversation limit reached. Please upgrade your plan.",
                limitReached: true
              }),
              {
                status: 429,
                headers: {
                  "Content-Type": "application/json",
                  "Access-Control-Allow-Origin": "*",
                  "Access-Control-Allow-Methods": "POST, OPTIONS",
                  "Access-Control-Allow-Headers": "Content-Type",
                },
              }
            );
          }

          // Send warning notification at 40 conversations
          if (count !== null && count >= 40 && !notificationsSent.warning && ownerEmail) {
            try {
              await sendEmail(ownerEmail, "limit-warning", {
                conversationsUsed: count,
                conversationsLeft: 50 - count,
                userName: ownerName,
              });
              // Mark notification as sent
              await supabaseAdmin.auth.admin.updateUserById(widget.owner_id, {
                user_metadata: {
                  limit_notifications: { ...notificationsSent, warning: true },
                },
              });
              console.log(`📧 Sent warning notification to ${ownerEmail}`);
            } catch (emailError) {
              console.error("Failed to send warning notification:", emailError);
            }
          }
        }
      } catch (rateLimitError) {
        console.error("Rate limit check error:", rateLimitError);
        // If rate limit check fails, allow the request to proceed (fail open)
        // This prevents legitimate users from being blocked due to system errors
      }
    }

    // Create conversation if needed
    let convId = conversationId as string | undefined;
    if (!convId) {
      const { data, error } = await supabaseAdmin
        .from("conversations")
        .insert({
          widget_id: widgetId,
          visitor_id: visitorId ?? null,
          status: "open",
          is_test: isTest === true,
        })
        .select("id")
        .single();
      if (error || !data) throw error ?? new Error("Failed to create conversation");
      convId = data.id;
    }

    // Log user message
    const { error: e1 } = await supabaseAdmin.from("messages").insert({
      conversation_id: convId!,
      widget_id: widgetId,
      role: "user",
      content: String(message),
    });
    if (e1) throw e1;

    // Build messages for OpenAI
    const messages = await buildMessages({
      widgetId,
      conversationId: convId!,
      message: String(message)
    });

    // If streaming is requested, use streaming response
    if (stream) {
      const encoder = new TextEncoder();
      let fullReply = "";

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            const streamResponse = await openai.chat.completions.create({
              model: "gpt-4o",
              messages,
              temperature: 0.7,
              max_tokens: 500,
              stream: true,
            });

            // Send conversation ID first
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ conversationId: convId })}\n\n`)
            );

            for await (const chunk of streamResponse) {
              const content = chunk.choices[0]?.delta?.content || "";
              if (content) {
                fullReply += content;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                );
              }
            }

            // Save complete reply to database
            await supabaseAdmin.from("messages").insert({
              conversation_id: convId!,
              widget_id: widgetId,
              role: "assistant",
              content: fullReply || "I apologize, I couldn't generate a response.",
            });

            // Touch conversation
            await supabaseAdmin
              .from("conversations")
              .update({ last_msg_at: new Date().toISOString() })
              .eq("id", convId!);

            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (error) {
            console.error("Streaming error:", error);
            const errorMsg = "I'm having trouble connecting right now. Please try again in a moment.";

            // Save error message to database
            await supabaseAdmin.from("messages").insert({
              conversation_id: convId!,
              widget_id: widgetId,
              role: "assistant",
              content: errorMsg,
            });

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content: errorMsg })}\n\n`)
            );
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "X-RateLimit-Limit": rateLimit.limit.toString(),
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
        },
      });
    }

    // Non-streaming fallback (original behavior)
    try {
      const chatResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      const reply = chatResponse.choices?.[0]?.message?.content ||
        "I apologize, I couldn't generate a response.";

      // Log assistant message
      await supabaseAdmin.from("messages").insert({
        conversation_id: convId!,
        widget_id: widgetId,
        role: "assistant",
        content: reply,
      });

      // Touch conversation
      await supabaseAdmin
        .from("conversations")
        .update({ last_msg_at: new Date().toISOString() })
        .eq("id", convId!);

      return new Response(
        JSON.stringify({ conversationId: convId, reply }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "X-RateLimit-Limit": rateLimit.limit.toString(),
            "X-RateLimit-Remaining": rateLimit.remaining.toString(),
          },
        }
      );
    } catch (error) {
      console.error("OpenAI error:", error);
      const errorMsg = "I'm having trouble connecting right now. Please try again in a moment.";

      await supabaseAdmin.from("messages").insert({
        conversation_id: convId!,
        widget_id: widgetId,
        role: "assistant",
        content: errorMsg,
      });

      return new Response(
        JSON.stringify({ conversationId: convId, reply: errorMsg }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        }
      );
    }
  } catch (err: any) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: err?.message ?? "Internal error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  }
}

// Handle OPTIONS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
