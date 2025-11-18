/**
 * Unified Chat Message Component
 * Used across all chat interfaces to ensure consistent rendering
 *
 * Variants:
 * - "widget": Matches the embedded widget styling (default)
 * - "dashboard": Dashboard conversation view
 * - "demo": Homepage demo widget
 */

import * as React from "react";
import { parseMarkdown } from "@/utils/markdown";

type ChatMessageProps = {
  role: "user" | "assistant";
  content: string;
  variant?: "widget" | "dashboard" | "demo";
  className?: string;
};

export function ChatMessage({
  role,
  content,
  variant = "widget",
  className = "",
}: ChatMessageProps) {
  // Variant-specific styling with responsive margins
  const variantStyles = {
    widget: {
      user: "bg-[#007aff] text-white rounded-lg p-3 text-sm ml-6 md:ml-12 text-right",
      assistant: "bg-white border border-neutral-300 rounded-lg p-3 text-sm mr-6 md:mr-12",
    },
    dashboard: {
      user: "bg-[#007aff] text-white rounded-lg p-3 text-sm ml-4 md:ml-8 text-right",
      assistant: "bg-white border border-neutral-300 rounded-lg p-3 text-sm mr-4 md:mr-8",
    },
    demo: {
      user: "bg-[#007aff] text-white rounded-lg p-3 text-sm ml-6 md:ml-12 text-right",
      assistant: "bg-white border border-neutral-300 rounded-lg p-3 text-sm mr-6 md:mr-12",
    },
  };

  const styles = variantStyles[variant][role];

  // Parse markdown for assistant messages only
  if (role === "assistant") {
    return (
      <div
        className={`${styles} ${className}`}
        dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
      />
    );
  }

  // Plain text for user messages
  return <div className={`${styles} ${className}`}>{content}</div>;
}

/**
 * Chat Messages Container
 * Provides consistent scrolling and spacing
 */
type ChatMessagesContainerProps = {
  children: React.ReactNode;
  variant?: "widget" | "dashboard" | "demo";
  className?: string;
};

export const ChatMessagesContainer = React.forwardRef<HTMLDivElement, ChatMessagesContainerProps>(
  ({ children, variant = "widget", className = "" }, ref) => {
    const variantStyles = {
      widget: "space-y-3 mb-6 max-h-80 overflow-y-auto",
      dashboard: "flex flex-col gap-4 max-h-[72vh] overflow-y-auto",
      demo: "space-y-3 mb-6 max-h-80 overflow-y-auto",
    };

    return (
      <div ref={ref} className={`${variantStyles[variant]} ${className}`}>
        {children}
      </div>
    );
  }
);

ChatMessagesContainer.displayName = "ChatMessagesContainer";
