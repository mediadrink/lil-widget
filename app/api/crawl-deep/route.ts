import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// Deep crawl for paid tier - crawls multiple pages and extracts structured data
export async function POST(req: NextRequest) {
  const supabase = await supabaseServer();

  try {
    // Check authentication
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url, widgetId } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    if (!widgetId) {
      return NextResponse.json(
        { error: "Widget ID is required" },
        { status: 400 }
      );
    }

    // Verify widget ownership
    const { data: widget, error: widgetError } = await supabase
      .from("widgets")
      .select("id, owner_id, crawl_tier")
      .eq("id", widgetId)
      .single();

    if (widgetError || !widget || widget.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Widget not found or unauthorized" },
        { status: 404 }
      );
    }

    // Check if user has paid tier access
    const userTier = user.user_metadata?.subscription_tier || "free";
    if (userTier !== "paid") {
      return NextResponse.json(
        { error: "Deep crawl requires paid tier. Upgrade to access this feature." },
        { status: 403 }
      );
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
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Start deep crawl
    const crawlResult = await performDeepCrawl(normalizedUrl, widgetId);

    // Store crawled data in knowledge_base table
    const { error: kbError } = await supabase
      .from("widget_knowledge_base")
      .upsert({
        widget_id: widgetId,
        data: crawlResult,
        last_crawled_at: new Date().toISOString(),
      });

    if (kbError) {
      console.error("Failed to store knowledge base:", kbError);
    }

    const analysis = analyzeDeepCrawlResults(crawlResult);

    return NextResponse.json({
      success: true,
      message: "Deep crawl completed successfully",
      summary: generateDeepCrawlSummary(crawlResult, analysis),
      pagesAnalyzed: crawlResult.pages.length,
      dataExtracted: {
        services: crawlResult.services.length,
        team: crawlResult.team.length,
        locations: crawlResult.locations.length,
        menuItems: crawlResult.menuItems?.length || 0,
        clientWork: crawlResult.clientWork?.length || 0,
        faq: crawlResult.faq?.length || 0,
      },
      analysis,
    });
  } catch (err: any) {
    console.error("Deep crawl error:", err);
    return NextResponse.json(
      { error: err.message || "Deep crawl failed" },
      { status: 500 }
    );
  }
}

// Perform deep multi-page crawl
async function performDeepCrawl(baseUrl: string, widgetId: string) {
  const crawled = new Set<string>();
  const toVisit = [baseUrl];
  const maxPages = 10; // Limit to prevent abuse

  const result: any = {
    pages: [],
    services: [],
    team: [],
    locations: [],
    menuItems: [],
    clientWork: [],
    faq: [],
    aboutText: "",
    metadata: {},
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    while (toVisit.length > 0 && crawled.size < maxPages) {
      const currentUrl = toVisit.shift()!;
      if (crawled.has(currentUrl)) continue;

      crawled.add(currentUrl);

      try {
        const response = await fetch(currentUrl, {
          method: "GET",
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; LilWidget/1.0; +https://lilwidget.com)",
          },
          signal: controller.signal,
        });

        if (!response.ok) continue;

        const html = await response.text();

        // Extract page data
        const pageData = await extractPageData(html, currentUrl);
        result.pages.push(pageData);

        // Aggregate data
        if (pageData.services.length > 0) {
          result.services.push(...pageData.services);
        }
        if (pageData.team.length > 0) {
          result.team.push(...pageData.team);
        }
        if (pageData.menuItems.length > 0) {
          result.menuItems.push(...pageData.menuItems);
        }
        if (pageData.clientWork.length > 0) {
          result.clientWork.push(...pageData.clientWork);
        }
        if (pageData.location) {
          result.locations.push(pageData.location);
        }
        if (pageData.faqItems.length > 0) {
          result.faq.push(...pageData.faqItems);
        }

        // Find more pages to crawl from same domain
        if (crawled.size < maxPages) {
          const links = findInternalLinks(html, baseUrl);
          links.slice(0, 5).forEach(link => {
            if (!crawled.has(link) && !toVisit.includes(link)) {
              toVisit.push(link);
            }
          });
        }
      } catch (pageErr) {
        console.error(`Failed to crawl ${currentUrl}:`, pageErr);
      }
    }
  } finally {
    clearTimeout(timeoutId);
  }

  // Deduplicate and clean data
  result.services = [...new Set(result.services)].slice(0, 50);
  result.team = result.team.slice(0, 20);
  result.menuItems = result.menuItems.slice(0, 100);
  result.clientWork = result.clientWork.slice(0, 30);
  const uniqueLocationStrings = Array.from(new Set(result.locations.map((l: any) => JSON.stringify(l)))) as string[];
  result.locations = uniqueLocationStrings.map((l) => JSON.parse(l));

  return result;
}

// Extract structured data from a single page
async function extractPageData(html: string, url: string) {
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

  const data: any = {
    url,
    title: "",
    services: [],
    team: [],
    menuItems: [],
    clientWork: [],
    faqItems: [],
    location: null,
  };

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  data.title = titleMatch ? cleanText(titleMatch[1]) : "";

  // Extract services (look for various service page patterns)
  const servicePatterns = [
    /<h[2-4][^>]*>([^<]{5,100})<\/h[2-4]>/gi,
    /<div[^>]*class=["'][^"']*service[^"']*["'][^>]*><h[3-4][^>]*>([^<]+)<\/h[3-4]>/gi,
  ];

  if (url.includes("service") || html.match(/services|what we do/i)) {
    for (const pattern of servicePatterns) {
      const matches = html.match(pattern);
      if (matches) {
        data.services.push(...matches.map((m: string) => cleanText(m)).filter((s: string) => s.length > 3 && s.length < 100));
      }
    }
  }

  // Extract menu items (for restaurants)
  if (url.includes("menu") || html.match(/menu|food|drink/i)) {
    const menuPattern = /<div[^>]*class=["'][^"']*(?:menu-item|dish|food-item)[^"']*["'][^>]*>[\s\S]{0,500}?<h[3-5][^>]*>([^<]+)<\/h[3-5]>[\s\S]{0,200}?(?:<span[^>]*>([^<]+)<\/span>)?/gi;
    let match;
    while ((match = menuPattern.exec(html)) !== null) {
      data.menuItems.push({
        name: cleanText(match[1]),
        price: match[2] ? cleanText(match[2]) : null,
      });
    }
  }

  // Extract team members
  if (url.includes("team") || url.includes("about") || html.match(/our team|meet the team/i)) {
    const teamPattern = /<div[^>]*class=["'][^"']*(?:team|staff|person)[^"']*["'][^>]*>[\s\S]{0,500}?<h[3-5][^>]*>([^<]+)<\/h[3-5]>[\s\S]{0,200}?(?:<p[^>]*>([^<]{20,200})<\/p>)?/gi;
    let match;
    while ((match = teamPattern.exec(html)) !== null) {
      data.team.push({
        name: cleanText(match[1]),
        bio: match[2] ? cleanText(match[2]) : null,
      });
    }
  }

  // Extract portfolio/client work
  if (url.includes("portfolio") || url.includes("work") || url.includes("projects")) {
    const workPattern = /<div[^>]*class=["'][^"']*(?:project|portfolio|case)[^"']*["'][^>]*>[\s\S]{0,500}?<h[3-5][^>]*>([^<]+)<\/h[3-5]>/gi;
    let match;
    while ((match = workPattern.exec(html)) !== null) {
      data.clientWork.push(cleanText(match[1]));
    }
  }

  // Extract FAQ
  if (url.includes("faq") || html.match(/frequently asked questions/i)) {
    const faqPattern = /<(?:dt|h[3-5])[^>]*>([^<]{10,200})\?<\/(?:dt|h[3-5])>[\s\S]{0,500}?<(?:dd|p)[^>]*>([^<]{20,500})<\/(?:dd|p)>/gi;
    let match;
    while ((match = faqPattern.exec(html)) !== null) {
      data.faqItems.push({
        question: cleanText(match[1]),
        answer: cleanText(match[2]),
      });
    }
  }

  return data;
}

// Find internal links on the same domain
function findInternalLinks(html: string, baseUrl: string): string[] {
  const baseDomain = new URL(baseUrl).hostname;
  const links: string[] = [];

  const linkPattern = /<a[^>]*href=["']([^"']+)["']/gi;
  let match;

  while ((match = linkPattern.exec(html)) !== null) {
    try {
      let href = match[1];

      // Skip anchors, javascript, mailto, tel, etc.
      if (href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        continue;
      }

      // Convert relative URLs to absolute
      if (href.startsWith("/")) {
        href = new URL(baseUrl).origin + href;
      } else if (!href.startsWith("http")) {
        href = new URL(href, baseUrl).href;
      }

      const linkUrl = new URL(href);

      // Only include links from same domain
      if (linkUrl.hostname === baseDomain) {
        links.push(href);
      }
    } catch (err) {
      // Invalid URL, skip
    }
  }

  return [...new Set(links)]; // Deduplicate
}

// Analyze crawl results to identify what was found
function analyzeDeepCrawlResults(crawlResult: any) {
  const found: string[] = [];
  const categories = [];

  // Check services (most important for most businesses)
  if (crawlResult.services.length > 0) {
    found.push(`${crawlResult.services.length} services or offerings`);
    categories.push('services');
  }

  // Check team
  if (crawlResult.team.length > 0) {
    found.push(`${crawlResult.team.length} team member profiles`);
    categories.push('team');
  }

  // Check menu items (for restaurants)
  if (crawlResult.menuItems && crawlResult.menuItems.length > 0) {
    found.push(`${crawlResult.menuItems.length} menu items`);
    categories.push('menu');
  }

  // Check portfolio/client work
  if (crawlResult.clientWork && crawlResult.clientWork.length > 0) {
    found.push(`${crawlResult.clientWork.length} portfolio items or client projects`);
    categories.push('portfolio');
  }

  // Check FAQ
  if (crawlResult.faq.length > 0) {
    found.push(`${crawlResult.faq.length} FAQ entries`);
    categories.push('faq');
  }

  // Check locations
  if (crawlResult.locations.length > 0) {
    found.push(`${crawlResult.locations.length} location(s)`);
    categories.push('location');
  }

  // Only show helpful note if we found very little (just 1-2 categories)
  let note = null;
  if (categories.length === 0) {
    note = "No structured data was found. Your widget will rely on the basic homepage information. Consider organizing your website with clear sections like Services, About, or Contact.";
  } else if (categories.length === 1 && !categories.includes('services')) {
    note = "Limited information was extracted. Consider adding a Services or Offerings page to help your widget provide more detailed answers.";
  }

  // Completeness based only on what was found (not penalizing for irrelevant sections)
  // Scale: 0 categories = 0%, 6+ categories = 100%, with smooth progression
  const completeness = Math.min(100, Math.round((categories.length / 6) * 100));

  return {
    found,
    categories,
    note,
    completeness,
  };
}

// Generate human-readable summary of deep crawl
function generateDeepCrawlSummary(crawlResult: any, analysis: any): string {
  const parts: string[] = [];

  parts.push(`✅ **Deep Crawl Complete!**\n\nI analyzed ${crawlResult.pages.length} pages of your website and extracted detailed business information.\n\n`);

  // What was found
  if (analysis.categories.length > 0) {
    parts.push(`**📊 Information Extracted:**\n`);

    if (crawlResult.services.length > 0) {
      parts.push(`✓ **Services:** ${crawlResult.services.slice(0, 5).join(", ")}${crawlResult.services.length > 5 ? ` and ${crawlResult.services.length - 5} more` : ""}\n`);
    }

    if (crawlResult.team.length > 0) {
      parts.push(`✓ **Team:** ${crawlResult.team.length} team member${crawlResult.team.length > 1 ? "s" : ""}\n`);
    }

    if (crawlResult.menuItems && crawlResult.menuItems.length > 0) {
      parts.push(`✓ **Menu:** ${crawlResult.menuItems.length} menu items\n`);
    }

    if (crawlResult.clientWork && crawlResult.clientWork.length > 0) {
      parts.push(`✓ **Portfolio:** ${crawlResult.clientWork.length} projects/case studies\n`);
    }

    if (crawlResult.faq.length > 0) {
      parts.push(`✓ **FAQ:** ${crawlResult.faq.length} frequently asked questions\n`);
    }

    if (crawlResult.locations.length > 0) {
      parts.push(`✓ **Locations:** ${crawlResult.locations.length} location${crawlResult.locations.length > 1 ? "s" : ""}\n`);
    }
  }

  // Optional note for very limited results
  if (analysis.note) {
    parts.push(`\n💡 **Note:** ${analysis.note}\n`);
  }

  parts.push(`\n**Data Richness:** ${analysis.completeness}%\n\n`);
  parts.push(`Your widget now has access to this information as a knowledge base and can provide detailed, accurate answers to visitors!`);

  return parts.join("");
}
