// File: /public/widget.js
// Lil Widget - Embeddable Chat Widget (Lazy Loaded)

(function () {
  const widgetId = document.currentScript.getAttribute("data-id");
  if (!widgetId) {
    console.error("Lil Widget: Missing data-id attribute");
    return;
  }

  // Get base URL from environment or use current origin
  const baseUrl = document.currentScript.getAttribute("data-base-url") || window.location.origin;

  // Store conversation ID in sessionStorage
  const conversationKey = `lil-widget-conversation-${widgetId}`;
  let conversationId = sessionStorage.getItem(conversationKey);

  // Widget configuration
  const configKey = `lil-widget-config-${widgetId}`;
  let widgetConfig = null;

  // Flag to track if full widget is loaded
  let isFullWidgetLoaded = false;

  // ============================================
  // PHASE 1: MINIMAL BUBBLE (loads immediately)
  // ============================================

  // Try to get cached config for bubble styling
  try {
    const cached = sessionStorage.getItem(configKey);
    if (cached) {
      widgetConfig = JSON.parse(cached);
    }
  } catch (e) {
    // Ignore cache errors
  }

  // Ping server to confirm widget is installed (only once per session)
  // Skip ping if we're in the dashboard (preview widget)
  const isDashboard = window.location.pathname.includes('/dashboard');
  const pingKey = `lil-widget-pinged-${widgetId}`;

  if (!isDashboard && !sessionStorage.getItem(pingKey)) {
    fetch(`${baseUrl}/api/widget/${widgetId}/ping`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: window.location.href,
        referrer: document.referrer || null,
      }),
    }).then(() => {
      sessionStorage.setItem(pingKey, "true");
    }).catch(() => {
      // Silent fail - don't break widget if ping fails
    });
  }

  // Fetch config in background for when user clicks
  if (!widgetConfig) {
    fetch(`${baseUrl}/api/widget/${widgetId}/config`)
      .then((res) => res.json())
      .then((config) => {
        widgetConfig = config;
        sessionStorage.setItem(configKey, JSON.stringify(config));
        // Update bubble color if it's already rendered
        if (bubbleElement) {
          applyBubbleColor(config);
        }
      })
      .catch(() => {
        // Use defaults if fetch fails
      });
  }

  // Create minimal shadow host for bubble
  const shadowHost = document.createElement("div");
  shadowHost.id = `lil-widget-${widgetId}`;
  shadowHost.style.position = "fixed";
  shadowHost.style.zIndex = "9999";

  const shadowRoot = shadowHost.attachShadow({ mode: "open" });

  // Minimal styles for bubble only
  const bubbleStyle = document.createElement("style");
  bubbleStyle.textContent = `
    :host {
      --primary-color: #007aff;
    }

    .widget-chat-bubble {
      position: fixed;
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-color) 0%, color-mix(in srgb, var(--primary-color) 80%, black) 100%);
      color: white;
      font-size: 1.625rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      z-index: 9998;
      border: none;
    }

    .widget-chat-bubble:hover {
      transform: scale(1.08) translateY(-2px);
      box-shadow: 0 10px 28px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.15);
    }

    .widget-chat-bubble:active {
      transform: scale(1.02);
    }

    .bubble-icon {
      position: absolute;
      transition: transform 0.3s ease, opacity 0.3s ease;
    }
    .bubble-icon-chat {
      opacity: 1;
      transform: rotate(0deg) scale(1);
    }
    .bubble-icon-close {
      opacity: 0;
      transform: rotate(-90deg) scale(0.5);
      font-style: normal;
    }
    .widget-chat-bubble.widget-open .bubble-icon-chat {
      opacity: 0;
      transform: rotate(90deg) scale(0.5);
    }
    .widget-chat-bubble.widget-open .bubble-icon-close {
      opacity: 1;
      transform: rotate(0deg) scale(1);
    }

    @media (max-width: 480px) {
      .widget-chat-bubble {
        width: 60px;
        height: 60px;
        bottom: 20px;
        right: 20px;
      }
    }
  `;
  shadowRoot.appendChild(bubbleStyle);

  // Create chat bubble
  const bubbleElement = document.createElement("div");
  bubbleElement.className = "widget-chat-bubble";
  bubbleElement.innerHTML = '<span class="bubble-icon bubble-icon-chat"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span><span class="bubble-icon bubble-icon-close"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>';
  bubbleElement.title = "Open chat";

  // Position bubble based on config
  function positionBubble() {
    const isMobile = window.innerWidth <= 480;
    const position = widgetConfig?.position || "bottom-right";

    if (isMobile) {
      bubbleElement.style.bottom = "16px";
      bubbleElement.style.right = "16px";
      bubbleElement.style.left = "auto";
      bubbleElement.style.transform = "none";
    } else {
      bubbleElement.style.bottom = "20px";
      if (position === "bottom-center") {
        bubbleElement.style.left = "50%";
        bubbleElement.style.right = "auto";
        bubbleElement.style.transform = "translateX(-50%)";
      } else if (position.includes("right")) {
        bubbleElement.style.right = "20px";
        bubbleElement.style.left = "auto";
        bubbleElement.style.transform = "none";
      } else if (position.includes("left")) {
        bubbleElement.style.left = "20px";
        bubbleElement.style.right = "auto";
        bubbleElement.style.transform = "none";
      }
    }
  }

  function applyBubbleColor(config) {
    if (config?.customization?.primaryColor) {
      shadowHost.style.setProperty("--primary-color", config.customization.primaryColor);
    }
  }

  // Check if widget should start minimized
  const minimizedKey = `lil-widget-minimized-${widgetId}`;
  const shouldStartMinimized = localStorage.getItem(minimizedKey) !== "false";

  if (shouldStartMinimized) {
    // Show bubble immediately
    shadowRoot.appendChild(bubbleElement);
    document.body.appendChild(shadowHost);
    positionBubble();
    if (widgetConfig) {
      applyBubbleColor(widgetConfig);
    }
  }

  // ============================================
  // PHASE 2: FULL CHAT INTERFACE (loads on click)
  // ============================================

  // Container reference (set when full widget loads)
  let container = null;

  // Position container based on config
  function positionContainerFn() {
    if (!container) return;

    const isMobile = window.innerWidth <= 480;
    const position = widgetConfig?.position || "bottom-right";

    // On mobile, use full-screen (CSS handles this), so clear inline styles
    if (isMobile) {
      container.style.left = "";
      container.style.right = "";
      container.style.marginLeft = "";
      container.style.marginRight = "";
      return;
    }

    // Desktop positioning (avoid inline transform — it's used by open/close animation)
    container.style.left = "auto";
    container.style.right = "auto";
    container.style.marginLeft = "";
    container.style.marginRight = "";

    if (position === "bottom-center") {
      container.style.left = "0";
      container.style.right = "0";
      container.style.marginLeft = "auto";
      container.style.marginRight = "auto";
    } else if (position.includes("right")) {
      container.style.right = "20px";
    } else if (position.includes("left")) {
      container.style.left = "20px";
    }
  }

  function loadFullWidget() {
    if (isFullWidgetLoaded) return;
    isFullWidgetLoaded = true;

    // Animate bubble to close icon
    bubbleElement.classList.add("widget-open");

    // Add full widget styles
    const fullStyle = document.createElement("style");
    fullStyle.textContent = `
      :host {
        --primary-color: #007aff;
        --user-msg-color: #007aff;
        --assistant-msg-color: #ffffff;
        --assistant-msg-border: #e5e7eb;
        --widget-bg: #ffffff;
        --border-radius: 16px;
        --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        --button-hover-color: #0066cc;
        --input-border-color: #d1d5db;
        --input-focus-color: #007aff;
        --text-primary: #111827;
        --text-secondary: #6b7280;
        --bg-subtle: #f9fafb;
      }

      .widget-container {
        font-family: var(--font-family);
        background: var(--widget-bg);
        border: 1px solid #e5e7eb;
        border-radius: var(--border-radius);
        width: 380px;
        max-width: calc(100vw - 40px);
        box-shadow: 0 20px 40px rgba(0,0,0,0.15), 0 8px 16px rgba(0,0,0,0.1);
        position: fixed;
        bottom: 96px;
        right: 24px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        transform: translateY(8px) scale(0.98);
        opacity: 0;
        pointer-events: none;
        transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
                    opacity 0.2s ease;
      }

      .widget-container.widget-visible {
        transform: translateY(0) scale(1);
        opacity: 1;
        pointer-events: all;
      }

      .widget-header {
        margin: 0;
        padding: 1rem 1.25rem;
        background: var(--widget-bg);
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .widget-header-icon {
        font-size: 1.25rem;
        line-height: 1;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        background: linear-gradient(135deg, var(--primary-color) 0%, color-mix(in srgb, var(--primary-color) 70%, #000) 100%);
        color: white;
        flex-shrink: 0;
      }

      .widget-header-info {
        flex: 1;
        min-width: 0;
      }

      .widget-header-title {
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
        line-height: 1.3;
      }

      .widget-header-subtitle {
        font-size: 0.75rem;
        color: var(--text-secondary);
        margin: 0;
      }

      .widget-logo {
        height: 32px;
        width: 32px;
        border-radius: 8px;
        object-fit: contain;
      }

      .widget-header-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;
        min-width: 0;
      }

      .widget-minimize-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.375rem;
        border-radius: 8px;
        transition: background 0.2s;
        color: var(--text-secondary);
        line-height: 1;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .widget-minimize-btn:hover {
        background: var(--bg-subtle);
        color: var(--text-primary);
      }

      .widget-body {
        padding: 1rem 1.25rem 1.25rem;
      }

      .widget-messages {
        min-height: 280px;
        max-height: 380px;
        overflow-y: auto;
        margin-bottom: 1rem;
        padding: 0.75rem;
        background: var(--bg-subtle);
        border-radius: 12px;
        -webkit-overflow-scrolling: touch;
      }

      .message {
        margin-bottom: 0.75rem;
        padding: 0.75rem 1rem;
        border-radius: 12px;
        font-size: 0.875rem;
        line-height: 1.5;
        word-wrap: break-word;
        animation: fadeIn 0.2s ease-out;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(4px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .message:last-child {
        margin-bottom: 0;
      }

      .message.user {
        background: var(--user-msg-color);
        color: white;
        margin-left: 2.5rem;
        border-bottom-right-radius: 4px;
      }

      .message.assistant {
        background: var(--assistant-msg-color);
        border: 1px solid var(--assistant-msg-border);
        color: var(--text-primary);
        margin-right: 2.5rem;
        border-bottom-left-radius: 4px;
      }

      .message.error {
        background: #fef2f2;
        border: 1px solid #fecaca;
        color: #dc2626;
      }

      .widget-input-area {
        display: flex;
        gap: 0.625rem;
      }

      .widget-detail-bar {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
      }

      .widget-detail-bar label {
        font-size: 0.6875rem;
        color: var(--text-secondary);
        white-space: nowrap;
        min-width: 36px;
      }

      .widget-detail-bar input[type="range"] {
        flex: 1;
        height: 4px;
        -webkit-appearance: none;
        appearance: none;
        background: var(--input-border-color);
        border-radius: 2px;
        outline: none;
        cursor: pointer;
      }

      .widget-detail-bar input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: var(--primary-color);
        cursor: pointer;
        border: 2px solid white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      }

      .widget-detail-bar input[type="range"]::-moz-range-thumb {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: var(--primary-color);
        cursor: pointer;
        border: 2px solid white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      }

      .widget-detail-level {
        font-size: 0.6875rem;
        color: var(--text-secondary);
        min-width: 44px;
        text-align: right;
      }

      .widget-branding {
        text-align: center;
        padding: 0.75rem 1.25rem;
        border-top: 1px solid #e5e7eb;
        background: var(--bg-subtle);
      }

      .widget-branding a {
        color: var(--text-secondary);
        font-size: 0.6875rem;
        text-decoration: none;
        transition: color 0.2s;
      }

      .widget-branding a:hover {
        color: var(--text-primary);
      }

      .widget-input {
        flex: 1;
        padding: 0.875rem 1.25rem;
        border: 1.5px solid var(--input-border-color);
        border-radius: 24px;
        font-size: 0.9375rem;
        resize: none;
        font-family: inherit;
        -webkit-appearance: none;
        touch-action: manipulation;
        transition: border-color 0.2s, box-shadow 0.2s;
        color: var(--text-primary);
        background: var(--widget-bg);
      }

      .widget-input::placeholder {
        color: var(--text-secondary);
      }

      .widget-input:focus {
        outline: none;
        border-color: var(--input-focus-color);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 15%, transparent);
      }

      .widget-button {
        width: 44px;
        height: 44px;
        padding: 0;
        background: linear-gradient(135deg, var(--primary-color) 0%, color-mix(in srgb, var(--primary-color) 70%, #000) 100%);
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        font-size: 1.125rem;
        transition: transform 0.2s, box-shadow 0.2s;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .widget-button:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 12px color-mix(in srgb, var(--primary-color) 40%, transparent);
      }

      .widget-button:active {
        transform: scale(0.95);
      }

      .widget-button:disabled {
        background: #d1d5db;
        cursor: not-allowed;
        transform: none;
      }

      .typing-indicator {
        display: flex;
        gap: 4px;
        padding: 0.75rem 1rem;
        background: var(--assistant-msg-color);
        border: 1px solid var(--assistant-msg-border);
        border-radius: 12px;
        border-bottom-left-radius: 4px;
        margin-right: 2.5rem;
        width: fit-content;
      }

      .typing-indicator span {
        width: 8px;
        height: 8px;
        background: var(--text-secondary);
        border-radius: 50%;
        animation: bounce 1.4s infinite ease-in-out;
      }

      .typing-indicator span:nth-child(1) { animation-delay: 0s; }
      .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
      .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

      @keyframes bounce {
        0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
        40% { transform: scale(1); opacity: 1; }
      }

      .message .typing-indicator {
        padding: 0;
        background: transparent;
        border: none;
        border-radius: 0;
        margin: 0;
      }

      .typing-cursor {
        display: inline-block;
        width: 2px;
        height: 1em;
        background: var(--text-primary);
        margin-left: 1px;
        vertical-align: text-bottom;
        animation: cursorBlink 0.8s step-end infinite;
      }

      @keyframes cursorBlink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }

      /* Mobile full-screen overlay */
      .widget-mobile-backdrop {
        display: none;
      }

      @media (max-width: 480px) {
        .widget-mobile-backdrop {
          display: block;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.3);
          z-index: -1;
          animation: fadeIn 0.2s ease-out;
        }

        .widget-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          max-width: 100%;
          height: 100vh;
          height: 100dvh;
          margin: 0;
          border: none;
          border-radius: 0;
          box-shadow: none;
          display: flex;
          flex-direction: column;
        }

        .widget-header {
          flex-shrink: 0;
          padding: 1rem;
          border-radius: 0;
        }

        .widget-minimize-btn {
          padding: 0.5rem;
        }

        .widget-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 1rem;
          overflow: hidden;
        }

        .widget-messages {
          flex: 1;
          max-height: none;
          height: auto;
          overflow-y: auto;
          margin-bottom: 1rem;
        }

        .widget-input-area {
          flex-shrink: 0;
          padding-bottom: env(safe-area-inset-bottom, 0);
        }

        .message.user {
          margin-left: 1.5rem;
        }
        .message.assistant,
        .typing-indicator {
          margin-right: 1.5rem;
        }

        .widget-input {
          font-size: 1rem;
          padding: 0.875rem 1rem;
        }

        .widget-button {
          width: 48px;
          height: 48px;
        }

        .widget-branding {
          flex-shrink: 0;
        }
      }

      /* iOS Safari specific fixes */
      @supports (-webkit-touch-callout: none) {
        .widget-input {
          font-size: 16px !important;
        }
      }

      /* Glass/Frosted effect styles */
      .widget-container.glass {
        -webkit-backdrop-filter: blur(24px) saturate(180%);
        backdrop-filter: blur(24px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.35);
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.18),
                    0 8px 24px rgba(0, 0, 0, 0.12);
      }

      .widget-container.glass::before {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: linear-gradient(
          135deg,
          rgba(255,255,255,0.45) 0%,
          rgba(255,255,255,0.15) 35%,
          rgba(255,255,255,0.05) 55%,
          rgba(255,255,255,0.00) 100%
        );
        opacity: 0.5;
        mix-blend-mode: overlay;
        border-radius: inherit;
      }

      .widget-container.glass .widget-header {
        background: transparent;
        border-bottom: 1px solid rgba(255, 255, 255, 0.25);
      }

      .widget-container.glass .widget-messages {
        background: rgba(255, 255, 255, 0.35);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .widget-container.glass .message.assistant {
        -webkit-backdrop-filter: blur(12px);
        backdrop-filter: blur(12px);
      }

      .widget-container.glass .widget-input {
        background: rgba(255, 255, 255, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.4);
      }

      .widget-container.glass .widget-input:focus {
        background: rgba(255, 255, 255, 0.75);
        border-color: var(--input-focus-color);
      }

      .widget-container.glass .widget-branding {
        background: transparent;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
      }

      /* Dark mode for glass (Midnight preset) */
      .widget-container.dark {
        --text-primary: #f4f4f5;
        --text-secondary: #a1a1aa;
        --bg-subtle: rgba(39, 39, 42, 0.6);
      }

      .widget-container.dark .widget-header {
        border-bottom-color: #3f3f46;
      }

      .widget-container.dark .widget-messages {
        background: rgba(39, 39, 42, 0.5);
      }

      .widget-container.dark .widget-input {
        background: rgba(39, 39, 42, 0.8);
        border-color: #3f3f46;
        color: #f4f4f5;
      }

      .widget-container.dark .widget-input::placeholder {
        color: #71717a;
      }

      .widget-container.dark .widget-branding {
        border-top-color: #3f3f46;
      }

      .widget-container.dark .widget-branding a {
        color: #a1a1aa;
      }
    `;
    shadowRoot.appendChild(fullStyle);

    // Create backdrop for mobile (semi-transparent overlay)
    const backdrop = document.createElement("div");
    backdrop.className = "widget-mobile-backdrop";

    // Create full chat container (use outer scope variable)
    container = document.createElement("div");
    container.className = "widget-container";

    // Show branding for free tier
    const showBranding = widgetConfig?.subscriptionTier === "free";
    const brandingHTML = showBranding
      ? '<div class="widget-branding"><a href="https://lilwidget.com" target="_blank" rel="noopener">Powered by Lil\' Widget</a></div>'
      : '';

    // Get widget title from config or use default
    const widgetTitle = widgetConfig?.customization?.headerText || "Chat with us";

    container.innerHTML = `
      <div class="widget-header">
        <div class="widget-header-content">
          <span class="widget-header-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span>
          <div class="widget-header-info">
            <div class="widget-header-title">${widgetTitle}</div>
            <div class="widget-header-subtitle">We typically reply instantly</div>
          </div>
        </div>
        <button class="widget-minimize-btn" title="Close"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>
      <div class="widget-body">
        <div class="widget-messages"></div>
        <div class="widget-detail-bar">
          <label>Brief</label>
          <input type="range" class="widget-detail-slider" min="1" max="5" value="3" step="1">
          <span class="widget-detail-level">Balanced</span>
        </div>
        <div class="widget-input-area">
          <textarea class="widget-input" rows="1" placeholder="Type your message..."></textarea>
          <button class="widget-button" aria-label="Send message"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg></button>
        </div>
      </div>
      ${brandingHTML}
    `;

    const messagesDiv = container.querySelector(".widget-messages");
    const textarea = container.querySelector(".widget-input");
    const button = container.querySelector(".widget-button");
    const headerEl = container.querySelector(".widget-header");
    const headerIcon = container.querySelector(".widget-header-icon");
    const headerTitle = container.querySelector(".widget-header-title");
    const headerSubtitle = container.querySelector(".widget-header-subtitle");
    const minimizeBtn = container.querySelector(".widget-minimize-btn");
    const detailSlider = container.querySelector(".widget-detail-slider");
    const detailLevel = container.querySelector(".widget-detail-level");

    // Detail level labels
    const detailLabels = { 1: "Brief", 2: "Concise", 3: "Balanced", 4: "Detailed", 5: "In-depth" };
    let currentDetailLevel = 3;

    detailSlider.addEventListener("input", () => {
      currentDetailLevel = parseInt(detailSlider.value);
      detailLevel.textContent = detailLabels[currentDetailLevel];
    });

    // Load Google Font dynamically
    const loadedFonts = new Set();
    function loadGoogleFont(fontFamily) {
      if (!fontFamily) return;

      // Extract the first font name (before fallbacks)
      const fontMatch = fontFamily.match(/^['"]?([^'",]+)/);
      if (!fontMatch) return;

      const fontName = fontMatch[1].trim();

      // Skip system fonts
      const systemFonts = ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif', 'serif', 'monospace'];
      if (systemFonts.some(sf => fontName.toLowerCase() === sf.toLowerCase())) return;

      // Skip if already loaded
      if (loadedFonts.has(fontName)) return;
      loadedFonts.add(fontName);

      // Create Google Fonts link
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@400;500;600;700&display=swap`;
      document.head.appendChild(link);
    }

    // Apply customization to widget
    function applyCustomization(customization) {
      if (!customization) return;

      // Load custom font if specified
      if (customization.fontFamily) {
        loadGoogleFont(customization.fontFamily);
      }

      // Update CSS variables
      const root = shadowRoot.host;
      if (customization.primaryColor) {
        root.style.setProperty("--primary-color", customization.primaryColor);
      }
      if (customization.userMsgColor) {
        root.style.setProperty("--user-msg-color", customization.userMsgColor);
      }
      if (customization.assistantMsgColor) {
        root.style.setProperty("--assistant-msg-color", customization.assistantMsgColor);
      }
      if (customization.assistantMsgBorder) {
        root.style.setProperty("--assistant-msg-border", customization.assistantMsgBorder);
      }
      if (customization.widgetBg) {
        root.style.setProperty("--widget-bg", customization.widgetBg);
      }
      if (customization.borderRadius) {
        root.style.setProperty("--border-radius", customization.borderRadius);
      }
      if (customization.fontFamily) {
        root.style.setProperty("--font-family", customization.fontFamily);
      }
      if (customization.buttonHoverColor) {
        root.style.setProperty("--button-hover-color", customization.buttonHoverColor);
      }
      if (customization.inputBorderColor) {
        root.style.setProperty("--input-border-color", customization.inputBorderColor);
      }
      if (customization.inputFocusColor) {
        root.style.setProperty("--input-focus-color", customization.inputFocusColor);
      }

      // Update header text
      if (customization.headerText && headerTitle) {
        headerTitle.textContent = customization.headerText;
      }

      // Update header icon if provided
      if (customization.headerIcon && headerIcon) {
        headerIcon.textContent = customization.headerIcon;
      }
    }

    // Apply special theme classes based on preset style
    function applyThemeClass(style) {
      if (!container) return;

      // Remove existing theme classes
      container.classList.remove("glass", "dark");

      // Add appropriate class based on preset
      if (style === "preset-glass") {
        container.classList.add("glass");
      } else if (style === "preset-midnight") {
        container.classList.add("dark");
      }
    }

    // Display logo in widget header (replaces icon)
    function displayLogo(logoUrl) {
      if (!logoUrl || !headerIcon) return;

      // Create logo image
      const logoImg = document.createElement("img");
      logoImg.className = "widget-logo";
      logoImg.alt = "Logo";
      logoImg.src = logoUrl;

      logoImg.onload = function() {
        // Replace icon with logo on successful load
        headerIcon.replaceWith(logoImg);
      };

      logoImg.onerror = function() {
        // Keep icon if logo fails to load
        console.warn("Widget logo failed to load");
      };
    }

    // Add message to chat
    function addMessage(role, content, isError = false) {
      const messageEl = document.createElement("div");
      messageEl.className = `message ${role}`;
      if (isError) {
        messageEl.classList.add("error");
      }
      // Use markdown parsing for assistant messages, plain text for user messages
      if (role === "assistant") {
        messageEl.innerHTML = parseMarkdown(content);
      } else {
        messageEl.textContent = content;
      }
      messagesDiv.appendChild(messageEl);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
      return messageEl;
    }

    // Simple markdown parser for chat messages
    function parseMarkdown(text) {
      if (!text) return '';

      let html = text;

      // Escape HTML to prevent XSS
      html = html
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // Bold: **text** or __text__ (do bold first to avoid conflicts)
      html = html.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
      html = html.replace(/__([^_]+?)__/g, '<strong>$1</strong>');

      // Italic: *text* or _text_ (single asterisk/underscore, not part of bold)
      html = html.replace(/\*([^*\n]+?)\*/g, '<em>$1</em>');
      html = html.replace(/_([^_\n]+?)_/g, '<em>$1</em>');

      // Links: [text](url)
      html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color: inherit; text-decoration: underline;">$1</a>');

      // Process lists BEFORE converting line breaks
      // Unordered lists: lines starting with - or * or •
      html = html.replace(/^[\-\*•]\s+(.+)$/gm, '<li>$1</li>');

      // Ordered lists: lines starting with number.
      html = html.replace(/^\d+\.\s+(.+)$/gm, '<li style="list-style-type: decimal;">$1</li>');

      // Convert double line breaks to paragraph breaks
      html = html.replace(/\n\n/g, '</p><p style="margin: 0.5em 0;">');
      // Convert single line breaks to <br>
      html = html.replace(/\n/g, '<br>');

      // Wrap consecutive list items in ul/ol (must handle <br> tags between items)
      html = html.replace(/(<li[^>]*>.*?<\/li>(?:<br>|<br\/>|\s)*)+/gs, function(match) {
        // Remove <br> tags between list items
        const cleanedMatch = match.replace(/<br\s*\/?>/g, '');
        if (match.includes('list-style-type: decimal')) {
          return '<ol style="margin: 0.5em 0; padding-left: 1.5em;">' + cleanedMatch + '</ol>';
        } else {
          return '<ul style="margin: 0.5em 0; padding-left: 1.5em; list-style-type: disc;">' + cleanedMatch + '</ul>';
        }
      });

      // Wrap in paragraphs if not already wrapped
      if (!html.startsWith('<p') && !html.startsWith('<ul') && !html.startsWith('<ol')) {
        html = '<p style="margin: 0;">' + html + '</p>';
      } else if (html.startsWith('<p')) {
        html = '<p style="margin: 0;">' + html.substring(3);
      }

      return html;
    }

    // Load conversation history if conversationId exists
    async function loadConversationHistory() {
      if (!conversationId) return;

      try {
        const res = await fetch(`${baseUrl}/api/conversations/${conversationId}/public`);
        if (!res.ok) return;

        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          // Clear any existing messages
          messagesDiv.innerHTML = "";

          // Add all historical messages
          data.messages.forEach((msg) => {
            addMessage(msg.role, msg.content);
          });
        }
      } catch (error) {
        console.error("Failed to load conversation history:", error);
        // Silent fail - don't break widget if history fails to load
      }
    }

    // Typewriter reveal for bulk responses (external APIs)
    function typewriterReveal(element, text, scrollContainer) {
      return new Promise((resolve) => {
        const words = text.split(/(\s+)/);
        let currentText = "";
        let wordIndex = 0;
        let scrollTick = 0;

        function tick() {
          if (wordIndex >= words.length) {
            // Final render without cursor
            element.innerHTML = parseMarkdown(text);
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
            resolve();
            return;
          }

          // Reveal 2 words per tick
          for (let i = 0; i < 2 && wordIndex < words.length; i++) {
            currentText += words[wordIndex];
            wordIndex++;
          }

          // Render with blinking cursor
          const html = parseMarkdown(currentText);
          const cursorSpan = '<span class="typing-cursor"></span>';
          const lastCloseTag = html.match(/<\/[^>]+>\s*$/);
          if (lastCloseTag) {
            const pos = html.lastIndexOf(lastCloseTag[0]);
            element.innerHTML = html.slice(0, pos) + cursorSpan + html.slice(pos);
          } else {
            element.innerHTML = html + cursorSpan;
          }

          // Smooth scroll every 3rd tick
          scrollTick++;
          if (scrollTick % 3 === 0) {
            scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
          }

          setTimeout(tick, 50);
        }

        tick();
      });
    }

    // Send message with retry logic
    async function sendMessageStream(question, messageElement, retryCount = 0) {
      const maxRetries = 2;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        const res = await fetch(`${baseUrl}/api/widget/${widgetId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: question,
            widgetId: widgetId,
            conversationId: conversationId || undefined,
            visitorId: null,
            stream: true,
            detailLevel: currentDetailLevel,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          // Handle specific HTTP errors
          if (res.status === 429) {
            throw new Error("RATE_LIMIT");
          } else if (res.status >= 500) {
            throw new Error("SERVER_ERROR");
          } else if (res.status === 404) {
            throw new Error("NOT_FOUND");
          } else {
            throw new Error(`HTTP_${res.status}`);
          }
        }

        // Handle streaming response
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullReply = "";
        let useTypewriter = false;

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                break;
              }

              try {
                const parsed = JSON.parse(data);

                // Store conversation ID
                if (parsed.conversationId && !conversationId) {
                  conversationId = parsed.conversationId;
                  sessionStorage.setItem(conversationKey, conversationId);
                }

                // Append content to message
                if (parsed.content) {
                  // Remove typing indicator on first content
                  if (fullReply === "" && messageElement.querySelector(".typing-indicator")) {
                    messageElement.innerHTML = "";
                  }

                  // Detect bulk response from external API (one large chunk)
                  if (parsed.content.length > 50 && fullReply === "") {
                    useTypewriter = true;
                  }

                  fullReply += parsed.content;

                  if (!useTypewriter) {
                    messageElement.innerHTML = parseMarkdown(fullReply);
                    // Auto-scroll to bottom
                    messagesDiv.scrollTop = messagesDiv.scrollHeight;
                  }
                }
              } catch (e) {
                // Ignore parse errors for partial chunks
              }
            }
          }
        }

        // Typewriter reveal for bulk responses
        if (useTypewriter && fullReply) {
          // Clear typing indicator if still showing
          if (messageElement.querySelector(".typing-indicator")) {
            messageElement.innerHTML = "";
          }
          await typewriterReveal(messageElement, fullReply, messagesDiv);
        }

        return fullReply || "Sorry, I couldn't generate a response.";
      } catch (error) {
        console.error("Lil Widget error:", error);

        // Handle network errors with retry
        if (
          (error.name === "AbortError" ||
           error.message === "Failed to fetch" ||
           error.message === "SERVER_ERROR") &&
          retryCount < maxRetries
        ) {
          // Wait before retry (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return sendMessageStream(question, messageElement, retryCount + 1);
        }

        // Return user-friendly error messages
        if (error.name === "AbortError") {
          throw new Error("Request timed out. Please try again.");
        } else if (error.message === "Failed to fetch") {
          throw new Error("Unable to connect. Please check your internet connection.");
        } else if (error.message === "RATE_LIMIT") {
          throw new Error("Too many requests. Please wait a moment and try again.");
        } else if (error.message === "NOT_FOUND") {
          throw new Error("Widget not found. Please contact the site administrator.");
        } else if (error.message === "SERVER_ERROR") {
          throw new Error("Server error. Please try again in a moment.");
        } else {
          throw new Error("Something went wrong. Please try again.");
        }
      }
    }

    // Send message button handler
    button.onclick = async () => {
      const question = textarea.value.trim();
      if (!question) return;

      // Disable input while processing
      button.disabled = true;
      textarea.disabled = true;

      // Add user message to UI
      addMessage("user", question);
      textarea.value = "";

      // Create assistant message with typing indicator
      const assistantMessage = addMessage("assistant", "");
      assistantMessage.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
      messagesDiv.scrollTop = messagesDiv.scrollHeight;

      try {
        await sendMessageStream(question, assistantMessage);
      } catch (error) {
        // Show error message in the assistant message element
        assistantMessage.textContent = error.message;
        assistantMessage.style.color = "#dc2626"; // Red color for errors
      } finally {
        // Re-enable input
        button.disabled = false;
        textarea.disabled = false;
        textarea.focus();
      }
    };

    // Allow Enter key to send (Shift+Enter for new line)
    textarea.onkeydown = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        button.click();
      }
    };

    // Minimize button handler
    minimizeBtn.onclick = (e) => {
      e.stopPropagation();
      minimize();
    };

    function minimize() {
      localStorage.setItem(minimizedKey, "true");
      container.classList.remove("widget-visible");
      backdrop.style.display = "none";
      bubbleElement.classList.remove("widget-open");
    }

    // Apply config to widget
    if (widgetConfig) {
      if (widgetConfig.customization) {
        applyCustomization(widgetConfig.customization);
      }
      if (widgetConfig.style) {
        applyThemeClass(widgetConfig.style);
      }
      if (widgetConfig.logoUrl) {
        displayLogo(widgetConfig.logoUrl);
      }
    }

    // Position container (always call, even without config - uses default)
    positionContainerFn();

    // Add backdrop and container to shadow root
    shadowRoot.appendChild(backdrop);
    shadowRoot.appendChild(container);

    // Trigger open animation on next frame
    requestAnimationFrame(() => {
      container.classList.add("widget-visible");
    });

    // Load conversation history
    loadConversationHistory();

    // Focus on textarea
    textarea.focus();
  }

  // Bubble click handler - toggles full widget open/closed
  bubbleElement.onclick = () => {
    // If panel is open, close it
    if (isFullWidgetLoaded && container && container.classList.contains("widget-visible")) {
      localStorage.setItem(minimizedKey, "true");
      container.classList.remove("widget-visible");
      const backdrop = shadowRoot.querySelector(".widget-mobile-backdrop");
      if (backdrop) backdrop.style.display = "none";
      bubbleElement.classList.remove("widget-open");
      return;
    }

    localStorage.setItem(minimizedKey, "false");
    if (isFullWidgetLoaded && container) {
      // Widget already loaded, just show it
      bubbleElement.classList.add("widget-open");
      container.classList.add("widget-visible");
      const backdrop = shadowRoot.querySelector(".widget-mobile-backdrop");
      if (backdrop) backdrop.style.display = "";
      // Instantly scroll to bottom for existing history
      const msgs = container.querySelector(".widget-messages");
      if (msgs) msgs.scrollTop = msgs.scrollHeight;
    } else {
      loadFullWidget();
    }
  };

  // If widget was not minimized last time, load it immediately
  if (!shouldStartMinimized) {
    setTimeout(() => {
      loadFullWidget();
      document.body.appendChild(shadowHost);
    }, 0);
  } else {
    // Handle auto-open delay (if configured and visitor hasn't dismissed)
    const autoOpenDismissedKey = `lil-widget-auto-open-dismissed-${widgetId}`;
    const hasAutoDismissed = sessionStorage.getItem(autoOpenDismissedKey) === "true";

    if (widgetConfig?.autoOpenDelay && widgetConfig.autoOpenDelay > 0 && !hasAutoDismissed) {
      // Auto-open after delay
      setTimeout(() => {
        if (!isFullWidgetLoaded && shouldStartMinimized) {
          localStorage.setItem(minimizedKey, "false");
          if (!document.body.contains(shadowHost)) {
            document.body.appendChild(shadowHost);
          }
          loadFullWidget();

          // Mark that auto-open happened this session
          sessionStorage.setItem(autoOpenDismissedKey, "true");
        }
      }, widgetConfig.autoOpenDelay * 1000);
    }
  }

  // Reposition on resize
  window.addEventListener("resize", () => {
    if (!isFullWidgetLoaded) {
      positionBubble();
    } else {
      positionContainerFn();
    }
  });

  // Expose public API for custom triggers
  window.LilWidget = window.LilWidget || {};
  window.LilWidget[widgetId] = {
    open: function() {
      localStorage.setItem(minimizedKey, "false");
      if (!isFullWidgetLoaded) {
        if (!document.body.contains(shadowHost)) {
          document.body.appendChild(shadowHost);
        }
        loadFullWidget();
      } else {
        // Show widget if already loaded but hidden
        const container = shadowRoot.querySelector(".widget-container");
        const backdrop = shadowRoot.querySelector(".widget-mobile-backdrop");
        if (container) container.classList.add("widget-visible");
        if (backdrop) backdrop.style.display = "";
        bubbleElement.classList.add("widget-open");
      }
    },
    close: function() {
      localStorage.setItem(minimizedKey, "true");
      if (isFullWidgetLoaded) {
        const container = shadowRoot.querySelector(".widget-container");
        const backdrop = shadowRoot.querySelector(".widget-mobile-backdrop");
        if (container) container.classList.remove("widget-visible");
        if (backdrop) backdrop.style.display = "none";
        bubbleElement.classList.remove("widget-open");
      }
    },
    sendMessage: function(message, autoSend = true) {
      // Open widget first
      this.open();

      // Wait for widget to load, then set message
      const checkAndSend = () => {
        const textarea = shadowRoot.querySelector(".widget-input");
        const button = shadowRoot.querySelector(".widget-button");

        if (textarea && button) {
          textarea.value = message;
          textarea.focus();

          if (autoSend) {
            // Small delay to ensure UI is ready
            setTimeout(() => button.click(), 100);
          }
        } else {
          // Widget not ready yet, retry
          setTimeout(checkAndSend, 100);
        }
      };

      setTimeout(checkAndSend, 100);
    }
  };
})();
