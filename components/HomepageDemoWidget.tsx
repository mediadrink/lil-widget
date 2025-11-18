"use client";

import * as React from "react";
import { ChatMessage, ChatMessagesContainer } from "./ChatMessage";

// Widget IDs for demo widgets
const DEMO_WIDGETS = {
  diva: {
    id: "23bf1fdc-3f60-41ed-b379-fa352cac4f68",
    name: "Glamour Studio",
    icon: "💇‍♀️",
    type: "Hair Salon Diva",
    greeting: "Hello darling! Welcome to Glamour Studio! What can I help you with today? ✨",
    description: "Fabulous, glamorous, uses 'darling'",
  },
  vinyl: {
    id: "990b481e-0499-4203-8ae6-4e9e7c60cb36",
    name: "Vinyl & Vibes Café",
    icon: "☕",
    type: "Coffee Shop Vinyl Enthusiast",
    greeting: "Hey there! Welcome to Vinyl & Vibes. What's spinning in your world today?",
    description: "Music references, laid-back indie vibes",
  },
  pro: {
    id: "098fcfb6-a365-4bea-b1d8-4669c69cedac",
    name: "Summit Realty",
    icon: "🏠",
    type: "Real Estate Pro",
    greeting: "Welcome to Summit Realty. How can I assist you?",
    description: "Straight to the point, efficient",
  },
  roofing: {
    id: "e1020131-8443-4f22-a558-78d4a01f76b5",
    name: "RoofGuard Pro",
    icon: "🏗️",
    type: "Roofing & Gutter Lead Gen",
    greeting: "Hi! RoofGuard Pro here. Got roof or gutter concerns? Let's talk about it.",
    description: "Problem-solver, focuses on lead capture",
  },
};

type DemoType = keyof typeof DEMO_WIDGETS;

export default function HomepageDemoWidget() {
  const [selectedDemo, setSelectedDemo] = React.useState<DemoType>("diva");
  const [messages, setMessages] = React.useState<Array<{ role: string; content: string }>>([]);
  const [inputValue, setInputValue] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const [messageCount, setMessageCount] = React.useState(0);
  const [showSignupCTA, setShowSignupCTA] = React.useState(false);

  const messagesContainerRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll messages container to bottom when new messages are added
  React.useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Reset conversation when switching demos
  React.useEffect(() => {
    const widget = DEMO_WIDGETS[selectedDemo];
    setMessages([{ role: "assistant", content: widget.greeting }]);
    setInputValue("");
    setConversationId(null);
    setMessageCount(0);
    setShowSignupCTA(false);
  }, [selectedDemo]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();

    if (!inputValue.trim() || isLoading || showSignupCTA) return;

    const userMessage = inputValue.trim();
    setInputValue("");

    // Add user message to UI
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const widget = DEMO_WIDGETS[selectedDemo];
      const response = await fetch(`/api/widget/${widget.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationId: conversationId,
          visitorId: `demo-visitor-${Date.now()}`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      // Add assistant response to UI
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      setConversationId(data.conversationId);

      // Increment message count
      const newCount = messageCount + 1;
      setMessageCount(newCount);

      // Show signup CTA after 3 messages
      if (newCount >= 3) {
        setShowSignupCTA(true);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble responding right now. Please try again!",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  const currentWidget = DEMO_WIDGETS[selectedDemo];

  return (
    <div className="space-y-8">
      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
        <p className="text-sm text-neutral-700">
          👋 <strong>These are live AI demo widgets</strong> — try chatting with different
          personalities! (No real businesses behind them)
        </p>
      </div>

      {/* Personality Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(Object.keys(DEMO_WIDGETS) as DemoType[]).map((type) => {
          const widget = DEMO_WIDGETS[type];
          const isSelected = selectedDemo === type;

          return (
            <button
              key={type}
              onClick={() => setSelectedDemo(type)}
              className={`
                relative rounded-xl border-2 p-4 transition-all text-left
                ${
                  isSelected
                    ? "border-amber-400 bg-amber-50 shadow-md"
                    : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm"
                }
              `}
            >
              <div className="text-3xl mb-2">{widget.icon}</div>
              <div className="text-sm font-bold text-neutral-900 mb-1">{widget.type}</div>
              <div className="text-xs text-neutral-600">{widget.description}</div>
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Demo Widget */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-8 shadow-sm">
        <div className="bg-white border border-neutral-300 rounded-xl p-6 shadow-lg max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-200">
            <div className="text-2xl">{currentWidget.icon}</div>
            <div>
              <h4 className="text-lg font-semibold text-neutral-900">{currentWidget.name}</h4>
              <p className="text-xs text-neutral-500">Demo Widget</p>
            </div>
          </div>

          {/* Messages */}
          <ChatMessagesContainer variant="demo" className="!mb-6" ref={messagesContainerRef}>
            {messages.map((msg, idx) => (
              <ChatMessage
                key={idx}
                role={msg.role as "user" | "assistant"}
                content={msg.content}
                variant="demo"
              />
            ))}

            {isLoading && (
              <div className="bg-white border border-neutral-300 rounded-lg p-3 text-sm mr-12">
                <div className="flex gap-1">
                  <span className="animate-pulse">●</span>
                  <span className="animate-pulse delay-100">●</span>
                  <span className="animate-pulse delay-200">●</span>
                </div>
              </div>
            )}

            {showSignupCTA && (
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-400 rounded-lg p-4 text-center">
                <p className="text-sm font-semibold text-neutral-900 mb-3">
                  Thanks for trying out the demo! 🎉
                </p>
                <p className="text-xs text-neutral-700 mb-4">
                  Want to keep chatting? Sign up free to create your own widget with unlimited
                  conversations.
                </p>
                <a
                  href="/register"
                  className="inline-block rounded-lg bg-amber-400 hover:bg-amber-500 text-neutral-900 font-medium px-6 py-2 text-sm transition-colors"
                >
                  Get Started Free
                </a>
              </div>
            )}
          </ChatMessagesContainer>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              placeholder={
                showSignupCTA ? "Sign up to continue chatting..." : "Type your message..."
              }
              className="flex-1 border border-neutral-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#007aff] disabled:bg-neutral-100 disabled:cursor-not-allowed"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading || showSignupCTA}
            />
            <button
              type="submit"
              className="bg-[#007aff] text-white rounded-lg px-6 font-semibold text-sm hover:bg-[#0066cc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !inputValue.trim() || showSignupCTA}
            >
              Send
            </button>
          </form>

          {/* Message counter for testing */}
          {messageCount > 0 && !showSignupCTA && (
            <p className="text-xs text-neutral-400 text-center mt-3">
              {messageCount} / 3 messages used
            </p>
          )}
        </div>

        <p className="text-center text-sm text-neutral-500 mt-6">
          ↑ Live demo of a Lil' Widget in action
        </p>
      </div>
    </div>
  );
}
