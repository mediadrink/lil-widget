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

type BuilderStep = "url" | "name" | "personality" | "building" | "complete";

interface WidgetBuilderProps {
  onComplete?: (data: { url: string; name: string; personality: string }) => void;
}

export default function WidgetBuilder({ onComplete }: WidgetBuilderProps) {
  const [step, setStep] = React.useState<BuilderStep>("url");
  const [url, setUrl] = React.useState("");
  const [name, setName] = React.useState("");
  const [personality, setPersonality] = React.useState("");
  const [magicMessageIndex, setMagicMessageIndex] = React.useState(0);
  const [progress, setProgress] = React.useState(0);

  // Magic building animation
  React.useEffect(() => {
    if (step !== "building") return;

    const messageInterval = setInterval(() => {
      setMagicMessageIndex((prev) => {
        if (prev < MAGIC_MESSAGES.length - 1) return prev + 1;
        return prev;
      });
    }, 1500);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          clearInterval(messageInterval);
          setTimeout(() => setStep("complete"), 500);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [step]);

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
    onComplete?.({ url, name, personality });
  };

  const handleStartOver = () => {
    setStep("url");
    setUrl("");
    setName("");
    setPersonality("");
    setProgress(0);
    setMagicMessageIndex(0);
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
              {MAGIC_MESSAGES[magicMessageIndex]}
            </p>

            {/* Progress bar */}
            <div className="max-w-sm mx-auto">
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-neutral-400 mt-2">{progress}%</p>
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
              Your {PERSONALITY_TRAITS.find(t => t.id === personality)?.label.toLowerCase()} assistant is built.
              Sign up to customize further, train it with your data, and install it on your site.
            </p>

            <div className="bg-neutral-50 rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-center gap-4 text-sm text-neutral-600">
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
      </div>
    </div>
  );
}
