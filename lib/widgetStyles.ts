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
  buttonHoverColor: string;
  inputBorderColor: string;
  inputFocusColor: string;
};

export const PRESET_STYLES: Record<string, WidgetCustomization> = {
  "preset-modern": {
    primaryColor: "#007aff",
    userMsgColor: "#007aff",
    assistantMsgColor: "#ffffff",
    assistantMsgBorder: "#e0e0e0",
    widgetBg: "#ffffff",
    borderRadius: "12px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    headerText: "💬 Chat with us",
    buttonHoverColor: "#0056b3",
    inputBorderColor: "#d0d0d0",
    inputFocusColor: "#007aff",
  },
  "preset-minimal": {
    primaryColor: "#1a1a1a",
    userMsgColor: "#1a1a1a",
    assistantMsgColor: "#f5f5f5",
    assistantMsgBorder: "#d0d0d0",
    widgetBg: "#ffffff",
    borderRadius: "4px",
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    headerText: "Chat",
    buttonHoverColor: "#333333",
    inputBorderColor: "#cccccc",
    inputFocusColor: "#1a1a1a",
  },
  "preset-friendly": {
    primaryColor: "#ff6b6b",
    userMsgColor: "#ff6b6b",
    assistantMsgColor: "#fff5e6",
    assistantMsgBorder: "#ffd6a5",
    widgetBg: "#fffbf5",
    borderRadius: "20px",
    fontFamily: "'Comic Sans MS', 'Chalkboard SE', sans-serif",
    headerText: "👋 Let's chat!",
    buttonHoverColor: "#ff5252",
    inputBorderColor: "#ffd6a5",
    inputFocusColor: "#ff6b6b",
  },
  "preset-professional": {
    primaryColor: "#2c3e50",
    userMsgColor: "#2c3e50",
    assistantMsgColor: "#ecf0f1",
    assistantMsgBorder: "#bdc3c7",
    widgetBg: "#ffffff",
    borderRadius: "8px",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    headerText: "Contact Support",
    buttonHoverColor: "#1a252f",
    inputBorderColor: "#95a5a6",
    inputFocusColor: "#2c3e50",
  },
  "preset-vibrant": {
    primaryColor: "#9b59b6",
    userMsgColor: "#9b59b6",
    assistantMsgColor: "#f3e5f5",
    assistantMsgBorder: "#ce93d8",
    widgetBg: "#ffffff",
    borderRadius: "16px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    headerText: "✨ Hey there!",
    buttonHoverColor: "#8e44ad",
    inputBorderColor: "#ce93d8",
    inputFocusColor: "#9b59b6",
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
      description: "Clean and contemporary with blue accents",
      preview: PRESET_STYLES["preset-modern"],
    },
    {
      id: "preset-minimal",
      name: "Minimal",
      description: "Simple grayscale design with sharp edges",
      preview: PRESET_STYLES["preset-minimal"],
    },
    {
      id: "preset-friendly",
      name: "Friendly",
      description: "Warm and approachable with playful colors",
      preview: PRESET_STYLES["preset-friendly"],
    },
    {
      id: "preset-professional",
      name: "Professional",
      description: "Formal navy and gray design",
      preview: PRESET_STYLES["preset-professional"],
    },
    {
      id: "preset-vibrant",
      name: "Vibrant",
      description: "Bold purple with energetic feel",
      preview: PRESET_STYLES["preset-vibrant"],
    },
  ];
}
