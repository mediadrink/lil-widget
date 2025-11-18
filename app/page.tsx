// app/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import HomepageDemoWidget from "@/components/HomepageDemoWidget";

export default function LandingPage() {
  const router = useRouter();
  const [showLogin, setShowLogin] = React.useState(false);
  const [showSignup, setShowSignup] = React.useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = React.useState("");
  const [loginPassword, setLoginPassword] = React.useState("");
  const [loginLoading, setLoginLoading] = React.useState(false);
  const [loginError, setLoginError] = React.useState("");

  // Signup state
  const [signupEmail, setSignupEmail] = React.useState("");
  const [signupPassword, setSignupPassword] = React.useState("");
  const [signupFullName, setSignupFullName] = React.useState("");
  const [signupLoading, setSignupLoading] = React.useState(false);
  const [signupError, setSignupError] = React.useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Login failed");
      }

      router.push("/dashboard/widgets");
    } catch (err: any) {
      setLoginError(err.message || "Login failed");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setSignupError("");
    setSignupLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signupEmail,
          password: signupPassword,
          full_name: signupFullName,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Signup failed");
      }

      router.push("/onboarding");
    } catch (err: any) {
      setSignupError(err.message || "Signup failed");
    } finally {
      setSignupLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      {/* Navigation */}
      <nav className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 170.64 172.84" className="text-amber-500">
              <path fill="currentColor" d="M170.07,71.44c-1.75-9.4-21.37-2.94-26.48-7.52-.63-.56-5.41-10.62-5.28-11.34.39-2.25,9.11-12.29,10.97-15.99,3.17-6.35,1.66-7.59-3.16-12.19-1.93-1.84-18.53-14.59-19.95-15.04-9.59-3.04-14.96,9.81-20.53,15.66l-1.8.66-13.22-3.78c-5.9-9.73-2.71-23.6-17.75-21.73-3.78.47-20.03,4.44-23.03,5.97-9.64,4.9-1.35,19.57-2.17,27.76l-10.04,7.63c-6.53-.99-19.04-9.1-24.77-4.63C10.25,38.9-.21,62.04,0,65.42c.39,6.33,15.69,12.02,20.11,16.19-.35,3.01.77,7.66-.51,10.3-1.34,2.76-14.37,8.72-17.2,11.31-3.46,3.17-2.34,7.1-1.08,10.96,1.29,3.96,7.04,16.09,9.21,19.79,6.57,11.23,22.21-5.24,29.11-1.13.84.5,8.14,7.16,8.28,7.76-.47,8.53-7.95,21.71,2.6,26.37,4.02,1.77,25.31,6.78,28.86,5.73,5.09-1.51,8.94-17.61,10.94-22.55l14.33-2.85c7.02,5.54,11.26,20.04,21.79,15.45,1.97-.86,19.93-14.43,21.7-16.28,7.74-8.1-6.62-18.92-9.84-26.23l4.99-12.13c7.03-3.15,25.51,2.76,26.86-7.64.61-4.71.73-24.68-.08-29.02ZM84.35,137.79c-28.75,0-52.05-23.3-52.05-52.05s23.3-52.05,52.05-52.05,52.05,23.3,52.05,52.05-23.3,52.05-52.05,52.05Z"/>
            </svg>
            <span className="text-xl font-bold">Lil' Widget</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowLogin(true)}
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Log In
            </button>
            <button
              onClick={() => setShowSignup(true)}
              className="rounded-lg bg-amber-400 hover:bg-amber-500 text-neutral-900 font-medium px-6 py-2.5 text-sm transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <h1 className="text-6xl font-bold mb-6 leading-tight">
          AI-Powered Chat Widgets
          <br />
          <span className="text-neutral-600">for Your Website</span>
        </h1>
        <p className="text-xl text-neutral-600 mb-12 max-w-3xl mx-auto leading-relaxed">
          Add an intelligent chat assistant to your website in minutes.
          No coding required. Customize the personality, capture leads,
          and provide instant support to your visitors.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setShowSignup(true)}
            className="rounded-lg bg-amber-400 hover:bg-amber-500 text-neutral-900 font-medium px-8 py-4 text-lg transition-colors shadow-md"
          >
            Start Free - No Credit Card
          </button>
          <a
            href="#pricing"
            className="rounded-lg border-2 border-neutral-900 text-neutral-900 font-medium px-8 py-4 text-lg hover:bg-neutral-50 transition-colors"
          >
            View Pricing
          </a>
        </div>
        <p className="text-sm text-neutral-500 mt-6">
          Basic plan free forever • 50 conversations/month • 1 widget
        </p>
      </section>

      {/* Demo Preview */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <HomepageDemoWidget />
      </section>

      {/* Features Section */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-4xl font-bold text-center mb-4">
          Everything you need
        </h2>
        <p className="text-lg text-neutral-600 text-center mb-16 max-w-2xl mx-auto">
          Simple, powerful features to help you connect with your visitors
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm">
            <div className="text-4xl mb-4">🎭</div>
            <h3 className="text-xl font-bold mb-3">Custom Personality</h3>
            <p className="text-neutral-600 leading-relaxed">
              Define your widget's tone and personality. Make it professional,
              friendly, or witty — whatever fits your brand.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold mb-3">Instant Setup</h3>
            <p className="text-neutral-600 leading-relaxed">
              Add to WordPress, Wix, Shopify, or any website with a single line
              of code. Live in under 5 minutes.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-3">Conversation Insights</h3>
            <p className="text-neutral-600 leading-relaxed">
              See what your visitors are asking. Get daily summaries and
              improve your responses over time.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold mb-3">Smart Rules</h3>
            <p className="text-neutral-600 leading-relaxed">
              Add custom rules to handle common questions, route to humans,
              or capture leads automatically.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-bold mb-3">Safe & Secure</h3>
            <p className="text-neutral-600 leading-relaxed">
              Built-in guardrails prevent your widget from giving bad advice.
              You're always in control.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-bold mb-3">Affordable Pricing</h3>
            <p className="text-neutral-600 leading-relaxed">
              No hidden fees. Start free, upgrade when you're ready.
              Cancel anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="mx-auto max-w-7xl px-6 py-24">
        <h2 className="text-4xl font-bold text-center mb-4">
          Simple, Transparent Pricing
        </h2>
        <p className="text-lg text-neutral-600 text-center mb-16 max-w-2xl mx-auto">
          Start free, upgrade when you're ready. No hidden fees.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Basic Plan */}
          <div className="bg-white rounded-2xl border-2 border-neutral-200 p-8 shadow-sm">
            <h3 className="text-2xl font-bold mb-2">Basic</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-5xl font-bold">$0</span>
              <span className="text-neutral-600">/month</span>
            </div>
            <p className="text-neutral-600 mb-6">
              Perfect for getting started
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">50 conversations/month</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">1 widget</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">Basic website crawl</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">Custom personality</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">Lil' Widget branding</span>
              </li>
            </ul>
          </div>

          {/* Growth Plan */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl border-2 border-amber-400 p-8 shadow-lg relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-neutral-900 px-4 py-1 rounded-full text-sm font-bold">
              MOST POPULAR
            </div>
            <h3 className="text-2xl font-bold mb-2">Growth</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-5xl font-bold">$19</span>
              <span className="text-neutral-600">/month</span>
            </div>
            <p className="text-neutral-600 mb-6">
              For growing businesses
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-semibold">500 conversations/month</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-semibold">2 widgets</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-semibold">Expanded crawl (10+ pages)</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-semibold">Remove branding</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-semibold">Conversation insights</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-semibold">Email support</span>
              </li>
            </ul>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-white rounded-2xl border-2 border-neutral-900 p-8 shadow-sm">
            <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-bold">Custom</span>
            </div>
            <p className="text-neutral-600 mb-6">
              For large organizations
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-semibold">Unlimited conversations</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-semibold">Unlimited widgets</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-semibold">Custom bot development</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-semibold">Custom styling</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-semibold">Personalized onboarding</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-semibold">Dedicated support</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Single Get Started Button */}
        <div className="text-center">
          <button
            onClick={() => setShowSignup(true)}
            className="inline-block rounded-lg bg-amber-400 hover:bg-amber-500 text-neutral-900 font-medium px-12 py-4 text-lg transition-colors shadow-md"
          >
            Get Started Free
          </button>
          <p className="text-sm text-neutral-500 mt-4">
            Start with Basic, upgrade anytime • No credit card required
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-neutral-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-4xl font-bold text-center mb-4">
            How it works
          </h2>
          <p className="text-lg text-neutral-600 text-center mb-16 max-w-2xl mx-auto">
            Get your AI chat widget live in three simple steps
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-400 text-neutral-900 text-2xl font-bold mb-6">
                1
              </div>
              <h3 className="text-xl font-bold mb-3">Create Your Widget</h3>
              <p className="text-neutral-600 leading-relaxed">
                Sign up and customize your widget's personality. Choose a tone,
                add your business info, and set up basic rules.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-400 text-neutral-900 text-2xl font-bold mb-6">
                2
              </div>
              <h3 className="text-xl font-bold mb-3">Add to Your Site</h3>
              <p className="text-neutral-600 leading-relaxed">
                Copy one line of code and paste it into your website.
                Works with WordPress, Wix, Shopify, and custom sites.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-400 text-neutral-900 text-2xl font-bold mb-6">
                3
              </div>
              <h3 className="text-xl font-bold mb-3">Watch It Work</h3>
              <p className="text-neutral-600 leading-relaxed">
                Your widget starts helping visitors immediately. Monitor
                conversations and refine responses from your dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <h2 className="text-5xl font-bold mb-6">
          Ready to get started?
        </h2>
        <p className="text-xl text-neutral-600 mb-12 max-w-2xl mx-auto">
          Join hundreds of businesses using Lil' Widget to provide instant
          support and capture more leads.
        </p>
        <button
          onClick={() => setShowSignup(true)}
          className="inline-block rounded-lg bg-amber-400 hover:bg-amber-500 text-neutral-900 font-medium px-12 py-5 text-xl transition-colors shadow-md"
        >
          Start Free - No Credit Card
        </button>
        <p className="text-sm text-neutral-500 mt-6">
          Free forever • No credit card required • Upgrade anytime
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <svg width="24" height="24" viewBox="0 0 170.64 172.84" className="text-amber-500">
                  <path fill="currentColor" d="M170.07,71.44c-1.75-9.4-21.37-2.94-26.48-7.52-.63-.56-5.41-10.62-5.28-11.34.39-2.25,9.11-12.29,10.97-15.99,3.17-6.35,1.66-7.59-3.16-12.19-1.93-1.84-18.53-14.59-19.95-15.04-9.59-3.04-14.96,9.81-20.53,15.66l-1.8.66-13.22-3.78c-5.9-9.73-2.71-23.6-17.75-21.73-3.78.47-20.03,4.44-23.03,5.97-9.64,4.9-1.35,19.57-2.17,27.76l-10.04,7.63c-6.53-.99-19.04-9.1-24.77-4.63C10.25,38.9-.21,62.04,0,65.42c.39,6.33,15.69,12.02,20.11,16.19-.35,3.01.77,7.66-.51,10.3-1.34,2.76-14.37,8.72-17.2,11.31-3.46,3.17-2.34,7.1-1.08,10.96,1.29,3.96,7.04,16.09,9.21,19.79,6.57,11.23,22.21-5.24,29.11-1.13.84.5,8.14,7.16,8.28,7.76-.47,8.53-7.95,21.71,2.6,26.37,4.02,1.77,25.31,6.78,28.86,5.73,5.09-1.51,8.94-17.61,10.94-22.55l14.33-2.85c7.02,5.54,11.26,20.04,21.79,15.45,1.97-.86,19.93-14.43,21.7-16.28,7.74-8.1-6.62-18.92-9.84-26.23l4.99-12.13c7.03-3.15,25.51,2.76,26.86-7.64.61-4.71.73-24.68-.08-29.02ZM84.35,137.79c-28.75,0-52.05-23.3-52.05-52.05s23.3-52.05,52.05-52.05,52.05,23.3,52.05,52.05-23.30,52.05-52.05,52.05Z"/>
                </svg>
                <span className="text-lg font-bold">Lil' Widget</span>
              </div>
              <p className="text-sm text-neutral-600">
                AI-powered chat widgets for modern websites.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li><a href="#features" className="hover:text-neutral-900">Features</a></li>
                <li><a href="/pricing" className="hover:text-neutral-900">Pricing</a></li>
                <li><a href="/docs" className="hover:text-neutral-900">Documentation</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li><a href="/about" className="hover:text-neutral-900">About</a></li>
                <li><a href="/blog" className="hover:text-neutral-900">Blog</a></li>
                <li><a href="/contact" className="hover:text-neutral-900">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li><a href="/privacy" className="hover:text-neutral-900">Privacy</a></li>
                <li><a href="/terms" className="hover:text-neutral-900">Terms</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-neutral-200 mt-12 pt-8 text-center text-sm text-neutral-500">
            © 2025 Lil' Widget. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {showLogin && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowLogin(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Welcome Back</h2>
              <button
                onClick={() => setShowLogin(false)}
                className="text-neutral-400 hover:text-neutral-900 transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {loginError}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  className="w-full rounded-lg border-2 border-neutral-200 focus:border-neutral-900 focus:outline-none px-4 py-2.5 text-sm transition-colors"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  className="w-full rounded-lg border-2 border-neutral-200 focus:border-neutral-900 focus:outline-none px-4 py-2.5 text-sm transition-colors"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium px-6 py-3 transition-colors disabled:opacity-50"
              >
                {loginLoading ? "Logging in..." : "Log In"}
              </button>

              <div className="text-center text-sm text-neutral-600">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setShowLogin(false);
                    setShowSignup(true);
                  }}
                  className="text-neutral-900 font-medium hover:underline"
                >
                  Sign up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Signup Modal */}
      {showSignup && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowSignup(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Get Started Free</h2>
              <button
                onClick={() => setShowSignup(false)}
                className="text-neutral-400 hover:text-neutral-900 transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              {signupError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {signupError}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full rounded-lg border-2 border-neutral-200 focus:border-neutral-900 focus:outline-none px-4 py-2.5 text-sm transition-colors"
                  placeholder="John Doe"
                  value={signupFullName}
                  onChange={(e) => setSignupFullName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  className="w-full rounded-lg border-2 border-neutral-200 focus:border-neutral-900 focus:outline-none px-4 py-2.5 text-sm transition-colors"
                  placeholder="you@example.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full rounded-lg border-2 border-neutral-200 focus:border-neutral-900 focus:outline-none px-4 py-2.5 text-sm transition-colors"
                  placeholder="At least 6 characters"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={signupLoading}
                className="w-full rounded-lg bg-amber-400 hover:bg-amber-500 text-neutral-900 font-medium px-6 py-3 transition-colors disabled:opacity-50"
              >
                {signupLoading ? "Creating account..." : "Create Account"}
              </button>

              <p className="text-xs text-neutral-500 text-center">
                By signing up, you agree to our Terms of Service and Privacy Policy
              </p>

              <div className="text-center text-sm text-neutral-600">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setShowSignup(false);
                    setShowLogin(true);
                  }}
                  className="text-neutral-900 font-medium hover:underline"
                >
                  Log in
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lil Widget - Dogfooding our own product on homepage! */}
      <Script
        src="https://www.lilwidget.com/widget.js"
        data-id="6a811b29-68e7-423c-9163-e7ef316af1b1"
        data-base-url="https://www.lilwidget.com"
        strategy="lazyOnload"
      />
    </div>
  );
}
