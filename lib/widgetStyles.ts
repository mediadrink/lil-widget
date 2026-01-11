// lib/widgetStyles.ts
// Pre-built widget style presets and customization utilities

export type WidgetCustomization = {
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

export const PRESET_STYLES: Record<string, WidgetCustomization> = {
  // Clean, Apple-inspired design with crisp blue accents
  "preset-modern": {
    primaryColor: "#0071e3",
    userMsgColor: "#0071e3",
    assistantMsgColor: "#ffffff",
    assistantMsgBorder: "#e5e7eb",
    widgetBg: "#ffffff",
    borderRadius: "16px",
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    headerText: "Chat with us",
    headerIcon: "💬",
    buttonHoverColor: "#0058b0",
    inputBorderColor: "#d1d5db",
    inputFocusColor: "#0071e3",
  },

  // Sleek monochrome with subtle elegance
  "preset-minimal": {
    primaryColor: "#18181b",
    userMsgColor: "#18181b",
    assistantMsgColor: "#fafafa",
    assistantMsgBorder: "#e4e4e7",
    widgetBg: "#ffffff",
    borderRadius: "8px",
    fontFamily: "'DM Sans', system-ui, sans-serif",
    headerText: "Message us",
    headerIcon: "◆",
    buttonHoverColor: "#27272a",
    inputBorderColor: "#d4d4d8",
    inputFocusColor: "#18181b",
  },

  // Warm coral tones, inviting and approachable
  "preset-warm": {
    primaryColor: "#f25c6e",
    userMsgColor: "#f25c6e",
    assistantMsgColor: "#fef7f7",
    assistantMsgBorder: "#fecdd3",
    widgetBg: "#fffbfb",
    borderRadius: "20px",
    fontFamily: "Nunito, system-ui, -apple-system, sans-serif",
    headerText: "Hey there!",
    headerIcon: "👋",
    buttonHoverColor: "#e04355",
    inputBorderColor: "#fda4af",
    inputFocusColor: "#f25c6e",
  },

  // Dark mode - sophisticated and modern
  "preset-midnight": {
    primaryColor: "#818cf8",
    userMsgColor: "#6366f1",
    assistantMsgColor: "#27272a",
    assistantMsgBorder: "#3f3f46",
    widgetBg: "#18181b",
    borderRadius: "14px",
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
    headerText: "Start a conversation",
    headerIcon: "✦",
    buttonHoverColor: "#6366f1",
    inputBorderColor: "#3f3f46",
    inputFocusColor: "#818cf8",
  },

  // Frosted glass - Apple-inspired translucent design
  "preset-glass": {
    primaryColor: "#0071e3",
    userMsgColor: "rgba(0, 113, 227, 0.85)",
    assistantMsgColor: "rgba(255, 255, 255, 0.65)",
    assistantMsgBorder: "rgba(255, 255, 255, 0.35)",
    widgetBg: "rgba(255, 255, 255, 0.72)",
    borderRadius: "20px",
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    headerText: "Chat with us",
    headerIcon: "✨",
    buttonHoverColor: "#0058b0",
    inputBorderColor: "rgba(255, 255, 255, 0.45)",
    inputFocusColor: "#0071e3",
  },

  // Fresh green/teal - calm and trustworthy
  "preset-nature": {
    primaryColor: "#059669",
    userMsgColor: "#059669",
    assistantMsgColor: "#f0fdf4",
    assistantMsgBorder: "#bbf7d0",
    widgetBg: "#ffffff",
    borderRadius: "16px",
    fontFamily: "'Source Sans 3', system-ui, sans-serif",
    headerText: "How can we help?",
    headerIcon: "🌿",
    buttonHoverColor: "#047857",
    inputBorderColor: "#a7f3d0",
    inputFocusColor: "#059669",
  },
};

/**
 * Resolves the final widget customization based on style preset and custom overrides
 */
export function resolveWidgetStyle(
  style: string | null | undefined,
  customization: WidgetCustomization | null | undefined
): WidgetCustomization {
  // If custom style with customization data, use it
  if (style === "custom" && customization) {
    return customization;
  }

  // If preset style exists, use it
  if (style && PRESET_STYLES[style]) {
    return PRESET_STYLES[style];
  }

  // Default to modern preset
  return PRESET_STYLES["preset-modern"];
}

/**
 * Get list of all available presets for UI display
 */
export function getAvailablePresets() {
  return [
    {
      id: "preset-modern",
      name: "Modern",
      description: "Clean Apple-inspired design with crisp blue",
      preview: PRESET_STYLES["preset-modern"],
    },
    {
      id: "preset-minimal",
      name: "Minimal",
      description: "Sleek monochrome with subtle elegance",
      preview: PRESET_STYLES["preset-minimal"],
    },
    {
      id: "preset-warm",
      name: "Warm",
      description: "Inviting coral tones, friendly and approachable",
      preview: PRESET_STYLES["preset-warm"],
    },
    {
      id: "preset-midnight",
      name: "Midnight",
      description: "Dark mode with purple accents, sophisticated",
      preview: PRESET_STYLES["preset-midnight"],
    },
    {
      id: "preset-glass",
      name: "Glass",
      description: "Frosted translucent with blur effect",
      preview: PRESET_STYLES["preset-glass"],
    },
    {
      id: "preset-nature",
      name: "Nature",
      description: "Fresh green tones, calm and trustworthy",
      preview: PRESET_STYLES["preset-nature"],
    },
  ];
}
