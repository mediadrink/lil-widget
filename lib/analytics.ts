// lib/analytics.ts
// Google Analytics event tracking utilities

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

type GTagEvent = {
  action: string;
  category: string;
  label?: string;
  value?: number;
};

/**
 * Track a custom event in Google Analytics
 */
export function trackEvent({ action, category, label, value }: GTagEvent) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

/**
 * Track a signup event
 */
export function trackSignup(method: string = "email") {
  trackEvent({
    action: "sign_up",
    category: "engagement",
    label: method,
  });
}

/**
 * Track when a user starts the upgrade flow
 */
export function trackUpgradeStart() {
  trackEvent({
    action: "begin_checkout",
    category: "ecommerce",
    label: "growth_plan",
    value: 19,
  });
}

/**
 * Track a successful payment/upgrade
 */
export function trackPurchase() {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "purchase", {
      transaction_id: `upgrade_${Date.now()}`,
      value: 19.00,
      currency: "USD",
      items: [
        {
          item_id: "growth_plan",
          item_name: "Lil Widget Growth Plan",
          price: 19.00,
          quantity: 1,
        },
      ],
    });
  }
}

/**
 * Track when a widget is created
 */
export function trackWidgetCreated(widgetId: string) {
  trackEvent({
    action: "widget_created",
    category: "engagement",
    label: widgetId,
  });
}

/**
 * Track when embed code is copied (widget installed)
 */
export function trackWidgetInstall(widgetId: string) {
  trackEvent({
    action: "widget_installed",
    category: "engagement",
    label: widgetId,
  });
}

/**
 * Track onboarding step completion
 */
export function trackOnboardingStep(step: string) {
  trackEvent({
    action: "onboarding_step",
    category: "engagement",
    label: step,
  });
}

/**
 * Track email verification
 */
export function trackEmailVerified() {
  trackEvent({
    action: "email_verified",
    category: "engagement",
  });
}
