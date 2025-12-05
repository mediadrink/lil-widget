"use client";

import * as React from "react";

const PERSONALITY_TRAITS = [
  { id: "friendly", label: "Friendly", emoji: "😊", description: "Warm and approachable" },
  { id: "professional", label: "Professional", emoji: "💼", description: "Polished and formal" },
  { id: "witty", label: "Witty", emoji: "😄", description: "Clever and humorous" },
  { id: "helpful", label: "Helpful", emoji: "🤝", description: "Supportive and thorough" },
  { id: "concise", label: "Concise", emoji: "⚡", description: "Brief and to the point" },
  { id: "enthusiastic", label: "Enthusiastic", emoji: "🎉", description: "Energetic and excited" },
];

const MAGIC_MESSAGES = [
  "Scanning your website...",
  "Learning about your business...",
  "Teaching your assistant...",
  "Adding personality traits...",
  "Polishing the final touches...",
  "Almost there...",
];

type BuilderStep = "url" | "name" | "personality" | "building" | "complete" | "demo";

interface WidgetBuilderProps {
  onSignup?: () => void;
}

export default function WidgetBuilder({ onSignup }: WidgetBuilderProps) {
  const [step, setStep] = React.useState<BuilderStep>("url");
  const [url, setUrl] = React.useState("");
  const [name, setName] = React.useState("");
  const [personality, setPersonality] = React.useState("");
  const [magicMessageIndex, setMagicMessageIndex] = React.useState(0);
  const [progress, setProgress] = React.useState(0);

  // Real widget created via API
  const [widgetId, setWidgetId] = React.useState<string | null>(null);
  const [crawledMetadata, setCrawledMetadata] = React.useState<any>(null);
  const [buildError, setBuildError] = React.useState<string | null>(null);

  // Demo chat state
  const [messages, setMessages] = React.useState<Array<{ role: string; content: string }>>([]);
  const [inputValue, setInputValue] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const [messageCount, setMessageCount] = React.useState(0);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll messages
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Magic building animation + API call to create real widget
  React.useEffect(() => {
    if (step !== "building") return;

    let isCancelled = false;
    setBuildError(null);

    // Cycle through magic messages
    const messageInterval = setInterval(() => {
      setMagicMessageIndex((prev) => {
        if (prev < MAGIC_MESSAGES.length - 1) return prev + 1;
        return prev;
      });
    }, 1500);

    // Progress animation (slower, synced with API call)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        // Stop at 90% until API completes
        if (prev >= 90) return 90;
        return prev + 1.5;
      });
    }, 100);

    // Actually create the widget via API
    const createWidget = async () => {
      try {
        const response = await fetch("/api/demo-widget", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url,
            name,
            personality,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create widget");
        }

        const data = await response.json();

        if (isCancelled) return;

        // Store the real widget ID
        setWidgetId(data.widgetId);
        setCrawledMetadata(data.metadata);

        // Complete the progress
        clearInterval(progressInterval);
        setProgress(100);

        // Transition to complete step
        setTimeout(() => {
          if (!isCancelled) setStep("complete");
        }, 500);
      } catch (err: any) {
        console.error("Widget creation error:", err);
        if (!isCancelled) {
          setBuildError(err.message);
          clearInterval(progressInterval);
          clearInterval(messageInterval);
          // Go back to URL step on error
          setTimeout(() => {
            if (!isCancelled) setStep("url");
          }, 2000);
        }
      }
    };

    createWidget();

    return () => {
      isCancelled = true;
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [step, url, name, personality]);

  // Get greeting based on personality
  const getGreeting = () => {
    const trait = PERSONALITY_TRAITS.find((t) => t.id === personality);
    const greetings: Record<string, string> = {
      friendly: `Hi there! 😊 I'm ${name}, your friendly assistant. How can I help you today?`,
      professional: `Welcome. I'm ${name}, here to assist you. How may I help?`,
      witty: `Well hello! ${name} at your service. What brings you to my corner of the internet? 😄`,
      helpful: `Hello! I'm ${name}, and I'm here to help you with anything you need. What can I do for you?`,
      concise: `Hi! ${name} here. How can I help?`,
      enthusiastic: `Hey there! 🎉 I'm ${name} and I'm SO excited to help you today! What's on your mind?`,
    };
    return greetings[personality] || `Hi! I'm ${name}. How can I help you today?`;
  };

  // Send message - uses real chat API with the created widget
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading || !widgetId) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/widget/${widgetId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationId,
          isTest: true, // Mark as test so it doesn't count against limits
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store conversation ID for follow-up messages
        if (data.conversationId && !conversationId) {
          setConversationId(data.conversationId);
        }

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
        setMessageCount((prev) => prev + 1);
      } else {
        // Handle rate limiting or other errors gracefully
        const errorMsg = data.limitReached
          ? "Demo limit reached. Sign up to continue chatting!"
          : "Oops! Something went wrong. Please try again.";
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: errorMsg },
        ]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      // Extract domain name for suggested widget name
      try {
        const domain = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
        const suggestedName = domain.replace("www.", "").split(".")[0];
        setName(suggestedName.charAt(0).toUpperCase() + suggestedName.slice(1) + " Assistant");
      } catch {
        setName("My Assistant");
      }
      setStep("name");
    }
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setStep("personality");
    }
  };

  const handlePersonalitySelect = (traitId: string) => {
    setPersonality(traitId);
    setStep("building");
    setMagicMessageIndex(0);
    setProgress(0);
  };

  const handleTryDemo = () => {
    // Initialize demo with greeting
    setMessages([{ role: "assistant", content: getGreeting() }]);
    setMessageCount(0);
    setConversationId(null);
    setStep("demo");
  };

  const handleStartOver = () => {
    setStep("url");
    setUrl("");
    setName("");
    setPersonality("");
    setProgress(0);
    setMagicMessageIndex(0);
    setWidgetId(null);
    setCrawledMetadata(null);
    setBuildError(null);
    setMessages([]);
    setConversationId(null);
    setMessageCount(0);
  };

  return (
    <div className="relative">
      {/* Background glow effect */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-purple-50 via-pink-50 to-white rounded-3xl" />

      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-neutral-100 p-8 md:p-12">
        {/* Step 1: URL Input */}
        {step === "url" && (
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              Try it free — no signup required
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold mb-4 tracking-tight">
              Build your AI assistant now
            </h2>
            <p className="text-neutral-500 mb-8 text-lg">
              Enter your website URL and watch the magic happen
            </p>
            <form onSubmit={handleUrlSubmit} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
              <div className="flex-1 relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="yourwebsite.com"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-neutral-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 focus:outline-none text-lg transition-all"
                />
              </div>
              <button
                type="submit"
                className="bg-neutral-900 hover:bg-neutral-800 text-white font-medium px-8 py-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>Build my widget</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Name Input */}
        {step === "name" && (
          <div className="text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-lg">
              ✨
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold mb-4 tracking-tight">
              Name your assistant
            </h2>
            <p className="text-neutral-500 mb-8 text-lg">
              Give your widget a name that fits your brand
            </p>
            <form onSubmit={handleNameSubmit} className="max-w-md mx-auto">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Sophie, Helper Bot, Support Assistant"
                className="w-full px-6 py-4 rounded-2xl border border-neutral-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 focus:outline-none text-lg text-center transition-all mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("url")}
                  className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium px-6 py-4 rounded-2xl transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white font-medium px-6 py-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Personality Selection */}
        {step === "personality" && (
          <div className="text-center max-w-3xl mx-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-lg">
              🎭
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold mb-4 tracking-tight">
              Choose a personality
            </h2>
            <p className="text-neutral-500 mb-8 text-lg">
              Pick one trait to get started — you can customize more later
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {PERSONALITY_TRAITS.map((trait) => (
                <button
                  key={trait.id}
                  onClick={() => handlePersonalitySelect(trait.id)}
                  className="group bg-neutral-50 hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 border-2 border-transparent hover:border-purple-200 rounded-2xl p-4 transition-all hover:scale-[1.02] active:scale-[0.98] text-left"
                >
                  <div className="text-3xl mb-2">{trait.emoji}</div>
                  <div className="font-semibold text-neutral-900">{trait.label}</div>
                  <div className="text-sm text-neutral-500">{trait.description}</div>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setStep("name")}
              className="text-neutral-500 hover:text-neutral-700 font-medium transition-colors"
            >
              ← Go back
            </button>
          </div>
        )}

        {/* Step 4: Building Animation */}
        {step === "building" && (
          <div className="text-center max-w-xl mx-auto py-8">
            {/* Magic animation container */}
            <div className="relative w-32 h-32 mx-auto mb-8">
              {/* Outer spinning ring */}
              <div className="absolute inset-0 rounded-full border-4 border-purple-200 border-t-purple-500 animate-spin" />
              {/* Inner pulsing circle */}
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 animate-pulse flex items-center justify-center">
                <span className="text-4xl">✨</span>
              </div>
              {/* Floating particles */}
              <div className="absolute -top-2 left-1/2 w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
              <div className="absolute top-1/2 -right-2 w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              <div className="absolute -bottom-2 left-1/2 w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
              <div className="absolute top-1/2 -left-2 w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "0.6s" }} />
            </div>

            <h2 className="text-2xl md:text-3xl font-semibold mb-3 tracking-tight">
              Creating {name}...
            </h2>
            <p className="text-neutral-500 mb-8 text-lg min-h-[28px] transition-opacity duration-300">
              {buildError ? (
                <span className="text-red-500">{buildError}</span>
              ) : (
                MAGIC_MESSAGES[magicMessageIndex]
              )}
            </p>

            {/* Progress bar */}
            <div className="max-w-sm mx-auto">
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ease-out ${
                    buildError
                      ? "bg-red-500"
                      : "bg-gradient-to-r from-purple-500 to-pink-500"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-neutral-400 mt-2">
                {buildError ? "Error - returning to start..." : `${Math.round(progress)}%`}
              </p>
            </div>
          </div>
        )}

        {/* Step 5: Complete */}
        {step === "complete" && (
          <div className="text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-lg animate-bounce">
              🎉
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold mb-4 tracking-tight">
              {name} is ready!
            </h2>
            <p className="text-neutral-500 mb-8 text-lg">
              Your {PERSONALITY_TRAITS.find(t => t.id === personality)?.label.toLowerCase()} assistant is built
              {crawledMetadata?.crawled ? " and trained on your website" : ""}.
              Sign up to customize further and install it on your site.
            </p>

            {/* Show what was learned */}
            {crawledMetadata?.title && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 mb-6 text-left border border-purple-100">
                <h3 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                  <span className="text-lg">📚</span> What {name} learned
                </h3>
                <div className="space-y-2 text-sm text-neutral-600">
                  {crawledMetadata.title && (
                    <p><span className="font-medium">Business:</span> {crawledMetadata.title}</p>
                  )}
                  {crawledMetadata.description && (
                    <p><span className="font-medium">About:</span> {crawledMetadata.description.substring(0, 150)}...</p>
                  )}
                </div>
              </div>
            )}

            <div className="bg-neutral-50 rounded-2xl p-6 mb-8">
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-neutral-600">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Fully customize personality
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Learn from interactions
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Train to be a superstar
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleTryDemo}
                className="bg-neutral-900 hover:bg-neutral-800 text-white font-medium px-8 py-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>Try the demo</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button
                onClick={handleStartOver}
                className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium px-8 py-4 rounded-2xl transition-colors"
              >
                Start over
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Live Demo */}
        {step === "demo" && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-semibold mb-2 tracking-tight">
                Chat with {name}
              </h2>
              <p className="text-neutral-500">
                Try out your {PERSONALITY_TRAITS.find(t => t.id === personality)?.label.toLowerCase()} assistant!
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Chat Widget */}
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg overflow-hidden">
                {/* Widget Header */}
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">
                    {PERSONALITY_TRAITS.find(t => t.id === personality)?.emoji}
                  </div>
                  <div className="text-white">
                    <div className="font-semibold">{name}</div>
                    <div className="text-xs text-white/80">Online now</div>
                  </div>
                </div>

                {/* Messages */}
                <div className="h-80 overflow-y-auto p-4 space-y-3 bg-neutral-50">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                          msg.role === "user"
                            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                            : "bg-white border border-neutral-200 text-neutral-800"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-neutral-200 rounded-2xl px-4 py-2 text-sm">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-neutral-200 bg-white">
                  {messageCount >= 3 ? (
                    <div className="text-center">
                      <p className="text-sm text-neutral-500 mb-3">
                        You've used your 3 demo messages!
                      </p>
                      <button
                        type="button"
                        onClick={onSignup}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium px-6 py-2 rounded-full text-sm hover:opacity-90 transition-opacity"
                      >
                        Sign up to keep chatting
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 border border-neutral-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10"
                        disabled={isLoading}
                      />
                      <button
                        type="submit"
                        disabled={isLoading || !inputValue.trim()}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>
                    </div>
                  )}
                  {messageCount > 0 && messageCount < 3 && (
                    <p className="text-xs text-neutral-400 text-center mt-2">
                      {3 - messageCount} messages left in demo
                    </p>
                  )}
                </form>
              </div>

              {/* Sign Up CTA */}
              <div className="flex flex-col justify-center">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100">
                  <h3 className="text-xl font-semibold mb-4">
                    Love it? Make it yours!
                  </h3>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-neutral-700">Train it on your actual website content</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-neutral-700">Customize colors, logo, and messaging</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-neutral-700">Install with one line of code</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-neutral-700">View conversations and improve over time</span>
                    </li>
                  </ul>
                  <button
                    onClick={onSignup}
                    className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-medium px-6 py-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Sign up free — no credit card required
                  </button>
                  <button
                    onClick={handleStartOver}
                    className="w-full text-neutral-500 hover:text-neutral-700 font-medium mt-3 transition-colors text-sm"
                  >
                    ← Build another widget
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
