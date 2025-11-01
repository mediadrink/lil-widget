import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Normalize URL - add https:// if no protocol
    let normalizedUrl = url.trim();
    if (!normalizedUrl.match(/^https?:\/\//i)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    // Validate URL format
    try {
      new URL(normalizedUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Try to fetch the website with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let response;
    try {
      response = await fetch(normalizedUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; LilWidget/1.0; +https://lilwidget.com)",
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `Website returned status ${response.status}` },
        { status: 400 }
      );
    }

    let html;
    try {
      html = await response.text();
    } catch (textErr: any) {
      console.error("Failed to read response text:", textErr);
      throw new Error("Failed to read website content");
    }

    // Helper function to clean HTML entities
    function cleanText(text: string): string {
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
    }

    // Extract comprehensive business info from HTML
    let title = "";
    let description = "";
    let wordCount = 0;
    let location = "";
    let phone = "";
    let email = "";
    let services: string[] = [];
    let aboutText = "";

    try {
      // Extract title
      let titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      title = titleMatch ? cleanText(titleMatch[1]) : "";

      // If title is empty, try H1
      if (!title || title.length < 3) {
        const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        if (h1Match) {
          title = cleanText(h1Match[1]);
        }
      }

      // Try multiple patterns for description meta tag
      let descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
      if (!descMatch) {
        descMatch = html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
      }
      if (!descMatch) {
        descMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
      }
      description = descMatch ? cleanText(descMatch[1]) : "";

      // If still no description, try to extract first meaningful paragraph
      if (!description) {
        const pMatch = html.match(/<p[^>]*>([^<]{20,200})<\/p>/i);
        if (pMatch) {
          description = cleanText(pMatch[1]).substring(0, 200);
        }
      }

      // Extract location information
      // Look for address patterns, city/state mentions
      const addressPatterns = [
        /(?:based|located|serving)\s+(?:in\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,\s*[A-Z]{2})\b/i, // "based in Portland, OR"
        /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2}(?:\s+\d{5})?)\b/g, // City, ST ZIP
        /\b([A-Z][a-z]+),\s*(Oregon|California|Washington|New York|Texas|Florida|Illinois|Pennsylvania)\b/gi, // City, Full State
        /(?:with|work with)\s+(?:amazing\s+)?([A-Z][a-z]+)\s+clients/i, // "work with Portland clients"
        /(?:in|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g, // "in Portland"
      ];

      for (const pattern of addressPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          let potentialLocation = cleanText(match[1]);

          // Check if it looks like a real city name (not generic words)
          const commonCities = ["Portland", "Seattle", "Los Angeles", "San Francisco", "New York", "Chicago", "Austin", "Denver", "Boston", "Miami", "Atlanta", "Phoenix"];
          const isValidCity = commonCities.some(city => potentialLocation.includes(city));

          if (isValidCity || potentialLocation.includes(",")) {
            // If we only have city name, try to find the state
            if (!potentialLocation.includes(",")) {
              const stateMatch = html.match(new RegExp(potentialLocation + ",?\\s*([A-Z]{2}|Oregon|California|Washington)", "i"));
              if (stateMatch && stateMatch[1]) {
                potentialLocation += `, ${stateMatch[1]}`;
              }
            }
            location = potentialLocation;
            break;
          }
        }
      }

      // If no location found yet, try Schema.org markup
      if (!location) {
        const schemaMatch = html.match(/"addressLocality":\s*"([^"]+)"[^}]*"addressRegion":\s*"([^"]+)"/);
        if (schemaMatch) {
          location = `${schemaMatch[1]}, ${schemaMatch[2]}`;
        }
      }

      // Extract phone number
      const phonePatterns = [
        /tel:(\d{10})/i, // tel:5037201058
        /tel:([\d\-\(\)\s\.]+)/i, // tel: with formatting
        /\b(\d{3}[-.\s]\d{3}[-.\s]\d{4})\b/g, // 503-720-1058
        /\((\d{3})\)\s*(\d{3})[-.\s]?(\d{4})/g, // (503) 720-1058
        /\b(\d{10})\b/g, // 5037201058
      ];

      for (const pattern of phonePatterns) {
        const match = html.match(pattern);
        if (match) {
          let phoneRaw = match[1] || match[0];
          // Format phone number nicely
          const digits = phoneRaw.replace(/\D/g, "");
          if (digits.length === 10) {
            phone = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
          } else {
            phone = phoneRaw;
          }
          break;
        }
      }

      // Extract email
      const emailMatch = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        email = emailMatch[0];
      }

      // Extract services - look for common patterns with more flexible matching
      const servicesSectionPatterns = [
        /<(?:section|div)[^>]*(?:class|id)=["'][^"']*(?:services|what-we-do|offerings|expertise|capabilities)[^"']*["'][^>]*>([\s\S]{0,5000})<\/(?:section|div)>/i,
        /<h[2-3][^>]*>(?:Services|What We Do|Our Services|Expertise|Capabilities)<\/h[2-3]>([\s\S]{0,3000})(?:<\/section|<section)/i,
      ];

      for (const pattern of servicesSectionPatterns) {
        const sectionMatch = html.match(pattern);
        if (sectionMatch) {
          const servicesHtml = sectionMatch[1];

          // Extract list items
          let serviceMatches = servicesHtml.match(/<li[^>]*>([^<]{5,100})<\/li>/gi);

          // If no list items, try h2-h4 headings
          if (!serviceMatches || serviceMatches.length === 0) {
            serviceMatches = servicesHtml.match(/<h[2-4][^>]*>([^<]{5,100})<\/h[2-4]>/gi);
          }

          // If still nothing, try divs with class containing "service" or "item"
          if (!serviceMatches || serviceMatches.length === 0) {
            serviceMatches = servicesHtml.match(/<div[^>]*class=["'][^"']*(?:service|item)[^"']*["'][^>]*>([^<]{5,100})/gi);
          }

          if (serviceMatches && serviceMatches.length > 0) {
            services = serviceMatches
              .map((s) => cleanText(s))
              .filter((s) => s.length > 3 && s.length < 100)
              .filter((s) => !s.match(/^(read more|learn more|click here|view|see)$/i)) // Filter out navigation text
              .slice(0, 10); // Limit to 10 services
            break;
          }
        }
      }

      // Extract about/story text - try multiple patterns
      const aboutSectionPatterns = [
        /<(?:section|div)[^>]*(?:class|id)=["'][^"']*(?:about|story|history|who-we-are|post-content)[^"']*["'][^>]*>([\s\S]{0,2000})<\/(?:section|div)>/i,
        /<div[^>]*class=["'][^"']*post-content[^"']*["'][^>]*>\s*([^<]{50,500})\s*<\/div>/i,
      ];

      for (const pattern of aboutSectionPatterns) {
        const aboutMatch = html.match(pattern);
        if (aboutMatch) {
          const aboutHtml = aboutMatch[1];

          // Try to extract paragraphs first
          const paragraphs = aboutHtml.match(/<p[^>]*>([^<]{50,500})<\/p>/gi);
          if (paragraphs && paragraphs.length > 0) {
            aboutText = paragraphs
              .map((p) => cleanText(p))
              .filter((p) => p.length > 50)
              .slice(0, 3)
              .join(" ")
              .substring(0, 500);
            break;
          }

          // If no paragraphs, just use the text content directly
          const cleanedAbout = cleanText(aboutHtml);
          if (cleanedAbout.length > 50) {
            aboutText = cleanedAbout.substring(0, 500);
            break;
          }
        }
      }

      // Count approximate word count
      const textContent = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
      wordCount = textContent.split(" ").length;

      console.log("Extracted metadata:", {
        title,
        description: description?.substring(0, 100),
        location,
        phone,
        email,
        servicesCount: services.length,
        aboutLength: aboutText.length,
        wordCount,
      });
    } catch (parseErr: any) {
      console.error("Failed to parse HTML:", parseErr);
      // Continue with empty values
    }

    // Build technical summary
    const parts = [`Successfully analyzed ${normalizedUrl}`];

    if (title) {
      parts.push(`\n\nPage Title: ${title}`);
    }
    if (description) {
      const truncDesc = description.length > 200 ? description.substring(0, 200) + "..." : description;
      parts.push(`\n\nDescription: ${truncDesc}`);
    }
    if (wordCount > 0) {
      parts.push(`\n\nEstimated Content: ~${Math.round(wordCount / 100) * 100} words`);
    }

    const summary = parts.join("");

    // Generate comprehensive learning statement and business description
    let learningStatement = "";
    let businessDescription = "";
    const detailsParts: string[] = [];

    if (title || description) {
      businessDescription = description || title || "your website";

      // Build a comprehensive learning statement
      learningStatement = `Great! I analyzed your website and here's what I learned:\n\n`;

      if (title) {
        learningStatement += `**About:** ${title}`;
        if (description) {
          learningStatement += ` - ${description}`;
        }
        learningStatement += `\n\n`;
      }

      if (location) {
        learningStatement += `**Location:** ${location}\n\n`;
        detailsParts.push(`located in ${location}`);
      }

      if (services.length > 0) {
        learningStatement += `**Services/Offerings:** ${services.slice(0, 5).join(", ")}`;
        if (services.length > 5) {
          learningStatement += `, and ${services.length - 5} more`;
        }
        learningStatement += `\n\n`;
        detailsParts.push(`offering services like ${services.slice(0, 3).join(", ")}`);
      }

      if (aboutText) {
        learningStatement += `**Company Story:** ${aboutText.substring(0, 200)}${aboutText.length > 200 ? "..." : ""}\n\n`;
      }

      if (phone) {
        learningStatement += `**Contact:** ${phone}`;
        if (email) {
          learningStatement += ` | ${email}`;
        }
        learningStatement += `\n\n`;
      } else if (email) {
        learningStatement += `**Contact:** ${email}\n\n`;
      }

      learningStatement += `I'll use this information to help create a personalized widget for your business.`;
    } else {
      learningStatement = "I successfully crawled your website. While I couldn't extract detailed information, I'm ready to help you set up your widget.";
      businessDescription = "your website";
    }

    return NextResponse.json({
      success: true,
      summary,
      learningStatement,
      normalizedUrl,
      businessDescription,
      metadata: {
        title,
        description,
        wordCount,
        location,
        phone,
        email,
        services,
        aboutText,
      },
    });
  } catch (err: any) {
    console.error("Crawl error details:", {
      name: err.name,
      message: err.message,
      cause: err.cause,
      stack: err.stack,
    });

    if (err.name === "AbortError" || err.message?.includes("aborted")) {
      return NextResponse.json(
        { error: "Website took too long to respond (timeout). Please try again." },
        { status: 504 }
      );
    }

    if (err.message?.includes("fetch failed") || err.cause?.code === "ENOTFOUND") {
      return NextResponse.json(
        { error: "Could not connect to website. Please check the URL and try again." },
        { status: 400 }
      );
    }

    if (err.cause?.code === "ECONNREFUSED") {
      return NextResponse.json(
        { error: "Website refused connection. Please verify the URL." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: `Crawl failed: ${err.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}
