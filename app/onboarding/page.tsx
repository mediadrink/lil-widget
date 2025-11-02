"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const StripePaymentForm = dynamic(() => import("@/app/components/StripePaymentForm"), {
  ssr: false,
});

type Step = "basics" | "verify-email" | "crawl" | "persona" | "test" | "install";

const STEP_ORDER: Step[] = ["basics", "verify-email", "crawl", "persona", "test", "install"];

const STEP_INFO = {
  basics: { number: 1, label: "Basic Info", total: 6 },
  "verify-email": { number: 2, label: "Verify Email", total: 6 },
  crawl: { number: 3, label: "Website Analysis", total: 6 },
  persona: { number: 4, label: "Personality", total: 6 },
  test: { number: 5, label: "Test Chat", total: 6 },
  install: { number: 6, label: "Install Code", total: 6 },
};

// Parse markdown for chat messages
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

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState<Step>("basics");
  const [widgetId, setWidgetId] = React.useState<string | null>(null);

  const [widgetName, setWidgetName] = React.useState("");
  const [websiteUrl, setWebsiteUrl] = React.useState("");
  const [selectedIndustry, setSelectedIndustry] = React.useState("");
  const [personaText, setPersonaText] = React.useState("");

  const [crawling, setCrawling] = React.useState(false);
  const [crawlSummary, setCrawlSummary] = React.useState("");
  const [crawlError, setCrawlError] = React.useState("");
  const [businessDescription, setBusinessDescription] = React.useState("");
  const [learningStatement, setLearningStatement] = React.useState("");
  const [crawlMetadata, setCrawlMetadata] = React.useState<any>(null);
  const [deepCrawling, setDeepCrawling] = React.useState(false);
  const [deepCrawlResult, setDeepCrawlResult] = React.useState<any>(null);
  const [isPaidUser, setIsPaidUser] = React.useState(false);
  const [upgradingTier, setUpgradingTier] = React.useState(false);
  const [paymentClientSecret, setPaymentClientSecret] = React.useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = React.useState(false);

  const [testMessage, setTestMessage] = React.useState("");
  const [testConversation, setTestConversation] = React.useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [testLoading, setTestLoading] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // Persona generation states
  const [generatingPersona, setGeneratingPersona] = React.useState(false);

  // Email verification states
  const [userEmail, setUserEmail] = React.useState("");
  const [isEmailVerified, setIsEmailVerified] = React.useState(false);
  const [resendCooldown, setResendCooldown] = React.useState(0);
  const [checkingVerification, setCheckingVerification] = React.useState(false);

  // Check user's subscription tier and email verification on mount
  React.useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch("/api/auth/user");
        if (res.ok) {
          const data = await res.json();
          setIsPaidUser(data.user?.user_metadata?.subscription_tier === "paid");
          setUserEmail(data.user?.email || "");
          setIsEmailVerified(!!data.user?.email_confirmed_at);
        }
      } catch (err) {
        console.error("Failed to check user:", err);
      }
    }
    checkUser();
  }, []);

  // Check for payment success and poll for upgrade
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentSuccess = params.get("payment_success");

    if (paymentSuccess === "true" && !isPaidUser) {
      // Poll for user upgrade (webhook might take a moment)
      const pollInterval = setInterval(async () => {
        try {
          const res = await fetch("/api/auth/user");
          if (res.ok) {
            const data = await res.json();
            if (data.user?.user_metadata?.subscription_tier === "paid") {
              setIsPaidUser(true);
              clearInterval(pollInterval);
              // Clear URL params
              window.history.replaceState({}, "", "/onboarding");
            }
          }
        } catch (err) {
          console.error("Failed to poll user status:", err);
        }
      }, 2000); // Check every 2 seconds

      // Stop polling after 30 seconds
      setTimeout(() => clearInterval(pollInterval), 30000);

      return () => clearInterval(pollInterval);
    }
  }, [isPaidUser]);

  // Poll for email verification when on verify-email step
  React.useEffect(() => {
    if (currentStep !== "verify-email") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/auth/user");
        if (res.ok) {
          const data = await res.json();
          if (data.user?.email_confirmed_at) {
            setIsEmailVerified(true);
            setCurrentStep("crawl");
          }
        }
      } catch (err) {
        console.error("Failed to poll verification:", err);
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [currentStep]);

  // Cooldown timer for resend button
  React.useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setTimeout(() => {
      setResendCooldown(resendCooldown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Auto-generate persona when reaching persona step
  React.useEffect(() => {
    if (currentStep !== "persona") return;
    if (personaText) return; // Already have persona

    // Generate persona from crawl data
    async function autoGeneratePersona() {
      try {
        setGeneratingPersona(true);

        if (deepCrawlResult || crawlMetadata) {
          const res = await fetch("/api/generate-persona", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              widgetName,
              websiteUrl,
              industry: "custom",
              crawlType: deepCrawlResult ? "deep" : "basic",
              crawledData: deepCrawlResult || crawlMetadata,
            }),
          });

          const data = await res.json();
          if (res.ok) {
            setPersonaText(data.persona);
          } else {
            // Fallback to simple persona
            setPersonaText(`You are a helpful AI assistant for ${widgetName}. Answer questions about the business, provide information, and help visitors with their needs. Keep responses clear and friendly.`);
          }
        } else {
          // No crawl data available
          setPersonaText(`You are a helpful AI assistant for ${widgetName}. Answer questions about the business, provide information, and help visitors with their needs. Keep responses clear and friendly.`);
        }
      } catch (err) {
        console.error("Failed to generate persona:", err);
        setPersonaText(`You are a helpful AI assistant for ${widgetName}. Answer questions about the business, provide information, and help visitors with their needs. Keep responses clear and friendly.`);
      } finally {
        setGeneratingPersona(false);
      }
    }

    autoGeneratePersona();
  }, [currentStep, widgetName, websiteUrl, deepCrawlResult, crawlMetadata, personaText]);

  // Generate intelligent persona from crawl data and industry template
  function generatePersona(industryId: string): string {
    const industry = INDUSTRIES.find((i) => i.id === industryId);
    if (!industry) return "";

    let persona = industry.prompt;

    // If we have crawl metadata, enhance the persona
    if (crawlMetadata) {
      const { title, description, location, services, aboutText } = crawlMetadata;

      // Add context about the business
      if (title || description) {
        persona = `You are an AI assistant for ${widgetName || "this company"}`;
        if (title) {
          persona += `, specializing in: ${title}`;
        }
        persona += `. `;
      }

      // Add location context
      if (location) {
        persona += `The business is located in ${location}. `;
      }

      // Add services context
      if (services && services.length > 0) {
        persona += `Services offered include: ${services.slice(0, 5).join(", ")}. `;
      }

      // Add story/about context
      if (aboutText) {
        persona += `Company background: ${aboutText.substring(0, 200)}. `;
      }

      // Append industry-specific guidance
      persona += `\n\n${industry.prompt}`;
    }

    return persona;
  }

  const INDUSTRIES = [
    { 
      id: "legal", 
      label: "Legal Services", 
      icon: "Legal",
      prompt: "You are an AI assistant for a law firm. Provide helpful information while being careful not to give legal advice. Always recommend scheduling a consultation for specific legal matters. Be professional, authoritative, and empathetic." 
    },
    { 
      id: "healthcare", 
      label: "Healthcare & Medical", 
      icon: "Health",
      prompt: "You are an AI assistant for a healthcare practice. Be compassionate and informative while being careful not to provide medical diagnosis. Always recommend consulting with a healthcare professional for specific concerns. Maintain patient privacy and be empathetic." 
    },
    { 
      id: "restaurant", 
      label: "Restaurant & Food Service", 
      icon: "Food",
      prompt: "You are an AI assistant for a restaurant. Be enthusiastic about the food and atmosphere. Help with reservations, menu questions, hours, and directions. Use a friendly and welcoming tone that makes guests feel excited to visit." 
    },
    { 
      id: "realestate", 
      label: "Real Estate", 
      icon: "Home",
      prompt: "You are an AI assistant for a real estate agency. Be knowledgeable about properties, neighborhoods, and the buying/selling process. Build trust and encourage scheduling viewings or consultations. Be professional yet friendly and helpful." 
    },
    { 
      id: "ecommerce", 
      label: "E-commerce & Retail", 
      icon: "Shop",
      prompt: "You are an AI assistant for an online store. Help customers find products, answer questions about shipping and returns, and make purchase recommendations. Be friendly, helpful, and persuasive without being pushy." 
    },
    { 
      id: "saas", 
      label: "SaaS & Technology", 
      icon: "Tech",
      prompt: "You are an AI assistant for a software company. Explain features clearly, help with technical questions, and guide users toward demos or trials. Balance being technical when needed with keeping things simple and accessible." 
    },
    { 
      id: "fitness", 
      label: "Fitness & Wellness", 
      icon: "Fitness",
      prompt: "You are an AI assistant for a fitness center or wellness business. Be motivational and supportive. Help with class schedules, membership questions, and booking sessions. Encourage healthy habits with a positive, energetic tone." 
    },
    {
      id: "custom",
      label: "Custom",
      sublabel: "Other Industry",
      icon: "✨",
      prompt: ""
    },
  ];

  async function generateAIPersona(industryId: string, crawlType: "basic" | "deep", metadata: any) {
    setGeneratingPersona(true);

    try {
      const res = await fetch("/api/generate-persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          widgetName,
          websiteUrl,
          industry: industryId,
          crawlType,
          crawledData: metadata,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate persona");
      }

      setPersonaText(data.persona);
    } catch (err: any) {
      console.error("Persona generation error:", err);
      // Fallback to old method if AI fails
      setPersonaText(generatePersona(industryId));
    } finally {
      setGeneratingPersona(false);
    }
  }

  async function crawlWebsite() {
    if (!websiteUrl.trim()) return;

    setCrawling(true);
    setCrawlError("");
    setCrawlSummary("");

    try {
      const res = await fetch("/api/crawl-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: websiteUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to crawl website");
      }

      setCrawlSummary(data.summary || "Successfully analyzed your website!");
      setBusinessDescription(data.businessDescription || "");
      setLearningStatement(data.learningStatement || "");
      setCrawlMetadata(data.metadata || null);
    } catch (err: any) {
      setCrawlError(err.message || "Could not crawl website. You can continue anyway.");
    } finally {
      setCrawling(false);
    }
  }

  async function upgradeToPaid() {
    setUpgradingTier(true);
    try {
      // Ensure we have user email
      if (!userEmail) {
        // Try to fetch user email again
        const userRes = await fetch("/api/auth/user");
        if (userRes.ok) {
          const userData = await userRes.json();
          const email = userData.user?.email;
          if (email) {
            setUserEmail(email);
          } else {
            throw new Error("No email found. Please refresh the page and try again.");
          }
        } else {
          throw new Error("Not authenticated. Please refresh the page and try again.");
        }
      }

      // Ensure widget is created first
      const createdWidgetId = await ensureWidgetCreated();
      if (!createdWidgetId && !widgetId) {
        throw new Error("Could not create or find widget");
      }

      // Create Stripe subscription with payment intent
      const res = await fetch("/api/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          priceId: "price_1SOtw9EVxGVhW8Bvp0U9ef3u"
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create subscription");
      }

      const { clientSecret } = await res.json();

      // Show embedded payment form
      setPaymentClientSecret(clientSecret);
      setShowPaymentForm(true);
      setUpgradingTier(false);
    } catch (err: any) {
      console.error("Upgrade error:", err);
      alert(err.message || "Failed to start payment. Please try again.");
      setUpgradingTier(false);
    }
  }

  function handlePaymentSuccess() {
    setShowPaymentForm(false);
    setIsPaidUser(true);
    // Auto-run deep crawl after successful payment
    runDeepCrawl();
  }

  function handlePaymentError(error: string) {
    alert(`Payment failed: ${error}`);
    setShowPaymentForm(false);
    setPaymentClientSecret(null);
  }

  async function runDeepCrawl() {
    if (!websiteUrl.trim()) return;

    setDeepCrawling(true);

    try {
      // Ensure widget is created first if not already
      const createdWidgetId = await ensureWidgetCreated();
      const activeWidgetId = createdWidgetId || widgetId;

      if (!activeWidgetId) {
        throw new Error("Widget not found. Please try creating your widget again.");
      }

      const res = await fetch("/api/crawl-deep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: websiteUrl, widgetId: activeWidgetId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to perform expanded crawl");
      }

      setDeepCrawlResult(data);
    } catch (err: any) {
      console.error("Deep crawl error:", err);
      alert(err.message || "Expanded crawl failed. Please try again.");
    } finally {
      setDeepCrawling(false);
    }
  }

  async function resendVerificationEmail() {
    if (resendCooldown > 0) return;

    setResendCooldown(60); // 60 second cooldown

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error("Failed to resend email");
      }
    } catch (err: any) {
      alert(err.message || "Failed to resend verification email");
      setResendCooldown(0);
    }
  }

  async function createWidget() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/widgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: widgetName,
          url: websiteUrl,
          persona_text: personaText || "You are a helpful AI assistant.",
          crawl_tier: isPaidUser ? "deep" : "basic",
          industry: selectedIndustry || "custom",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create widget");
      }

      const data = await res.json();
      setWidgetId(data.widget.id);
      setCurrentStep("test");
    } catch (err: any) {
      setError(err.message || "Failed to create widget");
    } finally {
      setLoading(false);
    }
  }

  async function updateWidget() {
    if (!widgetId) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/widgets/" + widgetId, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona_text: personaText,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update widget");
      }

      setCurrentStep("test");
    } catch (err: any) {
      setError(err.message || "Failed to update widget");
    } finally {
      setLoading(false);
    }
  }

  async function ensureWidgetCreated() {
    if (widgetId) {
      return widgetId; // Already created
    }

    // Check if user already has a widget with this URL
    try {
      const checkRes = await fetch("/api/widgets");
      if (checkRes.ok) {
        const data = await checkRes.json();
        const widgets = data.widgets || [];
        const existingWidget = widgets.find((w: any) => w.url === websiteUrl || w.title === widgetName);
        if (existingWidget) {
          console.log("Found existing widget:", existingWidget.id);
          setWidgetId(existingWidget.id);
          return existingWidget.id;
        }
      }
    } catch (err) {
      console.error("Failed to check existing widgets:", err);
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/widgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: widgetName,
          url: websiteUrl,
          persona_text: "You are a helpful AI assistant.",
          crawl_tier: "basic",
          industry: "custom",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create widget");
      }

      const data = await res.json();
      setWidgetId(data.widget.id);
      return data.widget.id;
    } catch (err: any) {
      setError(err.message || "Failed to create widget");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function sendTestMessage() {
    if (!testMessage.trim() || !widgetId) return;

    setTestLoading(true);
    setTestConversation((prev) => [...prev, { role: "user", content: testMessage }]);
    const userMsg = testMessage;
    setTestMessage("");

    try {
      const res = await fetch("/api/widget/" + widgetId + "/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });

      if (!res.ok) throw new Error("Failed");

      const data = await res.json();
      setTestConversation((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || "No response" },
      ]);
    } catch {
      setTestConversation((prev) => [
        ...prev,
        { role: "assistant", content: "Error: Could not get response" },
      ]);
    } finally {
      setTestLoading(false);
    }
  }

  function completeOnboarding() {
    router.push("/dashboard/widgets/" + widgetId + "/admin-console");
  }

  const embedCode = widgetId
    ? "<script src=\"" + (typeof window !== 'undefined' ? window.location.origin : '') + "/widget.js\" data-id=\"" + widgetId + "\" data-base-url=\"" + (typeof window !== 'undefined' ? window.location.origin : '') + "\"></script>"
    : "";

  const stepIndex = STEP_ORDER.indexOf(currentStep);

  const selectedIndustryObj = INDUSTRIES.find(i => i.id === selectedIndustry);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Enhanced Progress Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-medium text-neutral-700">
              Step {STEP_INFO[currentStep].number} of {STEP_INFO[currentStep].total}
            </span>
            <span className="text-neutral-600">{STEP_INFO[currentStep].label}</span>
          </div>
          <div className="flex items-center gap-2">
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className={"h-2 flex-1 rounded-full transition-all duration-300 " + (stepIndex >= idx ? "bg-amber-400" : "bg-neutral-200")}
              />
            ))}
          </div>
          <div className="mt-2 text-xs text-neutral-500 text-center">
            {Math.round((stepIndex / 5) * 100)}% complete
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-12">
        {currentStep === "basics" && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 shadow-sm">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-3">Let's Start with the Basics</h2>
              <p className="text-lg text-neutral-600">Give your widget a name and tell us where it'll live.</p>
            </div>

            <div className="space-y-8 mb-10">
              {/* Widget Name */}
              <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-200">
                <div className="flex items-start gap-3 mb-4">
                  <div className="bg-amber-400 rounded-full w-8 h-8 flex items-center justify-center font-bold text-neutral-900 flex-shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <label className="block text-lg font-bold text-neutral-900 mb-1">
                      Widget Name
                    </label>
                    <p className="text-sm text-neutral-600 mb-3">
                      💡 <strong>Why we need this:</strong> This helps you organize multiple widgets in your dashboard. Visitors won't see this name.
                    </p>
                    <input
                      type="text"
                      required
                      className="w-full rounded-lg border-2 border-neutral-300 focus:border-amber-400 focus:outline-none px-4 py-3 text-base transition-colors bg-white"
                      placeholder="e.g., My Restaurant Chat, Support Widget, Sales Bot"
                      value={widgetName}
                      onChange={(e) => setWidgetName(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Website URL */}
              <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-200">
                <div className="flex items-start gap-3 mb-4">
                  <div className="bg-amber-400 rounded-full w-8 h-8 flex items-center justify-center font-bold text-neutral-900 flex-shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <label className="block text-lg font-bold text-neutral-900 mb-1">
                      Your Website URL
                    </label>
                    <p className="text-sm text-neutral-600 mb-3">
                      💡 <strong>Why we need this:</strong> We'll analyze your website to understand your business and create a personalized AI assistant that knows your products, services, and brand.
                    </p>
                    <input
                      type="text"
                      required
                      className="w-full rounded-lg border-2 border-neutral-300 focus:border-amber-400 focus:outline-none px-4 py-3 text-base transition-colors bg-white"
                      placeholder="example.com or https://www.example.com"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                    />
                    <p className="text-xs text-neutral-500 mt-2 flex items-center gap-1">
                      <span>✓</span> You can enter just the domain - we'll handle the rest
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (isEmailVerified) {
                    setCurrentStep("crawl");
                  } else {
                    setCurrentStep("verify-email");
                  }
                }}
                disabled={!widgetName.trim() || !websiteUrl.trim()}
                className="w-full rounded-lg bg-amber-400 hover:bg-amber-500 text-neutral-900 font-bold px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {currentStep === "verify-email" && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 shadow-sm">
            <div className="text-center mb-8">
              <div className="text-6xl mb-6">📧</div>
              <h2 className="text-3xl font-bold mb-3">Verify Your Email</h2>
              <p className="text-lg text-neutral-600 mb-2">
                We sent a verification link to:
              </p>
              <p className="text-xl font-semibold text-amber-600 mb-6">{userEmail}</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8 max-w-md mx-auto">
              <h3 className="font-semibold text-amber-900 mb-3">Why verify your email?</h3>
              <ul className="space-y-2 text-sm text-amber-800">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600">✓</span>
                  <span>Secure your account and widget data</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600">✓</span>
                  <span>Unlock AI-powered website analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600">✓</span>
                  <span>Get notified about your widget activity</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600">✓</span>
                  <span>Access premium features and support</span>
                </li>
              </ul>
            </div>

            {checkingVerification && (
              <div className="text-center mb-6">
                <div className="inline-block animate-pulse text-emerald-600 font-semibold">
                  ✓ Email verified! Continuing...
                </div>
              </div>
            )}

            <div className="text-center mb-8">
              <p className="text-sm text-neutral-600 mb-4">
                Click the verification link in your email to continue
              </p>
              <p className="text-xs text-neutral-500 mb-3">
                Don't see it? Check your spam folder
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 max-w-md mx-auto">
                <p className="text-xs text-blue-800">
                  💡 <strong>Tip:</strong> The verification link will open in a new tab. Stay on this page - it will automatically detect when you verify and continue the setup.
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={async () => {
                    setCheckingVerification(true);
                    try {
                      const res = await fetch("/api/auth/user");
                      if (res.ok) {
                        const data = await res.json();
                        if (data.user?.email_confirmed_at) {
                          setIsEmailVerified(true);
                          setTimeout(() => {
                            setCurrentStep("crawl");
                          }, 500);
                        } else {
                          alert("Email not verified yet. Please click the link in your email first.");
                        }
                      }
                    } catch (err) {
                      console.error("Failed to check verification:", err);
                      alert("Failed to check verification status. Please try again.");
                    } finally {
                      setCheckingVerification(false);
                    }
                  }}
                  disabled={checkingVerification}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {checkingVerification ? "Checking..." : "I've Verified My Email →"}
                </button>
                <button
                  onClick={resendVerificationEmail}
                  disabled={resendCooldown > 0}
                  className="rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium px-6 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Resend Email"}
                </button>
              </div>
            </div>

            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6 text-center">
              <p className="text-sm text-neutral-700 font-medium mb-2">
                ✓ Progress Saved!
              </p>
              <p className="text-xs text-neutral-600">
                We've saved your widget info: <strong>{widgetName}</strong> for{" "}
                <strong>{websiteUrl}</strong>
              </p>
              <p className="text-xs text-neutral-500 mt-2">
                Once you verify, you'll pick up right where you left off
              </p>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setCurrentStep("basics")}
                className="rounded-lg border-2 border-neutral-300 text-neutral-700 font-medium px-6 py-3 hover:bg-neutral-50 transition-colors"
              >
                ← Back to Edit Info
              </button>
            </div>
          </div>
        )}

        {currentStep === "crawl" && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 shadow-sm">
            <h2 className="text-3xl font-bold mb-2">Analyzing Your Website</h2>
            <p className="text-neutral-600 mb-8">
              We'll crawl your website to understand your business and create a better starting point for your widget.
            </p>

            {!crawlSummary && !crawlError && !crawling && (
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-8 mb-8 text-center">
                <div className="text-4xl mb-4">Website</div>
                <p className="text-lg font-semibold mb-2">{websiteUrl}</p>
                <p className="text-sm text-neutral-600">Ready to analyze this website</p>
              </div>
            )}

            {crawling && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 mb-8 text-center">
                <div className="text-4xl mb-4 animate-pulse">Loading...</div>
                <p className="text-lg font-semibold mb-2">Crawling your website...</p>
                <p className="text-sm text-neutral-600">This may take 10-30 seconds</p>
              </div>
            )}

            {crawlSummary && !deepCrawlResult && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 mb-8">
                <div className="flex items-start gap-3 mb-4">
                  <div className="text-2xl">✓</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-emerald-900 mb-3">Website Analyzed Successfully!</h3>
                    <p className="text-base text-neutral-700">
                      We've gathered information about your business from your website. This will help create a personalized AI assistant on the next step.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {deepCrawling && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 mb-8 text-center">
                <div className="text-4xl mb-4 animate-pulse">🔍</div>
                <p className="text-lg font-semibold mb-2">Running Expanded Crawl...</p>
                <p className="text-sm text-neutral-600">Analyzing multiple pages, extracting services, team info, and more. This may take 30-60 seconds.</p>
              </div>
            )}

            {deepCrawlResult && (
              <div className="bg-gradient-to-br from-blue-50 to-emerald-50 border-2 border-blue-300 rounded-xl p-8 mb-8">
                <div className="flex items-start gap-3 mb-4">
                  <div className="text-3xl">✨</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-block bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-900 text-xs font-bold px-3 py-1 rounded-full">
                        ⭐ PREMIUM
                      </span>
                      <h3 className="font-bold text-blue-900">Deep Knowledge Base Created!</h3>
                    </div>

                    <div className="bg-white rounded-lg p-5 border border-blue-200 mb-4 shadow-sm">
                      {/* Data Richness Score */}
                      {deepCrawlResult.analysis?.completeness !== undefined && (
                        <div className="mb-4 pb-4 border-b border-neutral-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-neutral-700">Data Richness</span>
                            <span className="text-2xl font-bold text-blue-600">{deepCrawlResult.analysis.completeness}%</span>
                          </div>
                          <div className="w-full bg-neutral-200 rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-emerald-500 h-3 rounded-full transition-all duration-500"
                              style={{ width: `${deepCrawlResult.analysis.completeness}%` }}
                            />
                          </div>
                          <p className="text-xs text-neutral-600 mt-2">
                            Based on the variety of structured information found on your website
                          </p>
                        </div>
                      )}

                      {/* Summary with formatting preserved */}
                      <div className="text-sm text-neutral-800 leading-relaxed whitespace-pre-line mb-4">
                        {deepCrawlResult.summary}
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mt-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
                          <div className="font-semibold text-neutral-700 text-xs">Pages Analyzed</div>
                          <div className="text-2xl font-bold text-blue-600">{deepCrawlResult.pagesAnalyzed || 0}</div>
                        </div>
                        {deepCrawlResult.dataExtracted?.services > 0 && (
                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
                            <div className="font-semibold text-neutral-700 text-xs">Services</div>
                            <div className="text-2xl font-bold text-purple-600">{deepCrawlResult.dataExtracted.services}</div>
                          </div>
                        )}
                        {deepCrawlResult.dataExtracted?.team > 0 && (
                          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-3 border border-emerald-200">
                            <div className="font-semibold text-neutral-700 text-xs">Team Members</div>
                            <div className="text-2xl font-bold text-emerald-600">{deepCrawlResult.dataExtracted.team}</div>
                          </div>
                        )}
                        {deepCrawlResult.dataExtracted?.menuItems > 0 && (
                          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-3 border border-amber-200">
                            <div className="font-semibold text-neutral-700 text-xs">Menu Items</div>
                            <div className="text-2xl font-bold text-amber-600">{deepCrawlResult.dataExtracted.menuItems}</div>
                          </div>
                        )}
                        {deepCrawlResult.dataExtracted?.clientWork > 0 && (
                          <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-3 border border-pink-200">
                            <div className="font-semibold text-neutral-700 text-xs">Portfolio</div>
                            <div className="text-2xl font-bold text-pink-600">{deepCrawlResult.dataExtracted.clientWork}</div>
                          </div>
                        )}
                        {deepCrawlResult.dataExtracted?.faq > 0 && (
                          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg p-3 border border-cyan-200">
                            <div className="font-semibold text-neutral-700 text-xs">FAQ Entries</div>
                            <div className="text-2xl font-bold text-cyan-600">{deepCrawlResult.dataExtracted.faq}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
                      <p className="text-sm text-blue-900 font-medium">
                        🎯 Your widget now has access to this detailed knowledge base as a reference tool during conversations. Visitors will get much more accurate, specific answers!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {crawlError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-8 mb-8">
                <div className="flex items-start gap-3 mb-4">
                  <div className="text-2xl">Error</div>
                  <div>
                    <h3 className="font-bold text-red-900 mb-2">Could Not Crawl Website</h3>
                    <p className="text-sm text-red-700">{crawlError}</p>
                    <p className="text-sm text-red-700 mt-2">You can still continue and set up the widget manually.</p>
                  </div>
                </div>
              </div>
            )}

            {crawlSummary && !deepCrawlResult && !deepCrawling && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-xl p-6 mb-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-block bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-900 text-xs font-bold px-3 py-1 rounded-full">
                        ⭐ PREMIUM
                      </span>
                      <h4 className="font-bold text-neutral-900">
                        Unlock Deep Knowledge Base
                      </h4>
                    </div>
                    <p className="text-sm text-neutral-700 mb-4">
                      <strong>Expanded Crawl</strong> analyzes 10+ pages of your website to extract comprehensive business information: full service lists, team bios, menu items, portfolio, FAQ, and more. Your widget will have access to detailed knowledge as a reference tool during conversations.
                    </p>
                    <div className="bg-white/70 border border-blue-200 rounded-lg p-3 mb-4">
                      <p className="text-xs text-neutral-600 font-medium mb-2">What you'll get:</p>
                      <ul className="text-xs text-neutral-700 space-y-1">
                        <li>✓ Detailed services & offerings extraction</li>
                        <li>✓ Team member profiles & bios</li>
                        <li>✓ Menu items with pricing (for restaurants)</li>
                        <li>✓ Portfolio & client work examples</li>
                        <li>✓ FAQ content for common questions</li>
                        <li>✓ Analysis report showing what was found & missing</li>
                      </ul>
                    </div>
                    {isPaidUser ? (
                      <button
                        onClick={runDeepCrawl}
                        disabled={deepCrawling || upgradingTier}
                        className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 text-sm disabled:opacity-50 transition-colors shadow-sm"
                      >
                        {deepCrawling || upgradingTier ? "Crawling..." : "🚀 Run Expanded Crawl (10 pages)"}
                      </button>
                    ) : showPaymentForm && paymentClientSecret ? (
                      <div className="max-w-lg">
                        <div className="mb-4">
                          <h5 className="font-semibold text-neutral-900 mb-1">Growth Plan - $19/month</h5>
                          <p className="text-sm text-neutral-600">Enter your payment details to unlock expanded crawl</p>
                        </div>
                        <StripePaymentForm
                          clientSecret={paymentClientSecret}
                          onSuccess={handlePaymentSuccess}
                          onError={handlePaymentError}
                        />
                        <button
                          onClick={() => {
                            setShowPaymentForm(false);
                            setPaymentClientSecret(null);
                          }}
                          className="mt-3 text-sm text-neutral-500 hover:text-neutral-700 underline"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={upgradeToPaid}
                        disabled={upgradingTier}
                        className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-2.5 text-sm disabled:opacity-50 transition-colors shadow-sm"
                      >
                        {upgradingTier ? "Loading payment form..." : "⭐ Upgrade to Enable Expanded Crawl"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep("basics")}
                className="rounded-lg border-2 border-neutral-300 text-neutral-700 font-medium px-6 py-3 hover:bg-neutral-50 transition-colors"
              >
                ← Back
              </button>
              {!crawlSummary && !crawlError && (
                <button
                  onClick={crawlWebsite}
                  disabled={crawling}
                  className="flex-1 rounded-lg bg-amber-400 hover:bg-amber-500 text-neutral-900 font-bold px-8 py-3 disabled:opacity-50 transition-colors text-lg"
                >
                  {crawling ? "Analyzing..." : "Analyze Website"}
                </button>
              )}
              {(crawlSummary || crawlError || deepCrawlResult) && (
                <button
                  onClick={() => setCurrentStep("persona")}
                  className="flex-1 rounded-lg bg-amber-400 hover:bg-amber-500 text-neutral-900 font-bold px-8 py-3 transition-colors text-lg"
                >
                  Continue →
                </button>
              )}
              {crawlError && (
                <button
                  onClick={crawlWebsite}
                  disabled={crawling}
                  className="rounded-lg border-2 border-neutral-300 text-neutral-700 font-medium px-6 py-3 hover:bg-neutral-50 transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
            {(crawlSummary || crawlError) && (
              <div className="mt-3 text-center">
                <button
                  onClick={() => setCurrentStep("persona")}
                  className="text-sm text-neutral-500 hover:text-neutral-700 underline transition-colors"
                >
                  Skip website analysis
                </button>
              </div>
            )}
          </div>
        )}

        {currentStep === "persona" && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 shadow-sm">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">🎭</div>
              <h2 className="text-3xl font-bold mb-3">Define Your Widget's Personality</h2>
              <p className="text-lg text-neutral-600">
                We've created a starting point based on your website. Review and customize it to match your brand voice.
              </p>
            </div>

            <div className="space-y-6 mb-8">
              {/* Industry Selector for data collection only */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  What industry are you in?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {INDUSTRIES.map((industry) => (
                    <button
                      key={industry.id}
                      onClick={() => {
                        setSelectedIndustry(industry.id);
                      }}
                      className={"p-2 rounded-lg border-2 text-left transition-all " + (selectedIndustry === industry.id ? "border-amber-400 bg-amber-50" : "border-neutral-200 hover:border-neutral-300")}
                    >
                      <div className="text-base mb-0.5">{industry.icon}</div>
                      <div className="font-medium text-xs leading-tight">{industry.label}</div>
                      {industry.sublabel && (
                        <div className="text-[10px] text-neutral-500 mt-0.5">{industry.sublabel}</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Personality Editor with Strong Encouragement to Edit */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-base font-bold text-neutral-900">
                    Your Widget's Personality
                  </label>
                  {(deepCrawlResult || crawlMetadata) && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                      ✨ Generated from your website
                    </span>
                  )}
                </div>

                {/* Prominent Edit Encouragement Box */}
                <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">👉</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-amber-900 mb-2">Please review and customize!</h3>
                      <p className="text-sm text-amber-800 mb-3">
                        This is a starting point. <strong>Read it carefully and edit it</strong> to match exactly how you want your widget to communicate with visitors.
                      </p>
                      <div className="bg-white/60 rounded-lg p-3 text-xs text-amber-900 space-y-1">
                        <p><strong>💡 Common adjustments:</strong></p>
                        <p>• <strong>Brevity:</strong> Add "Keep responses brief and concise, 1-2 sentences maximum"</p>
                        <p>• <strong>Tone:</strong> Adjust formality level (professional, friendly, casual)</p>
                        <p>• <strong>Actions:</strong> Specify what to do (schedule calls, share links, collect emails)</p>
                      </div>
                    </div>
                  </div>
                </div>

                {generatingPersona ? (
                  <div className="w-full rounded-lg border-2 border-blue-200 bg-blue-50 px-4 py-3 min-h-[200px] flex flex-col items-center justify-center">
                    <div className="text-4xl mb-3 animate-pulse">✨</div>
                    <p className="text-base font-bold text-neutral-900 mb-2">
                      Generating personality from your website...
                    </p>
                    <p className="text-sm text-neutral-600 text-center">
                      This will take just a moment
                    </p>
                  </div>
                ) : (
                  <textarea
                    className="w-full rounded-lg border-2 border-neutral-300 focus:border-amber-400 focus:outline-none px-4 py-3 text-sm transition-colors min-h-[220px] font-mono"
                    placeholder="Example: You are a helpful assistant for [Company]. Keep responses brief and friendly. When asked about pricing, direct visitors to schedule a call. Respond in 1-2 sentences maximum."
                    value={personaText}
                    onChange={(e) => setPersonaText(e.target.value)}
                  />
                )}
              </div>

              {/* Dashboard Edit Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-900">
                  <strong>📝 You can always edit this later!</strong> After setup, you can modify your widget's personality and add custom rules from your dashboard at any time.
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep("crawl")}
                className="rounded-lg border-2 border-neutral-900 text-neutral-900 font-medium px-6 py-3 hover:bg-neutral-50 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => {
                  if (widgetId) {
                    updateWidget();
                  } else {
                    createWidget();
                  }
                }}
                disabled={!personaText.trim() || loading}
                className="flex-1 rounded-lg bg-amber-400 hover:bg-amber-500 text-neutral-900 font-bold px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
              >
                {loading ? (widgetId ? "Updating..." : "Creating Your Widget...") : "Continue to Test →"}
              </button>
            </div>
          </div>
        )}

        {currentStep === "test" && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 shadow-sm">
            <h2 className="text-3xl font-bold mb-2">Test Your Widget</h2>
            <p className="text-neutral-600 mb-8">
              Try chatting with your widget! This is how it will respond to visitors.
            </p>

            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6 mb-8 max-w-md mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">Chat</span>
                <h4 className="text-lg font-semibold">Chat Preview</h4>
              </div>

              <div className="bg-white rounded-lg p-4 mb-4 min-h-[200px] max-h-[300px] overflow-y-auto">
                {testConversation.length === 0 ? (
                  <p className="text-sm text-neutral-400 text-center py-8 italic">
                    Start a conversation to test your widget
                  </p>
                ) : (
                  <div className="space-y-3">
                    {testConversation.map((msg, idx) => (
                      <div
                        key={idx}
                        className={"p-3 rounded-lg text-sm " + (msg.role === "user" ? "bg-blue-500 text-white ml-8 text-right" : "bg-neutral-100 mr-8")}
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

              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 border-2 border-neutral-200 focus:border-neutral-900 focus:outline-none rounded-lg px-3 py-2 text-sm"
                  placeholder="Type your message..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !testLoading) {
                      sendTestMessage();
                    }
                  }}
                />
                <button
                  onClick={sendTestMessage}
                  disabled={!testMessage.trim() || testLoading}
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-6 font-semibold text-sm disabled:opacity-50 transition-colors"
                >
                  Send
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep("persona")}
                className="rounded-lg border-2 border-neutral-300 text-neutral-700 font-medium px-6 py-3 hover:bg-neutral-50 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => setCurrentStep("install")}
                className="flex-1 rounded-lg bg-amber-400 hover:bg-amber-500 text-neutral-900 font-bold px-8 py-3 transition-colors text-lg"
              >
                Continue →
              </button>
            </div>
            <div className="mt-3 text-center">
              <button
                onClick={() => setCurrentStep("install")}
                className="text-sm text-neutral-500 hover:text-neutral-700 underline transition-colors"
              >
                Skip testing for now
              </button>
            </div>
          </div>
        )}

        {currentStep === "install" && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 shadow-sm">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">🚀</div>
              <h2 className="text-3xl font-bold mb-2">Install Your Widget</h2>
              <p className="text-lg text-neutral-600">
                Almost done! Copy and paste this code into your website.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Your Embed Code
              </label>
              <div className="bg-neutral-900 text-green-400 rounded-xl p-6 font-mono text-sm overflow-x-auto">
                {embedCode}
              </div>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(embedCode);
              }}
              className="w-full rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-semibold px-6 py-3 transition-colors mb-6"
            >
              📋 Copy Embed Code
            </button>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
              <h3 className="font-semibold text-blue-900 mb-3">📍 Where to paste this code</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p><strong>Most websites:</strong> Paste before the closing <code className="bg-blue-100 px-2 py-1 rounded text-xs">&lt;/body&gt;</code> tag</p>
                <p><strong>WordPress:</strong> Use a plugin like "Insert Headers and Footers" or add to your theme's footer.php</p>
                <p><strong>Wix:</strong> Go to Settings → Custom Code → Add Code to Bottom of Each Page</p>
                <p><strong>Shopify:</strong> Edit theme.liquid and paste before <code className="bg-blue-100 px-2 py-1 rounded text-xs">&lt;/body&gt;</code></p>
                <p><strong>Squarespace:</strong> Settings → Advanced → Code Injection → Footer</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
              <div className="flex items-start gap-3">
                <div className="text-2xl">💡</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900 mb-2">Not ready to install now?</h3>
                  <p className="text-sm text-amber-800">
                    No problem! You can always access this embed code from your dashboard later. Click "Go to Dashboard" below to explore your widget settings and get the code whenever you're ready.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep("test")}
                className="rounded-lg border-2 border-neutral-300 text-neutral-700 font-medium px-6 py-3 hover:bg-neutral-50 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={completeOnboarding}
                className="flex-1 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-8 py-4 transition-colors text-lg shadow-lg"
              >
                🎉 Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
