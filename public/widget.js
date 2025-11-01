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
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: var(--primary-color);
      color: white;
      font-size: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: transform 0.2s, box-shadow 0.2s;
      z-index: 9998;
    }
    .widget-chat-bubble:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 16px rgba(0,0,0,0.2);
    }

    @media (max-width: 480px) {
      .widget-chat-bubble {
        width: 56px;
        height: 56px;
        bottom: 16px;
        right: 16px;
      }
    }
  `;
  shadowRoot.appendChild(bubbleStyle);

  // Create chat bubble
  const bubbleElement = document.createElement("div");
  bubbleElement.className = "widget-chat-bubble";
  bubbleElement.innerHTML = "💬";
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

  function loadFullWidget() {
    if (isFullWidgetLoaded) return;
    isFullWidgetLoaded = true;

    // Hide bubble
    if (bubbleElement.parentNode) {
      bubbleElement.style.display = "none";
    }

    // Add full widget styles
    const fullStyle = document.createElement("style");
    fullStyle.textContent = `
      :host {
        --primary-color: #007aff;
        --user-msg-color: #007aff;
        --assistant-msg-color: #ffffff;
        --assistant-msg-border: #e0e0e0;
        --widget-bg: #ffffff;
        --border-radius: 12px;
        --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        --button-hover-color: #0056b3;
        --input-border-color: #d0d0d0;
        --input-focus-color: #007aff;
      }

      .widget-container {
        font-family: var(--font-family);
        background: var(--widget-bg);
        border: 1px solid #e0e0e0;
        border-radius: var(--border-radius);
        padding: 1.25rem;
        width: 350px;
        max-width: calc(100vw - 40px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      }
      .widget-header {
        margin: 0 0 1rem 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: #1a1a1a;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .widget-logo {
        height: 24px;
        width: auto;
        max-width: 32px;
        object-fit: contain;
      }
      .widget-header-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex: 1;
      }
      .widget-minimize-btn {
        background: none;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 4px;
        transition: background 0.2s;
        color: #666;
        line-height: 1;
      }
      .widget-minimize-btn:hover {
        background: rgba(0,0,0,0.05);
      }
      .widget-messages {
        max-height: 300px;
        overflow-y: auto;
        margin-bottom: 1rem;
        padding: 0.5rem;
        background: #f9f9f9;
        border-radius: calc(var(--border-radius) * 0.66);
        -webkit-overflow-scrolling: touch;
      }
      .message {
        margin-bottom: 0.75rem;
        padding: 0.625rem;
        border-radius: calc(var(--border-radius) * 0.66);
        font-size: 0.875rem;
        line-height: 1.4;
        word-wrap: break-word;
      }
      .message.user {
        background: var(--user-msg-color);
        color: white;
        margin-left: 2rem;
        text-align: right;
      }
      .message.assistant {
        background: var(--assistant-msg-color);
        border: 1px solid var(--assistant-msg-border);
        margin-right: 2rem;
      }
      .message.error {
        background: #fee;
        border: 1px solid #fcc;
        color: #c33;
      }
      .widget-input-area {
        display: flex;
        gap: 0.5rem;
      }
      .widget-branding {
        text-align: center;
        margin-top: 0.75rem;
        padding-top: 0.75rem;
        border-top: 1px solid #e0e0e0;
      }
      .widget-branding a {
        color: #666;
        font-size: 0.75rem;
        text-decoration: none;
        transition: color 0.2s;
      }
      .widget-branding a:hover {
        color: #333;
      }
      .widget-input {
        flex: 1;
        padding: 0.75rem;
        border: 1px solid var(--input-border-color);
        border-radius: calc(var(--border-radius) * 0.66);
        font-size: 16px;
        resize: none;
        font-family: inherit;
        -webkit-appearance: none;
        touch-action: manipulation;
      }
      .widget-input:focus {
        outline: none;
        border-color: var(--input-focus-color);
      }
      .widget-button {
        padding: 0.75rem 1.25rem;
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: calc(var(--border-radius) * 0.66);
        cursor: pointer;
        font-weight: 600;
        font-size: 0.875rem;
        transition: background 0.2s;
        min-height: 44px;
        min-width: 44px;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }
      .widget-button:hover {
        background: var(--button-hover-color);
      }
      .widget-button:active {
        background: var(--button-hover-color);
        filter: brightness(0.9);
      }
      .widget-button:disabled {
        background: #ccc;
        cursor: not-allowed;
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
          background: rgba(0, 0, 0, 0.05);
          z-index: -1;
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
          padding: 1rem;
          margin: 0;
          border: none;
          border-radius: 0;
          box-shadow: none;
          display: flex;
          flex-direction: column;
        }

        .widget-header {
          flex-shrink: 0;
          margin-bottom: 1rem;
        }

        .widget-minimize-btn {
          font-size: 1.5rem;
          padding: 0.5rem;
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
          margin-left: 1rem;
        }
        .message.assistant {
          margin-right: 1rem;
        }
        .widget-input {
          font-size: 16px;
          padding: 0.875rem;
        }
        .widget-button {
          padding: 0.875rem 1rem;
          min-height: 48px;
        }
      }

      /* iOS Safari specific fixes */
      @supports (-webkit-touch-callout: none) {
        .widget-input {
          font-size: 16px !important;
        }
      }
    `;
    shadowRoot.appendChild(fullStyle);

    // Create backdrop for mobile (semi-transparent overlay)
    const backdrop = document.createElement("div");
    backdrop.className = "widget-mobile-backdrop";

    // Create full chat container
    const container = document.createElement("div");
    container.className = "widget-container";

    // Show branding for free tier
    const showBranding = widgetConfig?.subscriptionTier === "free";
    const brandingHTML = showBranding
      ? '<div class="widget-branding"><a href="https://lilwidget.com" target="_blank" rel="noopener">Powered by Lil\' Widget</a></div>'
      : '';

    container.innerHTML = `
      <h4 class="widget-header">
        <span class="widget-header-content">💬 Chat with us</span>
        <button class="widget-minimize-btn" title="Close">×</button>
      </h4>
      <div class="widget-messages"></div>
      <div class="widget-input-area">
        <textarea class="widget-input" rows="2" placeholder="Type your message..."></textarea>
        <button class="widget-button">Send</button>
      </div>
      ${brandingHTML}
    `;

    const messagesDiv = container.querySelector(".widget-messages");
    const textarea = container.querySelector(".widget-input");
    const button = container.querySelector(".widget-button");
    const headerEl = container.querySelector(".widget-header");
    const minimizeBtn = container.querySelector(".widget-minimize-btn");

    // Apply customization to widget
    function applyCustomization(customization) {
      if (!customization) return;

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
      if (customization.headerText) {
        const headerContent = headerEl.querySelector(".widget-header-content");
        if (headerContent) {
          // Preserve logo if it exists
          const existingLogo = headerEl.querySelector(".widget-logo");
          if (existingLogo) {
            headerContent.textContent = customization.headerText;
          } else {
            headerEl.innerHTML = `<span class="widget-header-content">${customization.headerText}</span><button class="widget-minimize-btn" title="Minimize">−</button>`;
          }
        }
      }
    }

    // Display logo in widget header
    function displayLogo(logoUrl) {
      if (!logoUrl) return;

      const headerContent = headerEl.querySelector(".widget-header-content");
      if (!headerContent) return;

      // Check if logo already exists
      let logoImg = headerEl.querySelector(".widget-logo");
      if (!logoImg) {
        logoImg = document.createElement("img");
        logoImg.className = "widget-logo";
        logoImg.alt = "Logo";
        // Insert logo before the header text
        headerEl.insertBefore(logoImg, headerContent);
      }

      logoImg.src = logoUrl;
      logoImg.onerror = function() {
        // Hide logo if it fails to load
        this.style.display = "none";
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
            stream: true, // Enable streaming
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
                  fullReply += parsed.content;
                  messageElement.innerHTML = parseMarkdown(fullReply);
                  // Auto-scroll to bottom
                  messagesDiv.scrollTop = messagesDiv.scrollHeight;
                }
              } catch (e) {
                // Ignore parse errors for partial chunks
              }
            }
          }
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

      // Create empty assistant message for streaming
      const assistantMessage = addMessage("assistant", "");

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
      container.style.display = "none";
      backdrop.style.display = "none";
      bubbleElement.style.display = "flex";
    }

    // Apply config to widget
    if (widgetConfig) {
      if (widgetConfig.customization) {
        applyCustomization(widgetConfig.customization);
      }
      if (widgetConfig.logoUrl) {
        displayLogo(widgetConfig.logoUrl);
      }
    }

    // Add backdrop and container to shadow root
    shadowRoot.appendChild(backdrop);
    shadowRoot.appendChild(container);

    // Load conversation history
    loadConversationHistory();

    // Focus on textarea
    textarea.focus();
  }

  // Bubble click handler - loads full widget
  bubbleElement.onclick = () => {
    localStorage.setItem(minimizedKey, "false");
    loadFullWidget();
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
      }
    },
    close: function() {
      localStorage.setItem(minimizedKey, "true");
      if (isFullWidgetLoaded) {
        const container = shadowRoot.querySelector(".widget-container");
        const backdrop = shadowRoot.querySelector(".widget-mobile-backdrop");
        if (container) {
          container.style.display = "none";
        }
        if (backdrop) {
          backdrop.style.display = "none";
        }
        bubbleElement.style.display = "flex";
      }
    }
  };
})();
