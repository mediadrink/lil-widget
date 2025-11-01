"use client";

import * as React from "react";

type LilHelperButtonProps = {
  widgetId?: string; // Optional - some pages might not have a specific widget
  embedCode?: string; // Optional - embed code for installation instructions
};

type Platform = {
  id: string;
  name: string;
  icon: string;
  instructions: (embedCode: string) => string;
};

const PLATFORMS: Platform[] = [
  {
    id: "wordpress",
    name: "WordPress",
    icon: "📝",
    instructions: (code) => `**Installing on WordPress:**

1. Go to your WordPress Dashboard
2. Navigate to **Appearance → Theme Editor** (or use a plugin like "Insert Headers and Footers")
3. Find your theme's **footer.php** file (or use the plugin's footer section)
4. Paste this code before the closing \`</body>\` tag:

\`\`\`html
${code}
\`\`\`

5. Click **Update File** (or Save)
6. Visit your website to see the widget appear!

**Recommended:** Use a plugin like "Insert Headers and Footers" or "WPCode" to avoid editing theme files directly. This prevents losing the widget when you update your theme.`,
  },
  {
    id: "wix",
    name: "Wix",
    icon: "🎨",
    instructions: (code) => `**Installing on Wix:**

1. Open your Wix Editor
2. Click **Settings** in the left sidebar
3. Scroll down and click **Custom Code** (under Advanced)
4. Click **+ Add Custom Code** in the head or body section
5. Paste your widget code:

\`\`\`html
${code}
\`\`\`

6. Name it "Lil Widget Chat"
7. Choose **Load code on all pages**
8. Select **Body - End** for placement
9. Click **Apply**
10. Publish your site!

Your chat widget will now appear on all pages.`,
  },
  {
    id: "squarespace",
    name: "Squarespace",
    icon: "⬛",
    instructions: (code) => `**Installing on Squarespace:**

1. Log into your Squarespace Dashboard
2. Go to **Settings → Advanced → Code Injection**
3. Scroll to the **Footer** section
4. Paste your widget code:

\`\`\`html
${code}
\`\`\`

5. Click **Save**
6. Visit your site to see the widget!

**Note:** Code Injection is available on Business plans and higher. If you're on a Personal plan, you'll need to upgrade or use a Code Block on individual pages.`,
  },
  {
    id: "shopify",
    name: "Shopify",
    icon: "🛒",
    instructions: (code) => `**Installing on Shopify:**

1. Go to **Online Store → Themes** in your Shopify admin
2. Click **Actions** → **Edit code** on your active theme
3. Find and open **theme.liquid** in the Layout folder
4. Scroll to the bottom and paste your code before \`</body>\`:

\`\`\`html
${code}
\`\`\`

5. Click **Save**
6. Visit your store to test!

**Alternative:** Use Shopify's theme customizer if your theme supports custom code blocks.`,
  },
  {
    id: "webflow",
    name: "Webflow",
    icon: "🌊",
    instructions: (code) => `**Installing on Webflow:**

1. Open your Webflow project
2. Go to **Project Settings** (gear icon)
3. Click **Custom Code** in the left sidebar
4. Scroll to **Footer Code**
5. Paste your widget code:

\`\`\`html
${code}
\`\`\`

6. Click **Save Changes**
7. Publish your site!

The widget will appear on all pages of your site.`,
  },
  {
    id: "html",
    name: "HTML/Custom",
    icon: "💻",
    instructions: (code) => `**Installing on HTML Website:**

Add this code before the closing \`</body>\` tag in your HTML file:

\`\`\`html
${code}
\`\`\`

**Example:**
\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
</head>
<body>
  <!-- Your content here -->

  <!-- Lil Widget - Add before </body> -->
  ${code}
</body>
</html>
\`\`\`

Save the file and upload to your web server. The widget will appear on that page!`,
  },
];

export function LilHelperButton({ widgetId, embedCode }: LilHelperButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [view, setView] = React.useState<"chat" | "installation">("chat");
  const [selectedPlatform, setSelectedPlatform] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState("");
  const [reply, setReply] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(false);

  // Check if widget is installed (has received pings)
  React.useEffect(() => {
    if (!widgetId) return;

    async function checkInstallation() {
      try {
        const res = await fetch(`/api/widget/${widgetId}/installation-status`);
        if (res.ok) {
          const data = await res.json();
          setIsInstalled(data.isInstalled || false);
        }
      } catch (err) {
        console.error("Failed to check installation status:", err);
      }
    }

    checkInstallation();
  }, [widgetId]);

  async function askHelper() {
    if (!message.trim()) return;

    setLoading(true);
    setReply("");

    try {
      const res = await fetch("/api/admin-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          widget_id: widgetId || null,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to get response");
      }

      const data = await res.json();
      setReply(data?.reply || "No response received.");
    } catch (err: any) {
      setReply(`Error: ${err.message || "Something went wrong"}`);
    } finally {
      setLoading(false);
    }
  }

  function closeModal() {
    setIsOpen(false);
    setView("chat");
    setSelectedPlatform(null);
    // Don't clear message/reply immediately for better UX
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  const selectedPlatformObj = PLATFORMS.find((p) => p.id === selectedPlatform);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-amber-400 hover:bg-amber-500 text-neutral-900 rounded-full p-4 shadow-lg hover:shadow-xl transition-all hover:scale-105 z-50 flex items-center gap-2 group"
        aria-label="Ask Lil' Helper"
      >
        <span className="text-2xl">💬</span>
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap text-sm font-bold">
          Ask Lil' Helper
        </span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-neutral-900 text-white p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2">💬 Lil' Helper</h2>
                  <p className="text-sm text-neutral-300">
                    Your AI assistant for managing widgets
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-neutral-400 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setView("chat")}
                  className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    view === "chat"
                      ? "bg-amber-400 text-neutral-900"
                      : "bg-neutral-800 text-white hover:bg-neutral-700"
                  }`}
                >
                  Ask Questions
                </button>
                {embedCode && !isInstalled && (
                  <button
                    onClick={() => setView("installation")}
                    className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      view === "installation"
                        ? "bg-amber-400 text-neutral-900"
                        : "bg-neutral-800 text-white hover:bg-neutral-700"
                    }`}
                  >
                    📦 Installation Guide
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {view === "chat" ? (
                /* ASK QUESTIONS VIEW */
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-neutral-900 mb-3">
                      What do you need help with?
                    </label>
                    <textarea
                      className="w-full rounded-lg border-2 border-neutral-200 focus:border-neutral-900 focus:outline-none px-4 py-3 text-sm transition-colors resize-none"
                      rows={3}
                      placeholder="e.g., How can I improve my widget's response rate?"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey && !loading) {
                          e.preventDefault();
                          askHelper();
                        }
                      }}
                    />
                    <p className="text-xs text-neutral-600 mt-2">
                      Press Enter to send, Shift+Enter for new line
                    </p>
                  </div>

                  <button
                    onClick={askHelper}
                    disabled={loading || !message.trim()}
                    className="w-full rounded-lg bg-amber-400 hover:bg-amber-500 text-neutral-900 font-medium px-6 py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Thinking..." : "Ask Lil' Helper"}
                  </button>

                  {reply && (
                    <div className="mt-8">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">💡</span>
                        <span className="text-sm font-bold text-neutral-900">
                          Lil' Helper says:
                        </span>
                      </div>
                      <div className="bg-neutral-50 border-2 border-neutral-200 rounded-xl p-6">
                        <p className="text-sm text-neutral-900 whitespace-pre-wrap leading-relaxed">
                          {reply}
                        </p>
                      </div>
                    </div>
                  )}

                  {!reply && !loading && (
                    <div className="mt-8 bg-neutral-50 rounded-xl p-6 border border-neutral-200">
                      <p className="text-sm font-bold text-neutral-900 mb-3">
                        💡 Try asking:
                      </p>
                      <ul className="text-sm text-neutral-700 space-y-2">
                        <li>• "How can I improve lead capture?"</li>
                        <li>• "What rules should I add for better responses?"</li>
                        <li>• "How's my widget performing?"</li>
                        <li>• "Tips for writing a better persona?"</li>
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                /* INSTALLATION GUIDE VIEW */
                <>
                  {!selectedPlatform ? (
                    /* Platform Selection */
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                        Choose your website platform
                      </h3>
                      <p className="text-sm text-neutral-600 mb-4">
                        Select your platform to see step-by-step installation instructions
                      </p>

                      <div className="grid grid-cols-2 gap-4">
                        {PLATFORMS.map((platform) => (
                          <button
                            key={platform.id}
                            onClick={() => setSelectedPlatform(platform.id)}
                            className="p-6 rounded-xl border-2 border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition-all text-left"
                          >
                            <div className="text-3xl mb-2">{platform.icon}</div>
                            <div className="font-semibold text-sm text-neutral-900">
                              {platform.name}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Platform Instructions */
                    <div>
                      <button
                        onClick={() => setSelectedPlatform(null)}
                        className="text-sm text-neutral-900 hover:text-neutral-600 mb-6 flex items-center gap-1 font-medium"
                      >
                        ← Back to platforms
                      </button>

                      <div className="flex items-center gap-4 mb-6">
                        <span className="text-4xl">{selectedPlatformObj?.icon}</span>
                        <h3 className="text-2xl font-bold text-neutral-900">
                          {selectedPlatformObj?.name}
                        </h3>
                      </div>

                      <div className="prose prose-sm max-w-none">
                        {selectedPlatformObj?.instructions(embedCode || "").split("\n").map((line, idx) => {
                          if (line.startsWith("**") && line.endsWith("**")) {
                            return (
                              <h4 key={idx} className="font-bold text-neutral-900 mt-4 mb-2">
                                {line.replace(/\*\*/g, "")}
                              </h4>
                            );
                          } else if (line.startsWith("```")) {
                            return null; // Skip code fence markers
                          } else if (line.trim().startsWith("<script")) {
                            return (
                              <div key={idx} className="bg-neutral-900 text-green-400 p-3 rounded-lg text-xs font-mono my-2 overflow-x-auto">
                                {line}
                              </div>
                            );
                          } else if (line.match(/^\d+\./)) {
                            return (
                              <p key={idx} className="text-sm text-neutral-700 mb-1">
                                {line}
                              </p>
                            );
                          } else if (line.trim()) {
                            return (
                              <p key={idx} className="text-sm text-neutral-600 mb-2">
                                {line}
                              </p>
                            );
                          }
                          return null;
                        })}
                      </div>

                      {embedCode && (
                        <button
                          onClick={() => copyToClipboard(embedCode)}
                          className="mt-6 w-full rounded-lg bg-amber-400 hover:bg-amber-500 text-neutral-900 font-medium px-6 py-3 transition-colors"
                        >
                          📋 Copy Widget Code
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
