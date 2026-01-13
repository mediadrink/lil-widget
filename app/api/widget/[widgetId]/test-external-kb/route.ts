import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ widgetId: string }> }
) {
  try {
    const body = await request.json();
    const { url, apiKey } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: "API URL is required" },
        { status: 400 }
      );
    }

    // Test the external API with a simple question
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ question: "Hello, this is a connection test." }),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      return NextResponse.json(
        {
          success: false,
          error: `API returned ${response.status}: ${errorText.substring(0, 200)}`,
        },
        { status: 200 }
      );
    }

    const data = await response.json();

    // Validate response format
    if (typeof data.answer !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid response format: missing "answer" field',
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Connection successful",
    });
  } catch (error: any) {
    console.error("External KB test error:", error);

    let errorMessage = "Connection failed";
    if (error.name === "AbortError") {
      errorMessage = "Connection timed out (10s)";
    } else if (error.message?.includes("fetch")) {
      errorMessage = "Could not reach the API URL";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 200 }
    );
  }
}
