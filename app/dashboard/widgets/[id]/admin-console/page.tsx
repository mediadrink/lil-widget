// app/dashboard/widgets/[id]/admin-console/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LilHelperButton } from "@/components/LilHelperButton";
import { SuccessChecklist } from "@/components/SuccessChecklist";
import { TooltipIcon } from "@/components/Tooltip";
import { getAvailablePresets, resolveWidgetStyle } from "@/lib/widgetStyles";

type WidgetCustomization = {
  primaryColor: string;
  userMsgColor: string;
  assistantMsgColor: string;
  assistantMsgBorder: string;
  widgetBg: string;
  borderRadius: string;
  fontFamily: string;
  headerText: string;
  headerIcon?: string;
  buttonHoverColor: string;
  inputBorderColor: string;
  inputFocusColor: string;
};

type Widget = {
  id: string;
  title: string;
  url: string;
  persona_text?: string;
  style?: string;
  position?: string;
  customization?: WidgetCustomization | null;
  logo_url?: string | null;
  crawl_tier?: string;
  owner_id?: string;
  kb_type?: string;
  external_kb_url?: string | null;
  external_kb_api_key?: string | null;
};

type Rule = {
  id: string;
  text: string;
  version?: string | number | null;
  created_at?: string;
};

function cx(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// Parse markdown for preview widget (matches widget.js implementation)
function parseMarkdown(text: string): string {
  if (!text) return '';
  let html = text;

  // Escape HTML for XSS protection
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold: **text**
  html = html.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');

  // Italic: *text*
  html = html.replace(/\*([^*\n]+?)\*/g, '<em>$1</em>');

  // Lists before line breaks
  html = html.replace(/^[\-\*•]\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li style="list-style-type: decimal;">$1</li>');

  // Line breaks
  html = html.replace(/\n\n/g, '</p><p style="margin: 0.5em 0;">');
  html = html.replace(/\n/g, '<br>');

  // Wrap lists
  html = html.replace(/(<li[^>]*>[\s\S]*?<\/li>(?:<br>|<br\/>|\s)*)+/g, function(match) {
    const cleanedMatch = match.replace(/<br\s*\/?>/g, '');
    if (match.includes('list-style-type: decimal')) {
      return '<ol style="margin: 0.5em 0; padding-left: 1.5em;">' + cleanedMatch + '</ol>';
    } else {
      return '<ul style="margin: 0.5em 0; padding-left: 1.5em; list-style-type: disc;">' + cleanedMatch + '</ul>';
    }
  });

  return html;
}

async function fetchJSON<T = any>(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j?.error || msg;
    } catch {}
    throw new Error(msg);
  }
  try {
    return (await res.json()) as T;
  } catch {
    return {} as T; // 204 etc.
  }
}

export default function AdminConsolePage(
  props: { params: Promise<{ id: string }> } // params is a Promise in Next 15 (React 19)
) {
  // ✅ unwrap params with React.use()
  const { id: widgetId } = React.use(props.params);

  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [genBusy, setGenBusy] = React.useState(false);
  const [chatBusy, setChatBusy] = React.useState(false);
  const [crawlBusy, setCrawlBusy] = React.useState(false);
  const [uploadingLogo, setUploadingLogo] = React.useState(false);
  const [deepCrawlBusy, setDeepCrawlBusy] = React.useState(false);
  const [knowledgeBase, setKnowledgeBase] = React.useState<any>(null);
  const [userTier, setUserTier] = React.useState<string>("free");
  const [testingExternalKB, setTestingExternalKB] = React.useState(false);
  const [externalKBStatus, setExternalKBStatus] = React.useState<"connected" | "error" | null>(null);

  // Edit mode states
  const [editingBasicInfo, setEditingBasicInfo] = React.useState(false);
  const [editingPersona, setEditingPersona] = React.useState(false);
  const [tempWidget, setTempWidget] = React.useState<Widget | null>(null);

  const [widget, setWidget] = React.useState<Widget>({
    id: widgetId,
    title: "",
    url: "",
    persona_text: "",
    style: "preset-modern",
    position: "bottom-right",
    customization: null,
    logo_url: null,
    kb_type: "crawl",
    external_kb_url: null,
    external_kb_api_key: null,
  });

  const [analyzingSite, setAnalyzingSite] = React.useState(false);

  // Resolve current widget customization for preview
  const currentCustomization = React.useMemo(
    () => resolveWidgetStyle(widget.style, widget.customization),
    [widget.style, widget.customization]
  );

  // Load Google Font for preview when customization changes
  React.useEffect(() => {
    const fontFamily = currentCustomization.fontFamily;
    if (!fontFamily) return;

    // Extract first font name
    const fontMatch = fontFamily.match(/^['"]?([^'",]+)/);
    if (!fontMatch) return;

    const fontName = fontMatch[1].trim();

    // Skip system fonts
    const systemFonts = ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif', 'serif', 'monospace'];
    if (systemFonts.some(sf => fontName.toLowerCase() === sf.toLowerCase())) return;

    // Check if already loaded
    const existingLink = document.querySelector(`link[href*="${fontName.replace(/\s+/g, '+')}"]`);
    if (existingLink) return;

    // Load from Google Fonts
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@400;500;600;700&display=swap`;
    document.head.appendChild(link);
  }, [currentCustomization.fontFamily]);

  const [rules, setRules] = React.useState<Rule[]>([]);
  const [newRule, setNewRule] = React.useState("");
  const [editingRuleId, setEditingRuleId] = React.useState<string | null>(null);
  const [editingRuleText, setEditingRuleText] = React.useState("");

  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [helperMsg, setHelperMsg] = React.useState("");
  const [helperReply, setHelperReply] = React.useState("");

  const [previewMsg, setPreviewMsg] = React.useState("");
  const [previewConversation, setPreviewConversation] = React.useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [previewConvId, setPreviewConvId] = React.useState<string | null>(null);

  const [dailySummary, setDailySummary] = React.useState<string>("");
  const [summaryLoading, setSummaryLoading] = React.useState(false);
  const [summaryConvCount, setSummaryConvCount] = React.useState<number>(0);

  const [toast, setToast] = React.useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  function showSuccessToast(message: string) {
    setToast({ message, type: "success" });
    setTimeout(() => setToast(null), 3000);
  }

  function showErrorToast(message: string) {
    setToast({ message, type: "error" });
    setTimeout(() => setToast(null), 5000);
  }

  function showInfoToast(message: string) {
    setToast({ message, type: "info" });
    setTimeout(() => setToast(null), 3000);
  }

  // 🔧 Embed origin (avoid SSR/CSR mismatch)
  const [embedOrigin, setEmbedOrigin] = React.useState<string>("");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      // Always use window.location.origin in browser to ensure correct URL
      // This works for both dev (localhost:3000) and production (lilwidget.com)
      setEmbedOrigin(window.location.origin);
    }
  }, []);

  React.useEffect(() => {
    (async () => {
      try {
        // Load widget
        const w = await fetchJSON<Widget>(`/api/widgets/${widgetId}`, {
          method: "GET",
          cache: "no-store",
        }).catch(() => ({ id: widgetId, title: "", url: "" } as Widget));
        setWidget((prev) => ({
          ...prev,
          title: w?.title ?? "",
          url: w?.url ?? "",
          persona_text: w?.persona_text ?? "",
          style: w?.style ?? "preset-modern",
          position: w?.position ?? "bottom-right",
          customization: w?.customization ?? null,
          crawl_tier: w?.crawl_tier ?? "basic",
          owner_id: w?.owner_id,
          logo_url: w?.logo_url,
          kb_type: w?.kb_type ?? "crawl",
          external_kb_url: w?.external_kb_url ?? null,
          external_kb_api_key: w?.external_kb_api_key ?? null,
        }));

        // Load rules
        const r = await fetchJSON<{ rules: Rule[] }>(
          `/api/widget/${widgetId}/rules`,
          { method: "GET", cache: "no-store" }
        ).catch(() => ({ rules: [] }));
        setRules(r?.rules ?? []);

        // Load user tier
        try {
          const userRes = await fetchJSON<{ user: any }>(`/api/auth/user`);
          setUserTier(userRes?.user?.user_metadata?.subscription_tier || "free");
        } catch (err) {
          console.error("Failed to load user tier:", err);
        }

        // Load knowledge base if crawl tier is deep
        if (w?.crawl_tier === "deep") {
          try {
            const kbRes = await fetchJSON<{ data: any }>(
              `/api/widget/${widgetId}/knowledge-base`
            );
            setKnowledgeBase(kbRes?.data || null);
          } catch (err) {
            console.error("Failed to load knowledge base:", err);
          }
        }

        // Load daily summary
        loadDailySummary();
      } catch (err: any) {
        showErrorToast(`Load failed: ${err.message || String(err)}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [widgetId]);

  async function loadDailySummary() {
    setSummaryLoading(true);
    try {
      const res = await fetchJSON<{
        summary: string;
        conversationCount: number;
      }>(`/api/widgets/${widgetId}/summary`, {
        method: "GET",
        cache: "no-store",
      });
      setDailySummary(res?.summary || "");
      setSummaryConvCount(res?.conversationCount || 0);
    } catch (err: any) {
      setDailySummary("Unable to load daily summary.");
      console.error("Summary load error:", err);
    } finally {
      setSummaryLoading(false);
    }
  }

  function copyEmbed() {
    const origin = embedOrigin || "https://yourdomain.com";
    const snippet = `<script src="${origin}/widget.js" data-id="${widgetId}" data-base-url="${origin}"></script>`;
    navigator.clipboard.writeText(snippet).then(
      () => showSuccessToast("📋 Embed code copied to clipboard!"),
      () => showErrorToast("Could not copy embed code.")
    );
  }

  async function saveWidget(partialUpdate?: Partial<Widget>) {
    setSaving(true);
    try {
      const updates = partialUpdate || {
        title: widget.title,
        url: widget.url,
        persona_text: widget.persona_text,
        style: widget.style,
        position: widget.position,
        customization: widget.customization,
      };

      await fetchJSON(`/api/widgets/${widgetId}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });

      if (!partialUpdate) {
        showSuccessToast("✅ Widget saved successfully!");
        setEditingBasicInfo(false);
        setEditingPersona(false);
        setTempWidget(null);
      }
    } catch (err: any) {
      showErrorToast(`Save failed: ${err.message || String(err)}`);
    } finally {
      setSaving(false);
    }
  }

  function startEditBasicInfo() {
    setTempWidget({ ...widget });
    setEditingBasicInfo(true);
  }

  function cancelEditBasicInfo() {
    if (tempWidget) {
      setWidget(tempWidget);
    }
    setEditingBasicInfo(false);
    setTempWidget(null);
  }

  function startEditPersona() {
    setTempWidget({ ...widget });
    setEditingPersona(true);
  }

  function cancelEditPersona() {
    if (tempWidget) {
      setWidget(tempWidget);
    }
    setEditingPersona(false);
    setTempWidget(null);
  }

  async function saveBasicInfo() {
    await saveWidget();
  }

  async function savePersona() {
    await saveWidget();
  }

  async function addRule() {
    const text = newRule.trim();
    if (!text) return;
    const optimistic: Rule = { id: `tmp-${Date.now()}`, text };
    setRules((r) => [optimistic, ...r]);
    setNewRule("");
    try {
      const res = await fetchJSON<{ rule: Rule }>(
        `/api/widget/${widgetId}/rules`,
        {
          method: "POST",
          body: JSON.stringify({ text }),
        }
      );
      setRules((r) => r.map((x) => (x.id === optimistic.id ? res.rule : x)));
      showSuccessToast("✅ Rule added successfully!");
    } catch (err: any) {
      setRules((r) => r.filter((x) => x.id !== optimistic.id));
      showErrorToast(`Failed to add rule: ${err.message || String(err)}`);
    }
  }

  function startEditRule(rule: Rule) {
    setEditingRuleId(rule.id);
    setEditingRuleText(rule.text);
  }
  function cancelEditRule() {
    setEditingRuleId(null);
    setEditingRuleText("");
  }
  async function saveRuleEdit() {
    if (!editingRuleId) return;
    const text = editingRuleText.trim();
    if (!text) return;
    const original = rules.find((r) => r.id === editingRuleId);
    setRules((r) => r.map((x) => (x.id === editingRuleId ? { ...x, text } : x)));
    try {
      await fetchJSON(
        `/api/widget/${widgetId}/rules/${encodeURIComponent(editingRuleId)}`,
        { method: "PUT", body: JSON.stringify({ text }) }
      );
      showSuccessToast("✅ Rule updated!");
      cancelEditRule();
    } catch (err: any) {
      setRules((r) =>
        r.map((x) => (x.id === editingRuleId ? (original as Rule) : x))
      );
      showErrorToast(`Update failed: ${err.message || String(err)}`);
    }
  }

  async function deleteRule(ruleId: string) {
    const original = rules;
    setRules((r) => r.filter((x) => x.id !== ruleId));
    try {
      await fetchJSON(
        `/api/widget/${widgetId}/rules/${encodeURIComponent(ruleId)}`,
        { method: "DELETE" }
      );
      showSuccessToast("🗑️ Rule deleted");
    } catch (err: any) {
      setRules(original);
      showErrorToast(`Delete failed: ${err.message || String(err)}`);
    }
  }

  async function generateFromSite() {
    if (!widget.url) {
      showInfoToast("⚠️ Enter your Widget URL first");
      return;
    }
    setCrawlBusy(true);
    try {
      // Step 1: Crawl the website to get metadata
      const crawlRes = await fetchJSON<{
        success?: boolean;
        metadata?: any;
        summary?: string;
      }>(
        `/api/crawl-summary`,
        { method: "POST", body: JSON.stringify({ url: widget.url }) }
      );

      if (!crawlRes?.success) {
        showInfoToast("Could not analyze website");
        return;
      }

      // Step 2: Generate AI persona from crawled data
      // Try to infer industry from widget title or default to "custom"
      const inferredIndustry = "custom"; // Could enhance this later with AI

      const personaRes = await fetchJSON<{
        persona?: string;
        success?: boolean;
        error?: string;
      }>(
        `/api/generate-persona`,
        {
          method: "POST",
          body: JSON.stringify({
            widgetName: widget.title || "Business",
            websiteUrl: widget.url,
            industry: inferredIndustry,
            crawlType: "basic",
            crawledData: crawlRes.metadata || null,
          })
        }
      );

      if (personaRes?.persona) {
        setWidget((w) => ({ ...w, persona_text: personaRes.persona }));
        showSuccessToast("✨ AI persona generated from your website!");
      } else {
        showErrorToast(personaRes?.error || "Failed to generate persona");
      }
    } catch (err: any) {
      showErrorToast(`Generate failed: ${err.message || String(err)}`);
    } finally {
      setCrawlBusy(false);
    }
  }

  async function runDeepCrawl() {
    if (!widget.url) {
      showInfoToast("⚠️ Enter your Widget URL first");
      return;
    }

    setDeepCrawlBusy(true);
    try {
      const res = await fetchJSON<{
        success?: boolean;
        summary?: string;
        pagesAnalyzed?: number;
        dataExtracted?: any;
        analysis?: any;
      }>(
        `/api/crawl-deep`,
        {
          method: "POST",
          body: JSON.stringify({ url: widget.url, widgetId: widget.id })
        }
      );

      if (res?.success) {
        // Update crawl tier to deep
        setWidget((w) => ({ ...w, crawl_tier: "deep" }));

        // Reload knowledge base
        const kbRes = await fetchJSON<{ data: any }>(
          `/api/widget/${widget.id}/knowledge-base`
        );
        setKnowledgeBase(kbRes?.data || null);

        showSuccessToast(
          `✨ Expanded crawl complete! Analyzed ${res.pagesAnalyzed || 0} pages and extracted detailed business information.`
        );
      } else {
        showErrorToast("Expanded crawl failed");
      }
    } catch (err: any) {
      showErrorToast(`Expanded crawl failed: ${err.message || String(err)}`);
    } finally {
      setDeepCrawlBusy(false);
    }
  }

  async function testExternalKB() {
    if (!widget.external_kb_url) {
      showInfoToast("Enter an API URL first");
      return;
    }
    setTestingExternalKB(true);
    setExternalKBStatus(null);
    try {
      const res = await fetchJSON<{ success: boolean; error?: string }>(
        `/api/widget/${widgetId}/test-external-kb`,
        {
          method: "POST",
          body: JSON.stringify({
            url: widget.external_kb_url,
            apiKey: widget.external_kb_api_key,
          }),
        }
      );
      if (res?.success) {
        setExternalKBStatus("connected");
        showSuccessToast("External API connected successfully!");
      } else {
        setExternalKBStatus("error");
        showErrorToast(res?.error || "Failed to connect to external API");
      }
    } catch (err: any) {
      setExternalKBStatus("error");
      showErrorToast(`Connection failed: ${err.message || String(err)}`);
    } finally {
      setTestingExternalKB(false);
    }
  }

  async function generateSuggestions() {
    setGenBusy(true);
    setHelperReply("");
    setSuggestions([]);
    try {
      const res = await fetchJSON<{ reply?: string }>(`/api/admin-assistant`, {
        method: "POST",
        body: JSON.stringify({
          message: "Suggest 3–5 actionable rules to improve tone, safety, routing, and lead capture.",
          widget_id: widgetId
        }),
      });
      const reply = res?.reply?.trim() || "";
      setHelperReply(reply);

      // Parse numbered list items as suggestions
      const lines =
        reply
          .split("\n")
          .map((l) => l.replace(/^[-*•]\s*/, "").trim())
          .filter((l) => /^\d+\./.test(l)) // Only lines that start with numbers
          .map((l) => l.replace(/^\d+\.\s*/, "")) // Remove the number prefix
          .filter(Boolean);

      setSuggestions(lines.slice(0, 10));
      showSuccessToast("💡 Rule suggestions generated!");
    } catch (err: any) {
      showErrorToast(`Failed to generate suggestions: ${err.message || String(err)}`);
    } finally {
      setGenBusy(false);
    }
  }

  async function addSuggestionToRules(text: string) {
    const optimistic: Rule = { id: `tmp-${Date.now()}`, text };
    setRules((r) => [optimistic, ...r]);
    try {
      const res = await fetchJSON<{ rule: Rule }>(
        `/api/widget/${widgetId}/rules`,
        { method: "POST", body: JSON.stringify({ text }) }
      );
      setRules((r) =>
        r.map((x) => (x.id === optimistic.id ? res.rule : x))
      );
      showSuccessToast("✅ Suggestion added to rules!");
    } catch (err: any) {
      setRules((r) => r.filter((x) => x.id !== optimistic.id));
      showErrorToast(`Add failed: ${err.message || String(err)}`);
    }
  }

  async function previewChatSend() {
    const msg = previewMsg.trim();
    if (!msg) return;
    setChatBusy(true);

    // Add user message to conversation
    setPreviewConversation((prev) => [...prev, { role: "user", content: msg }]);
    setPreviewMsg("");

    // Add empty assistant message for streaming
    const messageIndex = previewConversation.length + 1; // +1 for the user message we just added
    setPreviewConversation((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch(`/api/widget/${widgetId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          conversationId: previewConvId || undefined,
          isTest: true, // Mark as test conversation
          stream: true, // Enable streaming
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      // Handle streaming response
      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let fullReply = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              break;
            }

            try {
              const parsed = JSON.parse(data);

              // Store conversation ID
              if (parsed.conversationId && !previewConvId) {
                setPreviewConvId(parsed.conversationId);
              }

              // Append content to assistant message
              if (parsed.content) {
                fullReply += parsed.content;
                setPreviewConversation((prev) => {
                  const updated = [...prev];
                  updated[messageIndex] = {
                    role: "assistant",
                    content: fullReply,
                  };
                  return updated;
                });
              }
            } catch (e) {
              // Ignore parse errors for partial chunks
            }
          }
        }
      }
    } catch (err: any) {
      showErrorToast(`Chat failed: ${err.message || String(err)}`);
      // Remove both the user message and empty assistant message if failed
      setPreviewConversation((prev) => prev.slice(0, -2));
    } finally {
      setChatBusy(false);
    }
  }

  function clearPreviewChat() {
    setPreviewConversation([]);
    setPreviewConvId(null);
    setPreviewMsg("");
  }

  const conversationsHref = `/dashboard/widgets/${widgetId}/conversations`;
  const settingsHref = `/dashboard/widgets/${widgetId}/admin-console`;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Minimal Top Navigation */}
      <div className="bg-white border-b border-neutral-200">
        <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-neutral-700">Lil' Widget</div>
          </div>
          <div className="flex items-center gap-1">
            <a
              className="text-xs font-medium text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded transition-colors"
              href="/dashboard/widgets"
            >
              My Widgets
            </a>
            <a
              className="text-xs font-medium text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded transition-colors"
              href="/dashboard/account"
            >
              Account
            </a>
          </div>
        </div>
      </div>

      {/* Widget Header - Main Focus */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 shadow-lg">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-xl">
              {widget.title?.[0]?.toUpperCase() || "W"}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                {widget.title || "Untitled Widget"}
              </h1>
              <p className="text-sm text-white/80 font-medium">
                Widget Dashboard
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              className="text-sm font-semibold text-white/80 hover:text-white px-5 py-2.5 rounded-lg hover:bg-white/10 transition-all duration-200"
              href={conversationsHref}
            >
              📊 Activity
            </a>
            <a
              className="relative text-sm font-semibold text-white px-5 py-2.5 rounded-lg transition-all duration-200 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-white after:rounded-full"
              href={settingsHref}
            >
              ⚙️ Settings
            </a>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Success Checklist */}
        {!loading && (
          <div className="mb-6">
            <SuccessChecklist widgetId={widgetId} />
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN - Basic Info & Settings */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Header Section - Widget Title & URL */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
              {!editingBasicInfo ? (
                /* VIEW MODE */
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-neutral-900 mb-1">
                        {widget.title || "Untitled Widget"}
                      </h2>
                      {widget.url && (
                        <a
                          href={widget.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {widget.url}
                        </a>
                      )}
                      {!widget.url && (
                        <p className="text-sm text-neutral-400 italic">No website URL set</p>
                      )}
                    </div>
                    <button
                      onClick={startEditBasicInfo}
                      className="rounded-lg border-2 border-neutral-900 px-3 py-1.5 text-sm text-neutral-900 font-medium hover:bg-neutral-50 transition-colors flex items-center gap-1"
                    >
                      <span>✏️</span>
                      <span>Edit</span>
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        document
                          .getElementById("preview-chat-section")
                          ?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className="rounded-lg bg-amber-400 hover:bg-amber-500 text-neutral-900 font-medium px-6 py-2.5 transition-colors"
                    >
                      🧪 Test Widget
                    </button>
                    <button
                      onClick={copyEmbed}
                      className="rounded-lg border-2 border-neutral-900 text-neutral-900 font-medium px-6 py-2.5 hover:bg-neutral-50 transition-colors"
                    >
                      Copy Embed Code
                    </button>
                  </div>
                </div>
              ) : (
                /* EDIT MODE */
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Widget Title</label>
                    <input
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                      placeholder="My Widget"
                      value={widget.title}
                      onChange={(e) =>
                        setWidget((w) => ({ ...w, title: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Website URL</label>
                    <input
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                      placeholder="https://example.com"
                      value={widget.url}
                      onChange={(e) =>
                        setWidget((w) => ({ ...w, url: e.target.value }))
                      }
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={saveBasicInfo}
                      disabled={saving}
                      className="rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium px-6 py-2.5 disabled:opacity-50 transition-colors"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={cancelEditBasicInfo}
                      className="rounded-lg border-2 border-neutral-900 text-neutral-900 font-medium px-6 py-2.5 hover:bg-neutral-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Daily Summary */}
            <section className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="text-lg font-bold text-neutral-900">
                    📊 Daily Summary
                  </div>
                  <TooltipIcon
                    content="AI-generated insights from your widget conversations in the last 24 hours. Shows common questions, trends, and recommended actions."
                    position="right"
                  />
                </div>
                <button
                  onClick={loadDailySummary}
                  disabled={summaryLoading}
                  className="rounded-lg bg-amber-400 hover:bg-amber-500 text-neutral-900 font-medium px-4 py-2 disabled:opacity-50 transition-colors text-sm"
                >
                  {summaryLoading ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              {summaryLoading ? (
                <div className="text-sm text-neutral-600 animate-pulse">
                  Analyzing your conversations...
                </div>
              ) : (
                <>
                  <div className="text-sm text-neutral-700 leading-relaxed mb-3 whitespace-pre-wrap">
                    {dailySummary || "Loading your daily summary..."}
                  </div>
                  {summaryConvCount > 0 && (
                    <div className="flex gap-2 text-xs text-neutral-700">
                      <span className="bg-neutral-100 text-neutral-700 rounded-full px-3 py-1 font-medium">
                        {summaryConvCount} conversation{summaryConvCount !== 1 ? "s" : ""} in last 24h
                      </span>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* Persona */}
            <section className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="text-lg font-bold text-neutral-900">
                    🎭 Widget Personality
                  </div>
                  <TooltipIcon
                    content="Define how your widget talks to visitors. This controls the tone, style, and behavior of AI responses."
                    position="right"
                  />
                </div>
                {!editingPersona && (
                  <button
                    onClick={startEditPersona}
                    className="rounded-lg border-2 border-neutral-900 px-3 py-1.5 text-sm text-neutral-900 font-medium hover:bg-neutral-50 transition-colors flex items-center gap-1"
                  >
                    <span>✏️</span>
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {!editingPersona ? (
                /* VIEW MODE */
                <div>
                  {widget.persona_text ? (
                    <div className="bg-neutral-50 rounded-lg p-4 border">
                      <p className="text-sm text-neutral-700 whitespace-pre-wrap">
                        {widget.persona_text}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-neutral-50 rounded-lg p-4 border text-center">
                      <p className="text-sm text-neutral-400 italic">
                        No personality defined yet. Click "Edit" to add one.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* EDIT MODE */
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-neutral-500">
                      Describe how your widget should talk to visitors.
                    </p>
                    <button
                      onClick={generateFromSite}
                      disabled={crawlBusy || !widget.url}
                      className="text-xs rounded-md border px-3 py-1 hover:bg-neutral-100 disabled:opacity-50"
                    >
                      {crawlBusy ? "Generating..." : "Generate from site"}
                    </button>
                  </div>
                  <textarea
                    className="w-full min-h-[140px] rounded-lg border px-3 py-2 text-sm"
                    placeholder="Example: You are an AI assistant for a law firm. Be professional, empathetic, and authoritative. Never give specific legal advice - always recommend scheduling a consultation."
                    value={widget.persona_text}
                    onChange={(e) =>
                      setWidget((w) => ({ ...w, persona_text: e.target.value }))
                    }
                  />
                  <details className="mt-2 mb-3">
                    <summary className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer">
                      💡 Tips for great personas
                    </summary>
                    <div className="mt-2 text-xs text-neutral-600 space-y-1 pl-4">
                      <p>• <strong>Tone:</strong> friendly, professional, empathetic, witty, authoritative, simple</p>
                      <p>• <strong>Style:</strong> brief, detailed, conversational, formal, technical</p>
                      <p>• <strong>Guardrails:</strong> "Never give medical advice", "Always recommend booking a call"</p>
                      <p>• <strong>Routing:</strong> "For pricing, direct to contact@example.com", "For urgent matters, share (555) 123-4567"</p>
                    </div>
                  </details>
                  <div className="flex gap-2">
                    <button
                      onClick={savePersona}
                      disabled={saving}
                      className="rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium px-6 py-2.5 disabled:opacity-50 transition-colors"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={cancelEditPersona}
                      className="rounded-lg border-2 border-neutral-900 text-neutral-900 font-medium px-6 py-2.5 hover:bg-neutral-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Knowledge Base */}
            <section className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="text-lg font-bold text-neutral-900">
                    📚 Knowledge Base
                  </div>
                  <TooltipIcon
                    content="Choose between web crawl (extract data from your website) or connect to an external knowledge base API."
                    position="right"
                  />
                  {widget.kb_type === "external" && (
                    <span className="inline-block bg-gradient-to-r from-purple-400 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      🔌 EXTERNAL API
                    </span>
                  )}
                  {widget.kb_type !== "external" && (widget.crawl_tier === "deep" || userTier === "paid") && (
                    <span className="inline-block bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-900 text-xs font-bold px-3 py-1 rounded-full">
                      ⭐ PREMIUM
                    </span>
                  )}
                </div>
              </div>

              {/* KB Type Toggle */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={async () => {
                    setWidget((w) => ({ ...w, kb_type: "crawl" }));
                    await saveWidget({ kb_type: "crawl" });
                    setExternalKBStatus(null);
                  }}
                  className={cx(
                    "flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all",
                    widget.kb_type !== "external"
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  )}
                >
                  🌐 Web Crawl
                </button>
                <button
                  onClick={async () => {
                    setWidget((w) => ({ ...w, kb_type: "external" }));
                    await saveWidget({ kb_type: "external" });
                  }}
                  className={cx(
                    "flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all",
                    widget.kb_type === "external"
                      ? "bg-purple-600 text-white"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  )}
                >
                  🔌 External API
                </button>
              </div>

              {/* External API Configuration */}
              {widget.kb_type === "external" && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-purple-900 mb-4">
                    Connect your widget to an external knowledge base API. The API should accept POST requests with a JSON body containing a "question" field.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-purple-900 mb-1">
                        API URL *
                      </label>
                      <input
                        type="url"
                        className="w-full rounded-lg border border-purple-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                        placeholder="https://api.example.com/chat"
                        value={widget.external_kb_url || ""}
                        onChange={(e) =>
                          setWidget((w) => ({ ...w, external_kb_url: e.target.value }))
                        }
                        onBlur={() =>
                          saveWidget({ external_kb_url: widget.external_kb_url || null })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-purple-900 mb-1">
                        API Key (optional)
                      </label>
                      <input
                        type="password"
                        className="w-full rounded-lg border border-purple-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                        placeholder="Bearer token or API key"
                        value={widget.external_kb_api_key || ""}
                        onChange={(e) =>
                          setWidget((w) => ({ ...w, external_kb_api_key: e.target.value }))
                        }
                        onBlur={() =>
                          saveWidget({ external_kb_api_key: widget.external_kb_api_key || null })
                        }
                      />
                      <p className="text-xs text-purple-700 mt-1">
                        Sent as "Authorization: Bearer &lt;key&gt;" header
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={testExternalKB}
                        disabled={testingExternalKB || !widget.external_kb_url}
                        className="rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 disabled:opacity-50 transition-colors text-sm"
                      >
                        {testingExternalKB ? "Testing..." : "Test Connection"}
                      </button>

                      {externalKBStatus === "connected" && (
                        <span className="flex items-center gap-1 text-sm text-emerald-600 font-medium">
                          <span>✅</span> Connected
                        </span>
                      )}
                      {externalKBStatus === "error" && (
                        <span className="flex items-center gap-1 text-sm text-red-600 font-medium">
                          <span>❌</span> Connection failed
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-white/50 rounded-lg">
                    <p className="text-xs text-purple-800 font-medium mb-1">Expected API Response Format:</p>
                    <pre className="text-xs text-purple-700 overflow-x-auto">{`{
  "answer": "Response text...",
  "sources": [{ "meeting_title": "...", "excerpt": "..." }]
}`}</pre>
                  </div>
                </div>
              )}

              {/* Crawl-based Knowledge Base (only shown when kb_type is crawl) */}
              {widget.kb_type !== "external" && widget.crawl_tier === "deep" && knowledgeBase ? (
                /* Has Knowledge Base */
                <div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">✅</span>
                      <div className="flex-1">
                        <p className="font-semibold text-emerald-900 mb-1">
                          Deep Knowledge Base Active
                        </p>
                        <p className="text-sm text-emerald-800">
                          Your widget has access to detailed business information as a reference tool during conversations.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Show extracted data stats */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    {knowledgeBase.services && knowledgeBase.services.length > 0 && (
                      <div className="bg-neutral-50 rounded-lg p-3 border">
                        <div className="text-xs text-neutral-600 font-medium">Services</div>
                        <div className="text-2xl font-bold text-neutral-900">{knowledgeBase.services.length}</div>
                      </div>
                    )}
                    {knowledgeBase.team && knowledgeBase.team.length > 0 && (
                      <div className="bg-neutral-50 rounded-lg p-3 border">
                        <div className="text-xs text-neutral-600 font-medium">Team Members</div>
                        <div className="text-2xl font-bold text-neutral-900">{knowledgeBase.team.length}</div>
                      </div>
                    )}
                    {knowledgeBase.menuItems && knowledgeBase.menuItems.length > 0 && (
                      <div className="bg-neutral-50 rounded-lg p-3 border">
                        <div className="text-xs text-neutral-600 font-medium">Menu Items</div>
                        <div className="text-2xl font-bold text-neutral-900">{knowledgeBase.menuItems.length}</div>
                      </div>
                    )}
                    {knowledgeBase.faq && knowledgeBase.faq.length > 0 && (
                      <div className="bg-neutral-50 rounded-lg p-3 border">
                        <div className="text-xs text-neutral-600 font-medium">FAQ Entries</div>
                        <div className="text-2xl font-bold text-neutral-900">{knowledgeBase.faq.length}</div>
                      </div>
                    )}
                    {knowledgeBase.clientWork && knowledgeBase.clientWork.length > 0 && (
                      <div className="bg-neutral-50 rounded-lg p-3 border">
                        <div className="text-xs text-neutral-600 font-medium">Portfolio</div>
                        <div className="text-2xl font-bold text-neutral-900">{knowledgeBase.clientWork.length}</div>
                      </div>
                    )}
                    {knowledgeBase.locations && knowledgeBase.locations.length > 0 && (
                      <div className="bg-neutral-50 rounded-lg p-3 border">
                        <div className="text-xs text-neutral-600 font-medium">Locations</div>
                        <div className="text-2xl font-bold text-neutral-900">{knowledgeBase.locations.length}</div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={runDeepCrawl}
                    disabled={deepCrawlBusy || !widget.url}
                    className="text-sm rounded-lg border px-4 py-2 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
                  >
                    {deepCrawlBusy ? "Re-crawling..." : "🔄 Re-run Deep Crawl"}
                  </button>
                </div>
              ) : widget.kb_type !== "external" ? (
                /* No Knowledge Base - show crawl options */
                <div>
                  {userTier === "paid" ? (
                    /* Paid user - can run deep crawl */
                    <div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-blue-900 mb-3">
                          Run an expanded crawl to analyze 10+ pages of your website and extract comprehensive business information (services, team bios, menu items, portfolio, FAQ).
                        </p>
                        <p className="text-sm text-blue-800 font-medium">
                          Your widget will have access to this detailed knowledge as a reference tool during conversations.
                        </p>
                      </div>
                      <button
                        onClick={runDeepCrawl}
                        disabled={deepCrawlBusy || !widget.url}
                        className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 disabled:opacity-50 transition-colors"
                      >
                        {deepCrawlBusy ? "Crawling..." : "🚀 Run Expanded Crawl"}
                      </button>
                      {!widget.url && (
                        <p className="text-xs text-neutral-500 mt-2">
                          Add a website URL in Basic Info first
                        </p>
                      )}
                    </div>
                  ) : (
                    /* Free user - show upgrade prompt */
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg p-6">
                      <div className="flex items-start gap-3 mb-4">
                        <span className="text-3xl">⭐</span>
                        <div>
                          <h4 className="font-bold text-neutral-900 mb-2">
                            Unlock Deep Knowledge Base
                          </h4>
                          <p className="text-sm text-neutral-700 mb-3">
                            Upgrade to Pro to analyze 10+ pages of your website and extract detailed business information. Your widget will provide much more accurate, specific answers to visitors.
                          </p>
                          <ul className="text-xs text-neutral-700 space-y-1 mb-4">
                            <li>✓ Full service list extraction</li>
                            <li>✓ Team member profiles & bios</li>
                            <li>✓ Menu items with pricing</li>
                            <li>✓ Portfolio & client work</li>
                            <li>✓ FAQ content for common questions</li>
                          </ul>
                          <button
                            onClick={() => router.push("/dashboard/upgrade")}
                            className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-2.5 transition-colors"
                          >
                            ⭐ Upgrade to Pro
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </section>

            {/* Rules */}
            <section className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-lg font-bold text-neutral-900">📋 Widget Rules</div>
                <TooltipIcon
                  content="Rules are specific instructions that override personality. Use them for business-critical responses like pricing, hours, or contact info."
                  position="right"
                />
              </div>
              <p className="text-sm text-neutral-600 mb-4">
                Add specific instructions to improve responses. Rules are applied after the personality.
              </p>

              <div className="flex gap-2 mb-4">
                <input
                  className="flex-1 rounded-lg border-2 border-neutral-200 focus:border-neutral-900 focus:outline-none px-4 py-2.5 text-sm transition-colors"
                  placeholder="e.g., Always mention our 24/7 availability"
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addRule();
                  }}
                />
                <button
                  onClick={addRule}
                  disabled={!newRule.trim()}
                  className="rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium px-6 py-2.5 disabled:opacity-50 transition-colors"
                >
                  Add
                </button>
              </div>

              <ul className="divide-y border rounded-lg">
                {rules.length === 0 && (
                  <li className="p-3 text-sm text-neutral-500">No rules yet.</li>
                )}
                {rules.map((r) => (
                  <li key={r.id} className="p-3 flex flex-col gap-2">
                    {editingRuleId === r.id ? (
                      <>
                        <textarea
                          className="w-full rounded-lg border px-3 py-2 text-sm"
                          value={editingRuleText}
                          onChange={(e) => setEditingRuleText(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={saveRuleEdit}
                            className="rounded-lg bg-black text-white text-xs px-3 py-1"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditRule}
                            className="rounded-lg border text-xs px-3 py-1 hover:bg-neutral-100"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <div className="text-sm">{r.text}</div>
                        <div className="text-xs text-neutral-500">
                          <button
                            onClick={() => startEditRule(r)}
                            className="underline mr-3"
                          >
                            edit
                          </button>
                          <button
                            onClick={() => deleteRule(r.id)}
                            className="underline"
                          >
                            delete
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            {/* Auto-Generate Rule Suggestions */}
            <section className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-lg font-bold text-neutral-900">✨ AI Rule Suggestions</div>
                <button
                  onClick={generateSuggestions}
                  disabled={genBusy}
                  className="rounded-lg bg-amber-400 hover:bg-amber-500 text-neutral-900 font-medium px-4 py-2 disabled:opacity-50 transition-colors text-sm"
                >
                  {genBusy ? "Generating…" : "Generate Suggestions"}
                </button>
              </div>
              <p className="text-sm text-neutral-600 mb-4">
                Click to auto-generate rule suggestions based on your widget's current setup.
              </p>

              <ul className="divide-y border rounded-lg">
                {suggestions.length === 0 && (
                  <li className="p-3 text-sm text-neutral-500">
                    Click "Generate Suggestions" to get AI-powered rule ideas.
                  </li>
                )}
                {suggestions.map((s, idx) => (
                  <li key={idx} className="p-3 flex items-start justify-between gap-3">
                    <div className="text-sm">{s}</div>
                    <div>
                      <button
                        onClick={() => addSuggestionToRules(s)}
                        className="rounded-lg border text-xs px-3 py-1 hover:bg-neutral-100"
                      >
                        + add
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* RIGHT SIDEBAR - Preview, Embed, Style */}
          <div className="flex flex-col gap-6">
            {/* Preview Chat - Test Widget */}
            <section
              id="preview-chat-section"
              className="bg-neutral-50 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                  🧪 Preview Widget
                </div>
                {previewConversation.length > 0 && (
                  <button
                    onClick={clearPreviewChat}
                    className="text-xs text-neutral-600 hover:text-neutral-900 font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Widget Preview - wrapped in gradient for glass effect visibility */}
              <div
                className="p-4 rounded-xl"
                style={{
                  background: widget.style === "preset-glass"
                    ? "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)"
                    : widget.style === "preset-midnight"
                    ? "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
                    : "transparent",
                }}
              >
                <div
                  className={cx(
                    "border p-5 shadow-lg max-w-[350px]",
                    widget.style === "preset-glass" && "backdrop-blur-xl backdrop-saturate-150"
                  )}
                  style={{
                    background: currentCustomization.widgetBg,
                    borderRadius: currentCustomization.borderRadius,
                    fontFamily: currentCustomization.fontFamily,
                    borderColor: widget.style === "preset-glass"
                      ? "rgba(255, 255, 255, 0.35)"
                      : widget.style === "preset-midnight"
                      ? "#3f3f46"
                      : undefined,
                    WebkitBackdropFilter: widget.style === "preset-glass" ? "blur(24px) saturate(180%)" : undefined,
                    backdropFilter: widget.style === "preset-glass" ? "blur(24px) saturate(180%)" : undefined,
                  }}
                >
                <h4
                  className="text-lg font-semibold mb-4 flex items-center gap-2"
                  style={{
                    color: widget.style === "preset-midnight" ? "#f4f4f5" : "#171717",
                  }}
                >
                  {widget.logo_url ? (
                    <img
                      src={widget.logo_url}
                      alt="Logo"
                      className="h-6 w-auto"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : currentCustomization.headerIcon ? (
                    <span className="text-xl">{currentCustomization.headerIcon}</span>
                  ) : null}
                  <span>{currentCustomization.headerText}</span>
                </h4>

                {/* Messages */}
                <div
                  className="max-h-[300px] overflow-y-auto mb-4 p-2 rounded-lg"
                  style={{
                    background: widget.style === "preset-midnight"
                      ? "rgba(39, 39, 42, 0.5)"
                      : widget.style === "preset-glass"
                      ? "rgba(255, 255, 255, 0.35)"
                      : "#fafafa",
                  }}
                >
                  {previewConversation.length === 0 ? (
                    <p
                      className="text-xs text-center py-8 italic"
                      style={{
                        color: widget.style === "preset-midnight" ? "#71717a" : "#a3a3a3",
                      }}
                    >
                      Start a conversation to test your widget
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {previewConversation.map((msg, idx) => (
                        <div
                          key={idx}
                          className={cx(
                            "p-2.5 text-sm leading-relaxed",
                            msg.role === "user"
                              ? "text-white ml-8 text-right"
                              : "mr-8 border"
                          )}
                          style={{
                            borderRadius: `calc(${currentCustomization.borderRadius} * 0.66)`,
                            background:
                              msg.role === "user"
                                ? currentCustomization.userMsgColor
                                : currentCustomization.assistantMsgColor,
                            borderColor:
                              msg.role === "assistant"
                                ? currentCustomization.assistantMsgBorder
                                : "transparent",
                          }}
                        >
                          {msg.role === "assistant" ? (
                            <div dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }} />
                          ) : (
                            msg.content
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    className="flex-1 p-2.5 border text-sm resize-none focus:outline-none"
                    style={{
                      borderRadius: `calc(${currentCustomization.borderRadius} * 0.66)`,
                      borderColor: currentCustomization.inputBorderColor,
                      fontFamily: currentCustomization.fontFamily,
                    }}
                    placeholder="Type your message..."
                    value={previewMsg}
                    onChange={(e) => setPreviewMsg(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !chatBusy) {
                        e.preventDefault();
                        previewChatSend();
                      }
                    }}
                    onFocus={(e) =>
                      (e.target.style.borderColor =
                        currentCustomization.inputFocusColor)
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor =
                        currentCustomization.inputBorderColor)
                    }
                  />
                  <button
                    onClick={previewChatSend}
                    disabled={chatBusy || !previewMsg.trim()}
                    className="px-5 text-white font-semibold text-sm disabled:bg-neutral-400 disabled:cursor-not-allowed transition-colors"
                    style={{
                      background: chatBusy
                        ? undefined
                        : currentCustomization.primaryColor,
                      borderRadius: `calc(${currentCustomization.borderRadius} * 0.66)`,
                    }}
                    onMouseEnter={(e) => {
                      if (!chatBusy) {
                        e.currentTarget.style.background =
                          currentCustomization.buttonHoverColor;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!chatBusy) {
                        e.currentTarget.style.background =
                          currentCustomization.primaryColor;
                      }
                    }}
                  >
                    Send
                  </button>
                </div>
              </div>
              </div>
            </section>

            {/* Embed Code */}
            <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="text-base font-bold text-neutral-900">
                  📦 Embed Code
                </div>
                <TooltipIcon
                  content="Copy this code snippet and paste it into your website's HTML"
                  position="bottom"
                />
              </div>
              <p className="text-xs text-neutral-600 mb-3">Paste this in the &lt;head&gt; or before &lt;/body&gt;</p>
              <pre className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs overflow-auto mb-3">{`<script src="${(embedOrigin || "https://yourdomain.com")}/widget.js" data-id="${widgetId}" data-base-url="${embedOrigin || "https://yourdomain.com"}"></script>`}</pre>
              <button
                onClick={copyEmbed}
                className="w-full rounded-lg border-2 border-neutral-900 text-neutral-900 font-medium px-4 py-2.5 hover:bg-neutral-50 transition-colors"
              >
                Copy Embed Code
              </button>
            </section>

            {/* Widget Style */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="text-lg font-bold">Widget Style</div>
              <TooltipIcon
                content="Choose a preset style or use AI to match your website's design"
                position="right"
              />
            </div>

            {/* Preset Styles */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {getAvailablePresets().map((preset) => (
                <button
                  key={preset.id}
                  onClick={async () => {
                    setWidget((w) => ({
                      ...w,
                      style: preset.id,
                      customization: null,
                    }));
                    // Save immediately
                    await saveWidget({ style: preset.id, customization: null });
                    showSuccessToast(`✅ Style "${preset.name}" applied!`);
                  }}
                  className={cx(
                    "p-3 rounded-lg border-2 text-left transition-all",
                    widget.style === preset.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-neutral-200 hover:border-neutral-300"
                  )}
                >
                  <div className="font-semibold text-sm mb-1">
                    {preset.name}
                  </div>
                  <div className="text-xs text-neutral-600">
                    {preset.description}
                  </div>
                  <div className="flex gap-1 mt-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ background: preset.preview.primaryColor }}
                    />
                    <div
                      className="w-4 h-4 rounded"
                      style={{ background: preset.preview.assistantMsgColor }}
                    />
                    <div
                      className="w-4 h-4 rounded border"
                      style={{ background: preset.preview.widgetBg }}
                    />
                  </div>
                </button>
              ))}
            </div>

            {/* AI Website Matcher */}
            <button
              onClick={async () => {
                if (!widget.url) {
                  alert("Please set a website URL first");
                  return;
                }
                setAnalyzingSite(true);
                try {
                  console.log("Analyzing site for widget:", widgetId);
                  const res = await fetchJSON(
                    `/api/widgets/${widgetId}/analyze-site`,
                    { method: "POST" }
                  );
                  console.log("Analysis result:", res);
                  if (res.customization) {
                    setWidget((w) => ({
                      ...w,
                      style: "custom",
                      customization: res.customization,
                    }));
                    await saveWidget({
                      style: "custom",
                      customization: res.customization,
                    });
                    setToast({
                      message: "✨ Style matched to your website!",
                      type: "success",
                    });
                  }
                } catch (err: any) {
                  setToast({
                    message: err.message || "Failed to analyze website",
                    type: "error",
                  });
                } finally {
                  setAnalyzingSite(false);
                }
              }}
              disabled={analyzingSite || !widget.url}
              className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium px-4 py-3 disabled:opacity-50 transition-colors mb-4"
            >
              {analyzingSite ? "✨ Analyzing..." : "✨ Match My Website"}
            </button>

            {/* Manual Color Customization */}
            <details className="mb-4">
              <summary className="cursor-pointer text-sm font-semibold mb-2 hover:text-blue-600 transition-colors">
                🎨 Advanced Color Customization
              </summary>
              <div className="mt-3 space-y-3 pl-2">
                <div className="grid grid-cols-2 gap-3">
                  {/* Primary Color */}
                  <div>
                    <label className="text-xs font-medium text-neutral-700 mb-1 block">
                      Primary Color
                    </label>
                    <input
                      type="color"
                      value={currentCustomization.primaryColor}
                      onChange={(e) => {
                        const newCustomization = {
                          ...currentCustomization,
                          primaryColor: e.target.value,
                          buttonHoverColor: e.target.value, // Update hover to match
                        };
                        setWidget((w) => ({
                          ...w,
                          style: "custom",
                          customization: newCustomization,
                        }));
                      }}
                      onBlur={async () => {
                        await saveWidget({
                          style: "custom",
                          customization: currentCustomization,
                        });
                      }}
                      className="w-full h-10 rounded border cursor-pointer"
                    />
                  </div>

                  {/* User Message Color */}
                  <div>
                    <label className="text-xs font-medium text-neutral-700 mb-1 block">
                      User Message
                    </label>
                    <input
                      type="color"
                      value={currentCustomization.userMsgColor}
                      onChange={(e) => {
                        const newCustomization = {
                          ...currentCustomization,
                          userMsgColor: e.target.value,
                        };
                        setWidget((w) => ({
                          ...w,
                          style: "custom",
                          customization: newCustomization,
                        }));
                      }}
                      onBlur={async () => {
                        await saveWidget({
                          style: "custom",
                          customization: currentCustomization,
                        });
                      }}
                      className="w-full h-10 rounded border cursor-pointer"
                    />
                  </div>

                  {/* Assistant Message Color */}
                  <div>
                    <label className="text-xs font-medium text-neutral-700 mb-1 block">
                      Assistant Message
                    </label>
                    <input
                      type="color"
                      value={currentCustomization.assistantMsgColor}
                      onChange={(e) => {
                        const newCustomization = {
                          ...currentCustomization,
                          assistantMsgColor: e.target.value,
                        };
                        setWidget((w) => ({
                          ...w,
                          style: "custom",
                          customization: newCustomization,
                        }));
                      }}
                      onBlur={async () => {
                        await saveWidget({
                          style: "custom",
                          customization: currentCustomization,
                        });
                      }}
                      className="w-full h-10 rounded border cursor-pointer"
                    />
                  </div>

                  {/* Widget Background */}
                  <div>
                    <label className="text-xs font-medium text-neutral-700 mb-1 block">
                      Background
                    </label>
                    <input
                      type="color"
                      value={currentCustomization.widgetBg}
                      onChange={(e) => {
                        const newCustomization = {
                          ...currentCustomization,
                          widgetBg: e.target.value,
                        };
                        setWidget((w) => ({
                          ...w,
                          style: "custom",
                          customization: newCustomization,
                        }));
                      }}
                      onBlur={async () => {
                        await saveWidget({
                          style: "custom",
                          customization: currentCustomization,
                        });
                      }}
                      className="w-full h-10 rounded border cursor-pointer"
                    />
                  </div>
                </div>

                {/* Reset to Preset */}
                <button
                  onClick={async () => {
                    setWidget((w) => ({
                      ...w,
                      style: "preset-modern",
                      customization: null,
                    }));
                    await saveWidget({ style: "preset-modern", customization: null });
                    setToast({
                      message: "Reset to Modern preset",
                      type: "success",
                    });
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Reset to Preset
                </button>
              </div>
            </details>

            {/* Position */}
            <div className="text-sm font-semibold mb-2 mt-4">
              Widget Position
            </div>
            <select
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={widget.position}
              onChange={async (e) => {
                const newPos = e.target.value;
                setWidget((w) => ({ ...w, position: newPos }));
                await saveWidget({ position: newPos });
              }}
            >
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-center">Bottom Center</option>
              <option value="bottom-left">Bottom Left</option>
            </select>

            {/* Auto-open Delay */}
            <div className="text-sm font-semibold mb-2 mt-4">
              Auto-open Delay
            </div>
            <div className="text-xs text-neutral-600 mb-2">
              Automatically open the widget after a delay. Set to 0 to disable. (Respectful - won't open if visitor previously dismissed)
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="60"
                step="1"
                className="w-20 rounded-lg border px-3 py-2 text-sm"
                value={(widget as any).auto_open_delay || 0}
                onChange={(e) => {
                  const delay = parseInt(e.target.value) || 0;
                  setWidget((w) => ({ ...w, auto_open_delay: delay } as any));
                }}
                onBlur={async (e) => {
                  const delay = parseInt(e.target.value) || 0;
                  await saveWidget({ auto_open_delay: delay } as any);
                }}
              />
              <span className="text-sm text-neutral-600">seconds</span>
            </div>

            {/* Logo Upload */}
            <div className="text-sm font-semibold mb-2 mt-4">
              Logo Image
            </div>
            <div className="text-xs text-neutral-600 mb-2">
              Upload a logo (PNG, JPG, SVG) or enter an image URL. Recommended size: 32x32px or 64x64px.
            </div>

            {/* File Upload Button */}
            <div className="mb-3">
              <input
                type="file"
                id="logo-upload"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  // Validate file size (2MB)
                  if (file.size > 2 * 1024 * 1024) {
                    setToast({
                      message: "File too large. Max size: 2MB",
                      type: "error",
                    });
                    return;
                  }

                  setUploadingLogo(true);
                  try {
                    const formData = new FormData();
                    formData.append("logo", file);

                    const res = await fetch(`/api/widgets/${widgetId}/upload-logo`, {
                      method: "POST",
                      body: formData,
                    });

                    if (!res.ok) {
                      const error = await res.json();
                      throw new Error(error.error || "Upload failed");
                    }

                    const data = await res.json();
                    setWidget((w) => ({ ...w, logo_url: data.logoUrl }));
                    setToast({
                      message: "✅ Logo uploaded successfully!",
                      type: "success",
                    });
                  } catch (err: any) {
                    console.error("Upload error:", err);
                    setToast({
                      message: err.message || "Failed to upload logo",
                      type: "error",
                    });
                  } finally {
                    setUploadingLogo(false);
                    // Reset file input
                    e.target.value = "";
                  }
                }}
              />
              <button
                onClick={() => document.getElementById("logo-upload")?.click()}
                disabled={uploadingLogo}
                className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 disabled:opacity-50 transition-colors text-sm"
              >
                {uploadingLogo ? "Uploading..." : "📤 Upload Logo"}
              </button>
            </div>

            {/* URL Input (Alternative) */}
            <div className="text-xs text-neutral-500 mb-2 text-center">or</div>
            <div className="flex gap-2">
              <input
                type="url"
                className="flex-1 rounded-lg border px-3 py-2 text-sm"
                placeholder="https://example.com/logo.png"
                value={widget.logo_url || ""}
                onChange={(e) => {
                  setWidget((w) => ({ ...w, logo_url: e.target.value }));
                }}
                onBlur={async (e) => {
                  const logoUrl = e.target.value.trim();
                  await saveWidget({ logo_url: logoUrl || null });
                }}
              />
              {widget.logo_url && (
                <button
                  onClick={async () => {
                    setWidget((w) => ({ ...w, logo_url: null }));
                    await saveWidget({ logo_url: null });
                  }}
                  className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Logo Preview */}
            {widget.logo_url && (
              <div className="mt-2 p-2 border rounded-lg bg-neutral-50">
                <div className="text-xs text-neutral-600 mb-1">Preview:</div>
                <img
                  src={widget.logo_url}
                  alt="Logo preview"
                  className="h-8 w-auto"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextElementSibling?.classList.remove("hidden");
                  }}
                />
                <div className="hidden text-xs text-red-600">
                  Failed to load image. Check the URL.
                </div>
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-12 pb-8 flex items-center justify-between">
          <div className="text-sm text-neutral-600">
            Changes only save when you click{" "}
            <span className="font-semibold text-neutral-900">Save</span>
          </div>
          <div className="flex gap-3">
            <a
              href={`/dashboard/conversations`}
              className="rounded-lg border-2 border-neutral-900 text-neutral-900 font-medium px-6 py-2.5 hover:bg-neutral-50 transition-colors"
            >
              View Conversations
            </a>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={cx(
            "fixed bottom-4 left-1/2 -translate-x-1/2 rounded-lg text-sm px-4 py-3 shadow-lg",
            "flex items-center gap-3 min-w-[300px] max-w-md",
            "animate-[slideUp_0.3s_ease-out]",
            toast.type === "success" && "bg-emerald-500 text-white",
            toast.type === "error" && "bg-red-500 text-white",
            toast.type === "info" && "bg-blue-500 text-white"
          )}
        >
          <span className="flex-1">{toast.message}</span>
          <button
            className="text-white/80 hover:text-white transition-colors"
            onClick={() => setToast(null)}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/70 backdrop-blur-sm grid place-items-center">
          <div className="rounded-2xl border bg-white px-6 py-4 shadow-sm">
            Loading…
          </div>
        </div>
      )}

      {/* Lil' Helper Floating Button */}
      <LilHelperButton
        widgetId={widgetId}
        embedCode={`<script src="${embedOrigin || "https://yourdomain.com"}/widget.js" data-id="${widgetId}" data-base-url="${embedOrigin || "https://yourdomain.com"}"></script>`}
      />
    </div>
  );
}
