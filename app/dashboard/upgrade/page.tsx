// app/dashboard/upgrade/page.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import dynamic from "next/dynamic";

const StripePaymentForm = dynamic(() => import("@/app/components/StripePaymentForm"), {
  ssr: false,
});

function UpgradePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    conversationsThisMonth: 0,
    totalWidgets: 0,
  });
  const [upgrading, setUpgrading] = useState(false);
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    async function loadUserData() {
      try {
        // Get user info
        const userRes = await fetch("/api/auth/user");
        const userData = await userRes.json();

        console.log("User data loaded:", userData);

        if (!userData.user) {
          console.log("No user found, redirecting to login");
          router.push("/login");
          return;
        }
        setUser(userData.user);
        console.log("User set:", userData.user);

        // Get usage stats
        const statsRes = await fetch("/api/usage/stats");
        const statsData = await statsRes.json();
        console.log("Stats loaded:", statsData);
        setStats(statsData);
      } catch (err) {
        console.error("Failed to load user data:", err);
      } finally {
        setLoading(false);
        console.log("Loading complete");
      }
    }

    loadUserData();
  }, [router]);

  async function handleUpgradeClick() {
    if (!user?.email) {
      alert("User information not loaded. Please refresh the page and try again.");
      return;
    }

    setUpgrading(true);
    try {
      const res = await fetch("/api/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || "price_1SOtw9EVxGVhW8Bvp0U9ef3u"
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create subscription");
      }

      const { clientSecret } = await res.json();

      // Show payment form
      setPaymentClientSecret(clientSecret);
      setShowPaymentForm(true);
    } catch (err: any) {
      console.error("Upgrade error:", err);
      alert(err.message || "Failed to start payment. Please try again.");
    } finally {
      setUpgrading(false);
    }
  }

  function handlePaymentSuccess() {
    // Refresh user data to get new subscription tier
    window.location.href = "/dashboard/upgrade?success=true";
  }

  function handlePaymentError(error: string) {
    alert(`Payment failed: ${error}`);
    setShowPaymentForm(false);
    setPaymentClientSecret(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-600">Loading...</div>
      </div>
    );
  }

  const isPaid = user?.subscription_tier === "paid";
  const conversationLimit = isPaid ? "Unlimited" : "50";

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-neutral-600 hover:text-neutral-900 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Current Plan Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-12">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-100 mb-1">
                CURRENT PLAN
              </div>
              <h2 className="text-3xl font-bold mb-2">
                {isPaid ? "Growth Plan" : "Basic Plan"}
              </h2>
              <p className="text-blue-100">
                {isPaid
                  ? "You're on the Growth plan with unlimited conversations"
                  : `${stats.conversationsThisMonth} of 50 conversations used this month`}
              </p>
            </div>
            {!isPaid && (
              <div className="text-right">
                <div className="text-5xl font-bold">
                  {stats.conversationsThisMonth}/50
                </div>
                <div className="text-sm text-blue-100 mt-1">conversations</div>
              </div>
            )}
          </div>

          {!isPaid && stats.conversationsThisMonth >= 45 && (
            <div className="mt-6 bg-yellow-500 text-neutral-900 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <div className="font-bold mb-1">You're almost at your limit!</div>
                  <div className="text-sm">
                    Upgrade now to keep helping visitors. Don't let conversations go unanswered.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Upgrade Options */}
        {!isPaid && (
          <>
            <h3 className="text-2xl font-bold text-neutral-900 mb-8 text-center">
              Upgrade to Growth
            </h3>

            <div className="max-w-xl mx-auto mb-12">
              {/* Growth Plan - Single Plan */}
              <div className="bg-white rounded-2xl border-2 border-blue-600 p-8 relative shadow-lg">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                  LAUNCH SPECIAL
                </div>

                <div className="mb-6 text-center">
                  <h4 className="text-2xl font-bold text-neutral-900 mb-2">Growth</h4>
                  <div className="flex items-baseline gap-2 justify-center">
                    <span className="text-5xl font-bold text-neutral-900">$19</span>
                    <span className="text-neutral-600">/month</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <div className="font-semibold text-neutral-900">500 conversations per month</div>
                      <div className="text-sm text-neutral-600">10x more than Basic - perfect for growing businesses</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <div className="font-semibold text-neutral-900">2 widgets</div>
                      <div className="text-sm text-neutral-600">A/B test different approaches and find what works</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <div className="font-semibold text-neutral-900">Expanded website crawl</div>
                      <div className="text-sm text-neutral-600">10+ pages crawled for detailed business knowledge</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <div className="font-semibold text-neutral-900">Remove Lil' Widget branding</div>
                      <div className="text-sm text-neutral-600">Your widget, your brand</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <div className="font-semibold text-neutral-900">Conversation insights</div>
                      <div className="text-sm text-neutral-600">Daily AI summaries of what visitors ask</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <div className="font-semibold text-neutral-900">Email support</div>
                      <div className="text-sm text-neutral-600">Get help when you need it</div>
                    </div>
                  </li>
                </ul>

                {showPaymentForm && paymentClientSecret ? (
                  <div>
                    <div className="mb-4">
                      <p className="text-sm text-neutral-600 mb-4">Enter your payment details to upgrade to Growth</p>
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
                      className="mt-3 text-sm text-neutral-500 hover:text-neutral-700 underline w-full text-center"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleUpgradeClick}
                      disabled={upgrading || loading || !user}
                      className="w-full py-4 px-6 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors text-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      title={!user ? "Loading user data..." : loading ? "Loading..." : ""}
                    >
                      {upgrading ? "Loading payment..." : loading ? "Loading user data..." : !user ? "Loading..." : "Upgrade to Growth"}
                    </button>

                    {/* Debug info in development */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="text-xs text-neutral-500 mt-2 text-center">
                        Debug: loading={loading.toString()}, user={user ? 'loaded' : 'null'}, upgrading={upgrading.toString()}
                      </div>
                    )}

                    <p className="text-xs text-neutral-500 text-center mt-4">
                      14-day money-back guarantee • Cancel anytime
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Coming Soon - Pro/Agency */}
            <div className="bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-xl border border-neutral-300 p-6 text-center max-w-2xl mx-auto">
              <p className="text-sm text-neutral-600 mb-2">
                <span className="font-semibold text-neutral-900">Need more?</span> Pro and Agency plans coming soon.
              </p>
              <p className="text-xs text-neutral-500">
                API integrations, advanced styling, multiple widgets for agencies, and dedicated support.
              </p>
            </div>
          </>
        )}

        {/* Already on Growth */}
        {isPaid && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
            <svg className="w-16 h-16 text-green-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-2xl font-bold text-neutral-900 mb-2">
              You're on the Growth Plan!
            </h3>
            <p className="text-neutral-600 mb-6">
              You have 500 conversations/month and all Growth features unlocked.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 rounded-lg bg-neutral-900 text-white font-semibold hover:bg-neutral-800 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {/* FAQ */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-neutral-900 text-center mb-8">
            Questions?
          </h3>

          <div className="max-w-3xl mx-auto space-y-4">
            <details className="bg-white rounded-lg p-6 border border-neutral-200">
              <summary className="font-semibold text-neutral-900 cursor-pointer">
                What happens to my existing conversations?
              </summary>
              <p className="mt-3 text-neutral-600">
                All your conversation history is preserved. When you upgrade, your widget
                immediately resumes working with unlimited conversations.
              </p>
            </details>

            <details className="bg-white rounded-lg p-6 border border-neutral-200">
              <summary className="font-semibold text-neutral-900 cursor-pointer">
                Can I cancel anytime?
              </summary>
              <p className="mt-3 text-neutral-600">
                Yes! You can cancel your subscription at any time. You'll continue to have
                Pro access until the end of your billing period, then you'll be downgraded to Free.
              </p>
            </details>

            <details className="bg-white rounded-lg p-6 border border-neutral-200">
              <summary className="font-semibold text-neutral-900 cursor-pointer">
                How do I contact support?
              </summary>
              <p className="mt-3 text-neutral-600">
                Email us at support@lilwidget.com and we'll get back to you within 24 hours
                (usually much faster). Pro customers get priority support.
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-600">Loading...</div>
      </div>
    }>
      <UpgradePageContent />
    </Suspense>
  );
}
