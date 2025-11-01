// app/dashboard/widgets/[id]/conversations/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LilHelperButton } from "@/components/LilHelperButton";

type Widget = {
  id: string;
  title: string;
};

type Conversation = {
  id: string;
  widget_id: string;
  started_at: string;
  message_count: number;
  char_count: number;
};

type Message = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

function cx(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

async function fetchJSON<T = any>(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
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
    return {} as T;
  }
}

export default function WidgetConversationsPage(
  props: { params: Promise<{ id: string }> }
) {
  const { id: widgetId } = React.use(props.params);
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [toast, setToast] = React.useState<string | null>(null);

  const [widget, setWidget] = React.useState<Widget | null>(null);
  const [convos, setConvos] = React.useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = React.useState(false);
  const [promoting, setPromoting] = React.useState(false);

  // Daily Summary
  const [dailySummary, setDailySummary] = React.useState<string>("");
  const [summaryLoading, setSummaryLoading] = React.useState(false);
  const [summaryConvCount, setSummaryConvCount] = React.useState<number>(0);

  // Rule Suggestions
  const [allSuggestions, setAllSuggestions] = React.useState<Array<{
    id: string;
    rule: string;
    reason: string;
  }>>([]);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = React.useState(0);
  const [dismissedToday, setDismissedToday] = React.useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = React.useState(false);
  const [addingRule, setAddingRule] = React.useState(false);
  const [editingRule, setEditingRule] = React.useState(false);
  const [editedRuleText, setEditedRuleText] = React.useState("");

  // Performance Metrics
  const [metrics, setMetrics] = React.useState<{
    conversationsByDay: Array<{ day: string; count: number }>;
    totalConversations: number;
    avgMessagesPerConvo: number;
    totalMessages: number;
    monthlySessionsUsed: number;
  }>({
    conversationsByDay: [],
    totalConversations: 0,
    avgMessagesPerConvo: 0,
    totalMessages: 0,
    monthlySessionsUsed: 0,
  });
  const [metricsLoading, setMetricsLoading] = React.useState(false);

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

  async function loadRuleSuggestions() {
    setSuggestionsLoading(true);
    try {
      const res = await fetchJSON<{
        suggestions: Array<{ id: string; rule: string; reason: string }>;
      }>(`/api/widgets/${widgetId}/rule-suggestions`, {
        method: "GET",
        cache: "no-store",
      });
      setAllSuggestions(res?.suggestions || []);
      setCurrentSuggestionIndex(0);

      // Load dismissed suggestions from localStorage
      const today = new Date().toDateString();
      const storageKey = `dismissed-suggestions-${widgetId}-${today}`;
      const dismissed = JSON.parse(localStorage.getItem(storageKey) || "[]");
      setDismissedToday(dismissed);
    } catch (err: any) {
      console.error("Suggestions load error:", err);
      setAllSuggestions([]);
    } finally {
      setSuggestionsLoading(false);
    }
  }

  async function loadMetrics() {
    setMetricsLoading(true);
    try {
      const res = await fetchJSON<{
        conversationsByDay: Array<{ day: string; count: number }>;
        totalConversations: number;
        avgMessagesPerConvo: number;
        totalMessages: number;
        monthlySessionsUsed: number;
      }>(`/api/widgets/${widgetId}/metrics`, {
        method: "GET",
        cache: "no-store",
      });
      setMetrics(res || {
        conversationsByDay: [],
        totalConversations: 0,
        avgMessagesPerConvo: 0,
        totalMessages: 0,
        monthlySessionsUsed: 0,
      });
    } catch (err: any) {
      console.error("Metrics load error:", err);
    } finally {
      setMetricsLoading(false);
    }
  }

  async function acceptSuggestion(suggestion: { id: string; rule: string; reason: string }, customText?: string) {
    setAddingRule(true);
    try {
      await fetchJSON(`/api/widget/${widgetId}/rules`, {
        method: "POST",
        body: JSON.stringify({ text: customText || suggestion.rule }),
      });
      setToast("✅ Rule added successfully!");

      // Move to next suggestion
      dismissSuggestion(suggestion.id);
      setEditingRule(false);
      setEditedRuleText("");
    } catch (err: any) {
      setToast(`Failed to add rule: ${err.message || String(err)}`);
    } finally {
      setAddingRule(false);
    }
  }

  function startEditingRule(suggestion: { id: string; rule: string; reason: string }) {
    setEditingRule(true);
    setEditedRuleText(suggestion.rule);
  }

  function cancelEditingRule() {
    setEditingRule(false);
    setEditedRuleText("");
  }

  function saveEditedRule(suggestion: { id: string; rule: string; reason: string }) {
    if (!editedRuleText.trim()) {
      setToast("Rule text cannot be empty");
      return;
    }
    acceptSuggestion(suggestion, editedRuleText.trim());
  }

  function dismissSuggestion(suggestionId: string) {
    // Add to dismissed list
    const newDismissed = [...dismissedToday, suggestionId];
    setDismissedToday(newDismissed);

    // Save to localStorage (per day)
    const today = new Date().toDateString();
    const storageKey = `dismissed-suggestions-${widgetId}-${today}`;
    localStorage.setItem(storageKey, JSON.stringify(newDismissed));

    // Reset edit state and move to next suggestion
    setEditingRule(false);
    setEditedRuleText("");
    setCurrentSuggestionIndex((prev) => prev + 1);
  }

  // Get current suggestion to display
  const currentSuggestion = React.useMemo(() => {
    // Filter out already dismissed suggestions
    const remaining = allSuggestions.filter(
      (s) => !dismissedToday.includes(s.id)
    );

    // Max 3 suggestions per day
    const maxShown = 3;
    const shownCount = dismissedToday.length;

    if (shownCount >= maxShown || remaining.length === 0) {
      return null;
    }

    return remaining[0]; // Show first remaining suggestion
  }, [allSuggestions, dismissedToday]);

  React.useEffect(() => {
    (async () => {
      try {
        // Load widget info
        const widgetData = await fetchJSON<Widget>(`/api/widgets/${widgetId}`);
        setWidget(widgetData);

        // Load conversations for this widget
        const data = await fetchJSON<{ conversations: Conversation[] }>(
          `/api/conversations?widgetId=${widgetId}`
        );
        const filtered = (data?.conversations ?? []).filter(
          (c) => c.widget_id === widgetId
        );
        setConvos(filtered);

        // Load daily summary
        loadDailySummary();

        // Load rule suggestions
        loadRuleSuggestions();

        // Load performance metrics
        loadMetrics();
      } catch (err: any) {
        setToast(`Load failed: ${err.message || String(err)}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [widgetId]);

  async function openConversation(id: string) {
    setSelectedId(id);
    setMessages([]);
    setLoadingMsgs(true);
    try {
      const data = await fetchJSON<{ messages: Message[] }>(
        `/api/conversations/${id}/messages`
      );
      setMessages(data?.messages ?? []);
    } catch (err: any) {
      setToast(`Load messages failed: ${err.message || String(err)}`);
    } finally {
      setLoadingMsgs(false);
    }
  }

  async function promoteToRule(m: Message) {
    const text = m.content.trim();
    if (!text) return;
    setPromoting(true);
    try {
      await fetchJSON(`/api/widget/${widgetId}/rules`, {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      setToast("✅ Promoted to rule!");
    } catch (err: any) {
      setToast(`Promote failed: ${err.message || String(err)}`);
    } finally {
      setPromoting(false);
    }
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
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-purple-600 shadow-xl">
              {widget?.title?.[0]?.toUpperCase() || "W"}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                {widget?.title || "Loading..."}
              </h1>
              <p className="text-sm text-white/80 font-medium">
                Widget Dashboard
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              className="relative text-sm font-semibold text-white px-5 py-2.5 rounded-lg transition-all duration-200 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-white after:rounded-full"
              href={conversationsHref}
            >
              📊 Activity
            </a>
            <a
              className="text-sm font-semibold text-white/80 hover:text-white px-5 py-2.5 rounded-lg hover:bg-white/10 transition-all duration-200"
              href={settingsHref}
            >
              ⚙️ Settings
            </a>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Hero Daily Summary */}
        <section className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 mb-8 border border-blue-100 shadow-lg">
          {summaryLoading ? (
            <div className="text-center py-8 animate-pulse">
              <div className="text-2xl font-bold text-neutral-400 mb-2">Loading your daily summary...</div>
            </div>
          ) : (
            <>
              {/* Headline */}
              <div className="text-4xl font-bold text-neutral-900 mb-3 leading-tight">
                {summaryConvCount === 0
                  ? "No Activity Today"
                  : `${summaryConvCount} Conversation${summaryConvCount > 1 ? "s" : ""} Today`}
              </div>

              {/* Subheading */}
              <div className="text-xl text-neutral-700 font-medium mb-4">
                {summaryConvCount === 0
                  ? "Your widget is ready and waiting for visitors"
                  : "Here's what's happening with your widget"}
              </div>

              {/* Body */}
              <div className="text-base text-neutral-600 leading-relaxed max-w-3xl">
                {dailySummary}
              </div>

              {/* Refresh button */}
              <div className="mt-6">
                <button
                  onClick={loadDailySummary}
                  disabled={summaryLoading}
                  className="rounded-lg bg-white hover:bg-neutral-50 border-2 border-neutral-900 text-neutral-900 font-semibold px-6 py-2.5 disabled:opacity-50 transition-colors text-sm"
                >
                  {summaryLoading ? "Refreshing..." : "🔄 Refresh Summary"}
                </button>
              </div>
            </>
          )}
        </section>

        {/* Rule Suggestions Slider */}
        <section className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 mb-8 border border-amber-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="text-2xl font-bold text-neutral-900">
              💡 Smart Rule Suggestions
            </div>
            {dismissedToday.length > 0 && (
              <div className="text-xs font-medium text-neutral-500 bg-white px-3 py-1.5 rounded-full border border-neutral-200">
                {dismissedToday.length}/3 today
              </div>
            )}
          </div>

          {suggestionsLoading ? (
            <div className="text-center py-8 animate-pulse">
              <div className="text-lg text-neutral-500">Analyzing your conversations...</div>
            </div>
          ) : currentSuggestion ? (
            <div className="bg-white rounded-xl border-2 border-amber-300 p-6 shadow-md">
              {editingRule ? (
                <>
                  {/* Edit Mode */}
                  <div className="mb-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-amber-600 mb-2">
                      Edit Rule
                    </div>
                    <textarea
                      value={editedRuleText}
                      onChange={(e) => setEditedRuleText(e.target.value)}
                      className="w-full border-2 border-neutral-300 rounded-lg p-4 text-sm text-neutral-900 leading-relaxed focus:outline-none focus:border-amber-500 transition-colors min-h-[100px]"
                      placeholder="Edit your rule..."
                    />
                    <div className="text-sm text-neutral-600 leading-relaxed mt-3">
                      <span className="font-medium text-neutral-700">Why: </span>
                      {currentSuggestion.reason}
                    </div>
                  </div>

                  {/* Edit Mode Action buttons */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => saveEditedRule(currentSuggestion)}
                      disabled={addingRule || !editedRuleText.trim()}
                      className="flex-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-semibold px-6 py-3 disabled:opacity-50 transition-colors text-sm"
                    >
                      {addingRule ? "Saving..." : "💾 Save & Add Rule"}
                    </button>
                    <button
                      onClick={cancelEditingRule}
                      disabled={addingRule}
                      className="flex-1 rounded-lg bg-white hover:bg-neutral-50 border-2 border-neutral-300 text-neutral-700 font-semibold px-6 py-3 disabled:opacity-50 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Normal View */}
                  <div className="mb-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-amber-600 mb-2">
                      Suggested Rule
                    </div>
                    <div className="text-lg font-semibold text-neutral-900 leading-relaxed mb-3">
                      {currentSuggestion.rule}
                    </div>
                    <div className="text-sm text-neutral-600 leading-relaxed">
                      <span className="font-medium text-neutral-700">Why: </span>
                      {currentSuggestion.reason}
                    </div>
                  </div>

                  {/* Normal Action buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => acceptSuggestion(currentSuggestion)}
                      disabled={addingRule}
                      className="flex-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-semibold px-6 py-3 disabled:opacity-50 transition-colors text-sm"
                    >
                      {addingRule ? "Adding..." : "✓ Accept"}
                    </button>
                    <button
                      onClick={() => startEditingRule(currentSuggestion)}
                      disabled={addingRule}
                      className="flex-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-3 disabled:opacity-50 transition-colors text-sm"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => dismissSuggestion(currentSuggestion.id)}
                      disabled={addingRule}
                      className="flex-1 rounded-lg bg-white hover:bg-neutral-50 border-2 border-neutral-300 text-neutral-700 font-semibold px-6 py-3 disabled:opacity-50 transition-colors text-sm"
                    >
                      ✕ Decline
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : dismissedToday.length >= 3 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">✨</div>
              <div className="text-lg font-semibold text-neutral-900 mb-2">
                All done for today!
              </div>
              <div className="text-sm text-neutral-600">
                You've reviewed all 3 suggestions. Check back tomorrow for more.
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🎯</div>
              <div className="text-lg font-semibold text-neutral-900 mb-2">
                No suggestions right now
              </div>
              <div className="text-sm text-neutral-600">
                We'll analyze your conversations and suggest improvements as patterns emerge.
              </div>
            </div>
          )}
        </section>

        {/* Performance Metrics */}
        <section className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm mb-8">
          <div className="text-2xl font-bold text-neutral-900 mb-6">
            📊 Performance Metrics
          </div>

          {metricsLoading ? (
            <div className="text-center py-8 animate-pulse">
              <div className="text-lg text-neutral-500">Loading metrics...</div>
            </div>
          ) : (
            <>
              {/* Monthly Usage Banner */}
              {(() => {
                const FREE_TIER_LIMIT = 50;
                const sessionsUsed = metrics.monthlySessionsUsed;
                const remaining = FREE_TIER_LIMIT - sessionsUsed;
                const percentUsed = (sessionsUsed / FREE_TIER_LIMIT) * 100;
                const isNearingLimit = percentUsed >= 80;
                const isOverLimit = remaining <= 0;

                return (
                  <div className={`rounded-xl p-6 mb-8 border-2 ${
                    isOverLimit
                      ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-300'
                      : isNearingLimit
                      ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300'
                      : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-sm font-semibold text-neutral-700 uppercase tracking-wide mb-1">
                          {isOverLimit ? '🚨 Limit Reached' : isNearingLimit ? '⚠️ Approaching Limit' : '💬 Monthly Usage'}
                        </div>
                        <div className="text-3xl font-bold text-neutral-900">
                          {sessionsUsed} <span className="text-lg font-normal text-neutral-600">/ {FREE_TIER_LIMIT}</span>
                        </div>
                        <div className="text-sm text-neutral-600 mt-1">
                          {isOverLimit
                            ? 'You\'ve reached your monthly limit. Upgrade to continue.'
                            : `${remaining} chat session${remaining !== 1 ? 's' : ''} remaining this month`
                          }
                        </div>
                      </div>
                      {(isNearingLimit || isOverLimit) && (
                        <a
                          href="/pricing"
                          className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 shadow-lg transition-all duration-200 text-sm whitespace-nowrap"
                        >
                          ⚡ Upgrade Plan
                        </a>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="relative w-full h-3 bg-white rounded-full overflow-hidden shadow-inner">
                      <div
                        className={`absolute top-0 left-0 h-full transition-all duration-500 ${
                          isOverLimit
                            ? 'bg-gradient-to-r from-red-500 to-red-600'
                            : isNearingLimit
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                        }`}
                        style={{ width: `${Math.min(percentUsed, 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs text-neutral-600 font-medium">
                        Free Tier
                      </div>
                      <div className="text-xs text-neutral-600 font-medium">
                        {percentUsed.toFixed(0)}% used
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Key Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                  <div className="text-xs font-semibold uppercase tracking-wide text-blue-600 mb-1">
                    Last 7 Days
                  </div>
                  <div className="text-3xl font-bold text-neutral-900 mb-1">
                    {metrics.totalConversations}
                  </div>
                  <div className="text-xs text-neutral-600">
                    Total Conversations
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
                  <div className="text-xs font-semibold uppercase tracking-wide text-purple-600 mb-1">
                    Engagement
                  </div>
                  <div className="text-3xl font-bold text-neutral-900 mb-1">
                    {metrics.avgMessagesPerConvo}
                  </div>
                  <div className="text-xs text-neutral-600">
                    Avg. Messages / Convo
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
                  <div className="text-xs font-semibold uppercase tracking-wide text-green-600 mb-1">
                    Volume
                  </div>
                  <div className="text-3xl font-bold text-neutral-900 mb-1">
                    {metrics.totalMessages}
                  </div>
                  <div className="text-xs text-neutral-600">
                    Total Messages
                  </div>
                </div>
              </div>

              {/* Conversation Volume Chart */}
              <div>
                <div className="text-lg font-semibold text-neutral-900 mb-4">
                  Conversation Volume (Last 7 Days)
                </div>
                {metrics.conversationsByDay.length > 0 ? (
                  <div className="flex items-end gap-2 h-48">
                    {metrics.conversationsByDay.map((item, idx) => {
                      const maxCount = Math.max(
                        ...metrics.conversationsByDay.map((d) => d.count),
                        1
                      );
                      const heightPercent = (item.count / maxCount) * 100;

                      return (
                        <div
                          key={idx}
                          className="flex-1 flex flex-col items-center gap-2"
                        >
                          <div className="w-full flex flex-col justify-end h-40">
                            <div
                              className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-300 hover:from-blue-600 hover:to-blue-500 relative group"
                              style={{ height: `${heightPercent}%` }}
                            >
                              {item.count > 0 && (
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {item.count}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-neutral-600 font-medium text-center">
                            {item.day}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-neutral-500">
                    <div className="text-4xl mb-3">📈</div>
                    <div className="text-sm">
                      No conversation data yet. Charts will appear once you have visitor activity.
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        {/* Conversations List */}
        <section className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-1">
                Recent Conversations
              </h2>
              <p className="text-sm text-neutral-600">
                {convos.length} conversation{convos.length !== 1 ? "s" : ""} total
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {convos.length === 0 && (
              <div className="text-center py-12 text-neutral-500">
                <div className="text-6xl mb-4">💬</div>
                <div className="text-lg font-medium mb-2">No conversations yet</div>
                <div className="text-sm">Conversations will appear here once visitors start chatting with your widget.</div>
              </div>
            )}
            {convos.map((c) => (
              <div
                key={c.id}
                className={cx(
                  "border-2 rounded-xl p-5 cursor-pointer transition-all hover:shadow-md",
                  selectedId === c.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-neutral-200 hover:border-neutral-300"
                )}
                onClick={() => openConversation(c.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-bold text-neutral-900 mb-1">
                      {new Date(c.started_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {c.message_count} message{c.message_count !== 1 ? "s" : ""} · {c.char_count} characters
                    </div>
                  </div>
                  <div className="text-xs text-neutral-400 font-mono">
                    ID: {c.id.slice(0, 8)}
                  </div>
                </div>

                {/* Show messages if selected */}
                {selectedId === c.id && (
                  <div className="mt-4 pt-4 border-t border-neutral-200">
                    {loadingMsgs ? (
                      <div className="text-sm text-neutral-600 text-center py-8 animate-pulse">
                        Loading messages…
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-sm text-neutral-600 text-center py-8">
                        No messages in this conversation.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {messages.map((m) => (
                          <div
                            key={m.id}
                            className="bg-white border border-neutral-200 rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div
                                className={cx(
                                  "text-xs font-semibold uppercase tracking-wide",
                                  m.role === "user" ? "text-blue-600" : "text-neutral-900"
                                )}
                              >
                                {m.role === "user" ? "👤 User" : "🤖 Assistant"}
                              </div>
                              <div className="text-xs text-neutral-500">
                                {new Date(m.created_at).toLocaleTimeString("en-US", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>
                            <div className="text-sm text-neutral-900 whitespace-pre-wrap leading-relaxed">
                              {m.content}
                            </div>

                            {/* Promote to rule */}
                            {m.role === "assistant" && (
                              <div className="mt-3 flex justify-end">
                                <button
                                  onClick={() => promoteToRule(m)}
                                  disabled={promoting}
                                  className="rounded-lg border-2 border-neutral-900 text-neutral-900 font-medium text-xs px-4 py-2 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
                                >
                                  {promoting ? "Adding…" : "+ Add to Rules"}
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-neutral-900 text-white text-sm px-6 py-3 shadow-xl flex items-center gap-3 animate-[slideUp_0.3s_ease-out]">
          <span>{toast}</span>
          <button
            className="text-white/80 hover:text-white transition-colors"
            onClick={() => setToast(null)}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      )}

      {/* Page loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/70 backdrop-blur-sm grid place-items-center">
          <div className="rounded-2xl border bg-white px-6 py-4 shadow-sm">
            Loading…
          </div>
        </div>
      )}

      {/* Lil' Helper Floating Button */}
      <LilHelperButton widgetId={widgetId} />
    </div>
  );
}
