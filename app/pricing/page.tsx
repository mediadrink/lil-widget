// app/pricing/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PricingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setIsLoggedIn(true);
        }
      })
      .catch(() => {
        // Not logged in
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-2xl">💬</div>
            <span className="font-bold text-xl">Lil Widget</span>
          </div>
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <button
                onClick={() => router.push("/dashboard")}
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
              >
                Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => router.push("/login")}
                  className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
                >
                  Log in
                </button>
                <button
                  onClick={() => router.push("/signup")}
                  className="text-sm font-medium bg-neutral-900 text-white px-4 py-2 rounded-lg hover:bg-neutral-800"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
        <h1 className="text-5xl font-bold text-neutral-900 mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
          Start free, upgrade when your widget starts getting traction.
          No hidden fees, cancel anytime.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Free Plan */}
          <div className="bg-white rounded-2xl border-2 border-neutral-200 p-8 relative">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                Free
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-neutral-900">$0</span>
                <span className="text-neutral-600">/month</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-neutral-700">10 conversations/month</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-neutral-700">1 widget</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-neutral-700">Basic crawl (5 pages)</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-neutral-700">AI-powered responses</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-neutral-700">5 preset styles</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-neutral-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-neutral-400">No analytics</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-neutral-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-neutral-400">No custom styling</span>
              </li>
            </ul>

            <button
              onClick={() => router.push("/signup")}
              className="w-full py-3 px-6 rounded-lg border-2 border-neutral-900 text-neutral-900 font-semibold hover:bg-neutral-50 transition-colors"
            >
              Get Started Free
            </button>
          </div>

          {/* Pro Plan - Highlighted */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 relative transform md:scale-105 shadow-2xl">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-neutral-900 px-4 py-1 rounded-full text-sm font-bold">
              MOST POPULAR
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-white">$79</span>
                <span className="text-blue-100">/month</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-white mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white font-semibold">Unlimited conversations</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-white mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white">3 widgets</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-white mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white">Expanded crawl (10+ pages)</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-white mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white">AI website style matcher</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-white mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white">Conversation insights & analytics</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-white mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white">Custom styling</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-white mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white">Priority support</span>
              </li>
            </ul>

            <button
              onClick={() => {
                if (isLoggedIn) {
                  router.push("/dashboard/upgrade");
                } else {
                  router.push("/signup?plan=pro");
                }
              }}
              className="w-full py-3 px-6 rounded-lg bg-white text-blue-600 font-semibold hover:bg-blue-50 transition-colors"
            >
              Upgrade to Pro
            </button>
          </div>

          {/* Business Plan */}
          <div className="bg-white rounded-2xl border-2 border-neutral-200 p-8 relative">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                Business
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-neutral-900">$199</span>
                <span className="text-neutral-600">/month</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-neutral-700 font-semibold">Everything in Pro</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-neutral-700">10 widgets</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-neutral-700">Advanced crawl (50+ pages)</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-neutral-700">White-label option</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-neutral-700">Dedicated support</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-neutral-700">Custom integrations</span>
              </li>
            </ul>

            <button
              onClick={() => {
                if (isLoggedIn) {
                  router.push("/dashboard/upgrade?plan=business");
                } else {
                  router.push("/signup?plan=business");
                }
              }}
              className="w-full py-3 px-6 rounded-lg border-2 border-neutral-900 text-neutral-900 font-semibold hover:bg-neutral-50 transition-colors"
            >
              Upgrade to Business
            </button>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-bold text-neutral-900 text-center mb-12">
          Frequently Asked Questions
        </h2>

        <div className="space-y-6">
          <details className="bg-white rounded-lg p-6 border border-neutral-200">
            <summary className="font-semibold text-neutral-900 cursor-pointer">
              What counts as a conversation?
            </summary>
            <p className="mt-3 text-neutral-600">
              A conversation is counted when a visitor sends at least one message to your widget.
              Multiple messages from the same visitor in the same session count as one conversation.
            </p>
          </details>

          <details className="bg-white rounded-lg p-6 border border-neutral-200">
            <summary className="font-semibold text-neutral-900 cursor-pointer">
              Can I upgrade or downgrade anytime?
            </summary>
            <p className="mt-3 text-neutral-600">
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately,
              and we'll prorate any charges or credits.
            </p>
          </details>

          <details className="bg-white rounded-lg p-6 border border-neutral-200">
            <summary className="font-semibold text-neutral-900 cursor-pointer">
              What happens when I hit my conversation limit?
            </summary>
            <p className="mt-3 text-neutral-600">
              Your widget will pause and show a friendly "limit reached" message to visitors.
              We'll email you when you're at 80% and 100% of your limit so you can upgrade before that happens.
            </p>
          </details>

          <details className="bg-white rounded-lg p-6 border border-neutral-200">
            <summary className="font-semibold text-neutral-900 cursor-pointer">
              Do you offer refunds?
            </summary>
            <p className="mt-3 text-neutral-600">
              We offer a 14-day money-back guarantee. If you're not satisfied for any reason,
              just email us and we'll refund you in full - no questions asked.
            </p>
          </details>

          <details className="bg-white rounded-lg p-6 border border-neutral-200">
            <summary className="font-semibold text-neutral-900 cursor-pointer">
              Can I use this on multiple websites?
            </summary>
            <p className="mt-3 text-neutral-600">
              The Free plan includes 1 widget. Pro includes 3 widgets, and Business includes 10 widgets.
              Each widget can be customized for different sites or pages.
            </p>
          </details>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to get started?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of businesses using Lil Widget to engage visitors and answer questions 24/7.
          </p>
          <button
            onClick={() => router.push("/signup")}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-colors inline-block"
          >
            Start Free Trial
          </button>
        </div>
      </div>
    </div>
  );
}
