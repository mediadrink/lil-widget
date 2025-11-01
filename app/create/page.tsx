// Page: Create Widget
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ToneModifier = {
  id: string;
  label: string;
  description: string;
  example: string;
};

type IndustryPreset = {
  id: string;
  label: string;
  tones: string[];
  basePrompt: string;
};

const TONE_MODIFIERS: ToneModifier[] = [
  {
    id: "friendly",
    label: "Friendly & Conversational",
    description: "Warm and approachable",
    example: "Hey there! How can I help you today?",
  },
  {
    id: "professional",
    label: "Formal & Professional",
    description: "Respectful and business-focused",
    example: "Good day. How may I assist you?",
  },
  {
    id: "authoritative",
    label: "Informative & Authoritative",
    description: "Factual and trustworthy expert",
    example: "Based on our expertise, I can guide you through...",
  },
  {
    id: "empathetic",
    label: "Empathetic & Understanding",
    description: "Sensitive and caring",
    example: "I understand this can be challenging. Let me help...",
  },
  {
    id: "witty",
    label: "Humorous & Witty",
    description: "Light-hearted and fun",
    example: "Great question! Let me share the magic...",
  },
  {
    id: "simple",
    label: "Simple & Clear",
    description: "Easy to understand, no jargon",
    example: "Here's the simple answer: ...",
  },
  {
    id: "persuasive",
    label: "Persuasive & Confident",
    description: "Compelling and strong",
    example: "This is the perfect solution for you because...",
  },
  {
    id: "technical",
    label: "Technical & Detailed",
    description: "Uses specialized terminology",
    example: "From a technical standpoint, the implementation involves...",
  },
];

const INDUSTRY_PRESETS: IndustryPreset[] = [
  {
    id: "legal",
    label: "Legal Services",
    tones: ["professional", "authoritative", "empathetic"],
    basePrompt:
      "You are an AI assistant for a law firm. Provide helpful information while being careful not to give legal advice. Always recommend scheduling a consultation for specific legal matters.",
  },
  {
    id: "healthcare",
    label: "Healthcare & Medical",
    tones: ["empathetic", "professional", "authoritative"],
    basePrompt:
      "You are an AI assistant for a healthcare practice. Be compassionate and informative while being careful not to provide medical diagnosis. Always recommend consulting with a healthcare professional for specific concerns.",
  },
  {
    id: "restaurant",
    label: "Restaurant & Food Service",
    tones: ["friendly", "witty"],
    basePrompt:
      "You are an AI assistant for a restaurant. Be enthusiastic about the food and atmosphere. Help with reservations, menu questions, hours, and directions.",
  },
  {
    id: "realestate",
    label: "Real Estate",
    tones: ["professional", "persuasive", "friendly"],
    basePrompt:
      "You are an AI assistant for a real estate agency. Be knowledgeable about properties, neighborhoods, and the buying/selling process. Build trust and encourage scheduling viewings or consultations.",
  },
  {
    id: "consulting",
    label: "Consulting & Professional Services",
    tones: ["professional", "authoritative"],
    basePrompt:
      "You are an AI assistant for a consulting firm. Demonstrate expertise while being approachable. Focus on understanding client needs and scheduling discovery calls.",
  },
  {
    id: "ecommerce",
    label: "E-commerce & Retail",
    tones: ["friendly", "persuasive", "simple"],
    basePrompt:
      "You are an AI assistant for an online store. Help customers find products, answer questions about shipping and returns, and make purchase recommendations.",
  },
  {
    id: "saas",
    label: "SaaS & Technology",
    tones: ["professional", "technical", "simple"],
    basePrompt:
      "You are an AI assistant for a software company. Explain features clearly, help with technical questions, and guide users toward demos or trials.",
  },
  {
    id: "fitness",
    label: "Fitness & Wellness",
    tones: ["friendly", "empathetic"],
    basePrompt:
      "You are an AI assistant for a fitness center or wellness business. Be motivational and supportive. Help with class schedules, membership questions, and booking sessions.",
  },
  {
    id: "education",
    label: "Education & Training",
    tones: ["friendly", "authoritative", "simple"],
    basePrompt:
      "You are an AI assistant for an educational institution or training provider. Be encouraging and informative. Help with course information, enrollment, and scheduling.",
  },
  {
    id: "custom",
    label: "Custom (Start from scratch)",
    tones: [],
    basePrompt: "",
  },
];

export default function CreateWidgetPage() {
  const router = useRouter();

  const [widgetName, setWidgetName] = useState("");
  const [url, setUrl] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");
  const [selectedTones, setSelectedTones] = useState<string[]>([]);
  const [customPersona, setCustomPersona] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Build persona text from selections
  const buildPersonaText = (): string => {
    if (customPersona.trim()) {
      return customPersona.trim();
    }

    if (!selectedIndustry) {
      return "";
    }

    const industry = INDUSTRY_PRESETS.find((i) => i.id === selectedIndustry);
    if (!industry) return "";

    let persona = industry.basePrompt;

    if (selectedTones.length > 0) {
      const toneDescriptions = selectedTones
        .map((toneId) => {
          const tone = TONE_MODIFIERS.find((t) => t.id === toneId);
          return tone ? tone.label.toLowerCase() : null;
        })
        .filter(Boolean);

      if (toneDescriptions.length > 0) {
        persona += `\n\nTone: Be ${toneDescriptions.join(", ")}.`;
      }
    }

    return persona;
  };

  const handleIndustrySelect = (industryId: string) => {
    setSelectedIndustry(industryId);
    const industry = INDUSTRY_PRESETS.find((i) => i.id === industryId);
    if (industry) {
      setSelectedTones(industry.tones);
      if (industryId === "custom") {
        setShowAdvanced(true);
      }
    }
  };

  const toggleTone = (toneId: string) => {
    setSelectedTones((prev) =>
      prev.includes(toneId)
        ? prev.filter((t) => t !== toneId)
        : [...prev, toneId]
    );
  };

  const handleSubmit = async () => {
    if (!widgetName) {
      setError("Please enter a widget name.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const personaText = buildPersonaText();

      const res = await fetch("/api/widgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: widgetName,
          url: url,
          persona_text: personaText,
          style: "style-1",
          position: "bottom-right",
        }),
      });

      if (!res.ok) {
        const data = await res.json();

        // Handle widget limit reached
        if (data.limitReached) {
          if (confirm(`${data.error}\n\nWould you like to upgrade now?`)) {
            router.push("/dashboard/upgrade");
            return;
          }
        }

        throw new Error(data.error || "Failed to create widget");
      }

      const data = await res.json();
      const widgetId = data.widget?.id;

      // Redirect to admin console for the new widget
      if (widgetId) {
        router.push(`/dashboard/widgets/${widgetId}/admin-console`);
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Create widget error:", err);
      setError(err.message || "Failed to create widget. Try again.");
      setLoading(false);
    }
  };

  const selectedIndustryObj = INDUSTRY_PRESETS.find(
    (i) => i.id === selectedIndustry
  );

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border shadow-sm p-8 max-w-3xl w-full">
        <h1 className="text-2xl font-bold mb-2">Create Your Widget</h1>
        <p className="text-sm text-neutral-600 mb-6">
          Set up an AI-powered chat widget for your website in minutes
        </p>

        {/* Step 1: Basic Info */}
        <div className="mb-6">
          <label className="block font-medium mb-2 text-sm">
            Widget Name *
          </label>
          <input
            className="w-full p-3 border rounded-lg text-sm"
            value={widgetName}
            onChange={(e) => setWidgetName(e.target.value)}
            placeholder="e.g., My Business Chat Widget"
          />
        </div>

        <div className="mb-6">
          <label className="block font-medium mb-2 text-sm">
            Your Website URL (optional)
          </label>
          <input
            className="w-full p-3 border rounded-lg text-sm"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
          />
          <p className="text-xs text-neutral-500 mt-1">
            We can auto-generate a persona from your website later
          </p>
        </div>

        {/* Step 2: Industry Selection */}
        <div className="mb-6">
          <label className="block font-medium mb-2 text-sm">
            What industry are you in?
          </label>
          <div className="grid grid-cols-2 gap-3">
            {INDUSTRY_PRESETS.map((industry) => (
              <button
                key={industry.id}
                onClick={() => handleIndustrySelect(industry.id)}
                className={`p-3 rounded-lg border text-left text-sm transition-all ${
                  selectedIndustry === industry.id
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                    : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                }`}
              >
                <div className="font-medium">{industry.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Tone Selection (shown after industry selected) */}
        {selectedIndustry && selectedIndustry !== "custom" && (
          <div className="mb-6">
            <label className="block font-medium mb-2 text-sm">
              Select your widget's tone
            </label>
            <p className="text-xs text-neutral-500 mb-3">
              We've pre-selected recommended tones for {selectedIndustryObj?.label}.
              Click to add or remove tones.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TONE_MODIFIERS.map((tone) => (
                <button
                  key={tone.id}
                  onClick={() => toggleTone(tone.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedTones.includes(tone.id)
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="font-medium text-sm">{tone.label}</div>
                    {selectedTones.includes(tone.id) && (
                      <span className="text-emerald-600 text-lg">✓</span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-500 mb-1">
                    {tone.description}
                  </div>
                  <div className="text-xs text-neutral-400 italic">
                    "{tone.example}"
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Advanced: Custom Persona */}
        {selectedIndustry && (
          <div className="mb-6">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-blue-600 hover:text-blue-700 underline mb-2"
            >
              {showAdvanced ? "Hide" : "Show"} advanced options
            </button>

            {showAdvanced && (
              <div>
                <label className="block font-medium mb-2 text-sm">
                  Custom Persona (optional)
                </label>
                <textarea
                  className="w-full p-3 border rounded-lg text-sm h-32"
                  value={customPersona}
                  onChange={(e) => setCustomPersona(e.target.value)}
                  placeholder="Write a custom persona to override the preset above..."
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Leave blank to use the preset based on your industry and tone selections
                </p>
              </div>
            )}
          </div>
        )}

        {/* Preview generated persona */}
        {selectedIndustry && !customPersona && (
          <div className="mb-6 p-4 bg-neutral-50 rounded-lg border">
            <div className="text-xs font-medium text-neutral-700 mb-2">
              Preview: Generated Persona
            </div>
            <div className="text-xs text-neutral-600 whitespace-pre-wrap">
              {buildPersonaText() || "Select an industry to see preview"}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          className="bg-black text-white px-6 py-3 rounded-lg w-full font-medium hover:bg-neutral-800 disabled:opacity-50 transition-colors"
          onClick={handleSubmit}
          disabled={loading || !selectedIndustry}
        >
          {loading ? "Creating..." : "Create Widget"}
        </button>

        {!selectedIndustry && (
          <p className="text-xs text-neutral-500 text-center mt-2">
            Please select an industry to continue
          </p>
        )}
      </div>
    </div>
  );
}
