// components/SuccessChecklist.tsx
"use client";

import * as React from "react";

type ChecklistItem = {
  id: string;
  label: string;
  completed: boolean;
  description: string;
};

type SuccessChecklistProps = {
  widgetId?: string;
  onDismiss?: () => void;
};

export function SuccessChecklist({ widgetId, onDismiss }: SuccessChecklistProps) {
  const [items, setItems] = React.useState<ChecklistItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    // Check if user has dismissed checklist
    const dismissedKey = widgetId
      ? `checklist-dismissed-${widgetId}`
      : "checklist-dismissed-global";
    const isDismissed = localStorage.getItem(dismissedKey) === "true";
    setDismissed(isDismissed);

    if (!isDismissed) {
      loadChecklist();
    } else {
      setLoading(false);
    }
  }, [widgetId]);

  async function loadChecklist() {
    try {
      const endpoint = widgetId
        ? `/api/widgets/${widgetId}/checklist`
        : "/api/checklist";
      const res = await fetch(endpoint, { cache: "no-store" });

      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      } else {
        // Fallback to default items if API fails
        setItems(getDefaultItems());
      }
    } catch (err) {
      console.error("Failed to load checklist:", err);
      setItems(getDefaultItems());
    } finally {
      setLoading(false);
    }
  }

  function getDefaultItems(): ChecklistItem[] {
    return [
      {
        id: "widget_created",
        label: "Widget created",
        completed: true, // Always true if viewing this
        description: "You've created your first widget",
      },
      {
        id: "code_installed",
        label: "Embed code installed",
        completed: false,
        description: "Add the code to your website",
      },
      {
        id: "first_conversation",
        label: "First conversation received",
        completed: false,
        description: "A visitor has chatted with your widget",
      },
      {
        id: "persona_customized",
        label: "Personality customized",
        completed: false,
        description: "Edit your widget's tone and behavior",
      },
      {
        id: "first_rule",
        label: "First rule added",
        completed: false,
        description: "Add a rule to improve responses",
      },
    ];
  }

  function handleDismiss() {
    const dismissedKey = widgetId
      ? `checklist-dismissed-${widgetId}`
      : "checklist-dismissed-global";
    localStorage.setItem(dismissedKey, "true");
    setDismissed(true);
    onDismiss?.();
  }

  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const isComplete = completedCount === totalCount;

  // Don't render if dismissed or loading
  if (dismissed || loading) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🚀</span>
            <h3 className="text-lg font-bold text-neutral-900">
              {isComplete ? "Setup Complete! 🎉" : "Get Started"}
            </h3>
          </div>
          <p className="text-sm text-neutral-700">
            {isComplete
              ? "You're all set! Your widget is ready to help your visitors."
              : "Complete these steps to get the most out of your widget"}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-neutral-500 hover:text-neutral-900 transition-colors text-sm font-medium ml-4"
          aria-label="Dismiss checklist"
        >
          ✕
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-neutral-700 mb-2">
          <span className="font-medium">
            {completedCount} of {totalCount} completed
          </span>
          <span className="font-bold">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Checklist Items */}
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
              item.completed
                ? "bg-white/50 border border-green-200"
                : "bg-white border border-neutral-200 hover:border-blue-300"
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {item.completed ? (
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-neutral-300" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div
                className={`text-sm font-medium ${
                  item.completed ? "text-neutral-600 line-through" : "text-neutral-900"
                }`}
              >
                {item.label}
              </div>
              {!item.completed && (
                <div className="text-xs text-neutral-600 mt-0.5">
                  {item.description}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Completion Message */}
      {isComplete && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 font-medium">
            🎊 Great job! Your widget is fully configured and ready to engage with visitors.
          </p>
        </div>
      )}
    </div>
  );
}
