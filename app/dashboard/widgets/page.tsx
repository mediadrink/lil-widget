// app/dashboard/widgets/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SuccessChecklist } from "@/components/SuccessChecklist";

type Widget = {
  id: string;
  title: string;
  url: string | null;
  persona_text: string | null;
  crawl_tier?: string;
  created_at: string;
};

export default function WidgetsListPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [widgets, setWidgets] = React.useState<Widget[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [isPaidUser, setIsPaidUser] = React.useState(false);
  const [crawlingWidgetId, setCrawlingWidgetId] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        // Check subscription tier
        const userRes = await fetch("/api/auth/user");
        if (userRes.ok) {
          const userData = await userRes.json();
          setIsPaidUser(userData.user?.user_metadata?.subscription_tier === "paid");
        }

        // Load widgets
        const res = await fetch("/api/widgets", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        setWidgets(data.widgets || []);
      } catch (err: any) {
        setError(err.message || "Failed to load widgets");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function runDeepCrawl(widget: Widget) {
    if (!widget.url) {
      alert("This widget doesn't have a URL set.");
      return;
    }

    setCrawlingWidgetId(widget.id);

    try {
      const res = await fetch("/api/crawl-deep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: widget.url,
          widgetId: widget.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Expanded crawl failed");
      }

      alert(`Expanded crawl complete! Analyzed ${data.pagesAnalyzed} pages.`);
      // Refresh widgets list
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Failed to run expanded crawl");
    } finally {
      setCrawlingWidgetId(null);
    }
  }

  // Basic tier: 1 widget, Growth tier: 2 widgets
  const widgetLimit = isPaidUser ? 2 : 1;
  const canCreateWidget = widgets.length < widgetLimit;

  function handleCreateWidget() {
    if (!canCreateWidget) {
      const tierName = isPaidUser ? "Growth" : "Basic";
      if (confirm(`${tierName} plan allows ${widgetLimit} widget${widgetLimit > 1 ? 's' : ''}. Upgrade to create more widgets?`)) {
        router.push("/dashboard/upgrade");
      }
      return;
    }
    router.push("/create");
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Top Level Navigation */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="text-lg font-semibold">Lil' Widget</div>
          <div className="flex items-center gap-6">
            <a
              className="text-sm font-medium hover:text-black border-b-2 border-black"
              href="/dashboard/widgets"
            >
              My Widgets
            </a>
            <a
              className="text-sm font-medium hover:text-black text-neutral-500"
              href="/dashboard/account"
            >
              Account
            </a>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Success Checklist - only show if user has widgets */}
        {!loading && widgets.length > 0 && (
          <div className="mb-6">
            <SuccessChecklist />
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Widgets</h1>
            <p className="text-sm text-neutral-600 mt-1">
              {widgets.length}/{widgetLimit} widget{widgets.length !== 1 ? 's' : ''} <span className="text-neutral-400">• {isPaidUser ? 'Growth' : 'Basic'} Plan</span>
            </p>
          </div>
          <button
            onClick={handleCreateWidget}
            disabled={!canCreateWidget}
            className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed"
          >
            + Create New Widget
          </button>
        </div>

        {loading && (
          <div className="text-center py-12 text-neutral-500">Loading widgets...</div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && widgets.length === 0 && (
          <div className="bg-white rounded-2xl border p-12 text-center">
            <div className="text-6xl mb-4">🤖</div>
            <h2 className="text-xl font-semibold mb-2">No widgets yet</h2>
            <p className="text-neutral-600 mb-6">
              Create your first AI-powered chat widget to get started
            </p>
            <button
              onClick={() => router.push("/create")}
              className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-neutral-800"
            >
              Create Your First Widget
            </button>
          </div>
        )}

        {!loading && !error && widgets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {widgets.map((widget) => (
              <div
                key={widget.id}
                className="bg-white rounded-2xl border p-6 hover:shadow-md transition-shadow"
              >
                <div
                  className="cursor-pointer mb-4"
                  onClick={() => router.push(`/dashboard/widgets/${widget.id}/admin-console`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold">{widget.title}</h3>
                    {widget.crawl_tier === "deep" && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                        Deep
                      </span>
                    )}
                  </div>
                  {widget.url && (
                    <p className="text-sm text-neutral-600 mb-3 truncate">
                      {widget.url}
                    </p>
                  )}
                  {widget.persona_text && (
                    <p className="text-xs text-neutral-500 line-clamp-2 mb-3">
                      {widget.persona_text}
                    </p>
                  )}
                  <div className="text-xs text-neutral-400">
                    Created {new Date(widget.created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Refresh Knowledge Button for paid users */}
                {isPaidUser && widget.crawl_tier === "deep" && widget.url && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      runDeepCrawl(widget);
                    }}
                    disabled={crawlingWidgetId === widget.id}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {crawlingWidgetId === widget.id ? "Crawling..." : "🔄 Refresh Knowledge"}
                  </button>
                )}

                {/* Upgrade prompt for free users with deep tier widgets */}
                {!isPaidUser && widget.crawl_tier === "deep" && (
                  <div className="text-xs text-neutral-500 bg-neutral-50 rounded p-2 text-center">
                    Upgrade to refresh knowledge
                  </div>
                )}

                {/* Show basic tier status */}
                {widget.crawl_tier === "basic" && (
                  <div className="text-xs text-neutral-500 text-center">
                    Basic crawl only
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
