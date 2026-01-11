// app/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import HomepageDemoWidget from "@/components/HomepageDemoWidget";
import WidgetBuilder from "@/components/WidgetBuilder";

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
      {/* Hero Section with Gradient Background */}
      <section className="relative h-[700px] flex flex-col overflow-hidden">
        {/* Gradient Background */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #ffd89b 100%)',
            backgroundSize: '400% 400%',
            animation: 'gradientShift 15s ease infinite',
          }}
        />
        {/* Subtle overlay for text readability */}
        <div className="absolute inset-0 z-0 bg-white/10 backdrop-blur-[2px]" />

        {/* Floating Navigation */}
        <nav className="relative z-20 mx-auto mt-6 w-full max-w-4xl px-4">
          <div className="flex items-center justify-between rounded-full bg-white/90 backdrop-blur-md shadow-lg px-6 py-3">
            <div className="flex items-center gap-2">
              <svg width="28" height="28" viewBox="0 0 170.64 172.84" className="text-[#F25C6E]">
                <path fill="currentColor" d="M170.07,71.44c-1.75-9.4-21.37-2.94-26.48-7.52-.63-.56-5.41-10.62-5.28-11.34.39-2.25,9.11-12.29,10.97-15.99,3.17-6.35,1.66-7.59-3.16-12.19-1.93-1.84-18.53-14.59-19.95-15.04-9.59-3.04-14.96,9.81-20.53,15.66l-1.8.66-13.22-3.78c-5.9-9.73-2.71-23.6-17.75-21.73-3.78.47-20.03,4.44-23.03,5.97-9.64,4.9-1.35,19.57-2.17,27.76l-10.04,7.63c-6.53-.99-19.04-9.1-24.77-4.63C10.25,38.9-.21,62.04,0,65.42c.39,6.33,15.69,12.02,20.11,16.19-.35,3.01.77,7.66-.51,10.3-1.34,2.76-14.37,8.72-17.2,11.31-3.46,3.17-2.34,7.1-1.08,10.96,1.29,3.96,7.04,16.09,9.21,19.79,6.57,11.23,22.21-5.24,29.11-1.13.84.5,8.14,7.16,8.28,7.76-.47,8.53-7.95,21.71,2.6,26.37,4.02,1.77,25.31,6.78,28.86,5.73,5.09-1.51,8.94-17.61,10.94-22.55l14.33-2.85c7.02,5.54,11.26,20.04,21.79,15.45,1.97-.86,19.93-14.43,21.7-16.28,7.74-8.1-6.62-18.92-9.84-26.23l4.99-12.13c7.03-3.15,25.51,2.76,26.86-7.64.61-4.71.73-24.68-.08-29.02ZM84.35,137.79c-28.75,0-52.05-23.3-52.05-52.05s23.3-52.05,52.05-52.05,52.05,23.3,52.05,52.05-23.3,52.05-52.05,52.05Z"/>
              </svg>
              <span className="text-lg font-bold text-neutral-900">Lil' Widget</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">Features</a>
              <a href="#pricing" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">Pricing</a>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowLogin(true)}
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                Log in
              </button>
              <button
                onClick={() => setShowSignup(true)}
                className="rounded-full bg-neutral-900 hover:bg-neutral-800 text-white font-medium px-5 py-2 text-sm transition-colors flex items-center gap-2"
              >
                Get started
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6">
          <h1 className="text-4xl md:text-6xl font-semibold text-white mb-6 leading-[1.15] tracking-tight max-w-4xl">
            AI for Your Website
            <br />
            in Under 5 Minutes
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl leading-relaxed">
            Add a smart, fully customizable assistant that installs instantly,
            answers customers 24/7, and helps you close more business.
          </p>
        </div>
      </section>

      {/* Widget Builder */}
      <section className="mx-auto max-w-5xl px-6 py-16 -mt-20 relative z-10">
        <WidgetBuilder onSignup={() => setShowSignup(true)} />
      </section>

      {/* Features Section */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-32">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-medium mb-6 tracking-tight">
            Everything you need
          </h2>
          <p className="text-lg text-neutral-500 max-w-2xl mx-auto leading-relaxed">
            Simple, powerful features to help you connect with your visitors
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="group bg-neutral-50 hover:bg-white rounded-3xl p-8 transition-all duration-300 hover:shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl mb-6">
              🎭
            </div>
            <h3 className="text-xl font-semibold mb-3">Custom Personality</h3>
            <p className="text-neutral-500 leading-relaxed">
              Define your widget's tone and personality. Make it professional,
              friendly, or witty — whatever fits your brand.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group bg-neutral-50 hover:bg-white rounded-3xl p-8 transition-all duration-300 hover:shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-xl mb-6">
              ⚡
            </div>
            <h3 className="text-xl font-semibold mb-3">Instant Setup</h3>
            <p className="text-neutral-500 leading-relaxed">
              Add to WordPress, Wix, Shopify, or any website with a single line
              of code. Live in under 5 minutes.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group bg-neutral-50 hover:bg-white rounded-3xl p-8 transition-all duration-300 hover:shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xl mb-6">
              📊
            </div>
            <h3 className="text-xl font-semibold mb-3">Conversation Insights</h3>
            <p className="text-neutral-500 leading-relaxed">
              See what your visitors are asking. Get daily summaries and
              improve your responses over time.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="group bg-neutral-50 hover:bg-white rounded-3xl p-8 transition-all duration-300 hover:shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-xl mb-6">
              🎯
            </div>
            <h3 className="text-xl font-semibold mb-3">Smart Rules</h3>
            <p className="text-neutral-500 leading-relaxed">
              Add custom rules to handle common questions, route to humans,
              or capture leads automatically.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="group bg-neutral-50 hover:bg-white rounded-3xl p-8 transition-all duration-300 hover:shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center text-white text-xl mb-6">
              🔒
            </div>
            <h3 className="text-xl font-semibold mb-3">Safe & Secure</h3>
            <p className="text-neutral-500 leading-relaxed">
              Built-in guardrails prevent your widget from giving bad advice.
              You're always in control.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="group bg-neutral-50 hover:bg-white rounded-3xl p-8 transition-all duration-300 hover:shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xl mb-6">
              💰
            </div>
            <h3 className="text-xl font-semibold mb-3">Affordable Pricing</h3>
            <p className="text-neutral-500 leading-relaxed">
              No hidden fees. Start free, upgrade when you're ready.
              Cancel anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-neutral-50 py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-medium mb-6 tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-neutral-500 max-w-2xl mx-auto leading-relaxed">
              Start free, upgrade when you're ready. No hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {/* Basic Plan */}
            <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-2">Basic</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-5xl font-semibold">$0</span>
                <span className="text-neutral-400">/month</span>
              </div>
              <p className="text-neutral-500 mb-8">
                Perfect for getting started
              </p>
              <button
                onClick={() => setShowSignup(true)}
                className="w-full rounded-full border-2 border-neutral-200 hover:border-neutral-900 text-neutral-900 font-medium py-3 mb-8 transition-colors"
              >
                Start free
              </button>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-neutral-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-neutral-600">50 conversations/month</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-neutral-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-neutral-600">1 widget</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-neutral-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-neutral-600">Basic website crawl</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-neutral-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-neutral-600">Custom personality</span>
                </li>
              </ul>
            </div>

            {/* Growth Plan */}
            <div className="bg-neutral-900 text-white rounded-3xl p-8 shadow-xl relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#F25C6E] to-[#FF8A65] text-white px-4 py-1.5 rounded-full text-sm font-medium">
                Most popular
              </div>
              <h3 className="text-xl font-semibold mb-2">Growth</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-5xl font-semibold">$19</span>
                <span className="text-neutral-400">/month</span>
              </div>
              <p className="text-neutral-400 mb-8">
                For growing businesses
              </p>
              <button
                onClick={() => setShowSignup(true)}
                className="w-full rounded-full bg-white hover:bg-neutral-100 text-neutral-900 font-medium py-3 mb-8 transition-colors"
              >
                Get started
              </button>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#F25C6E] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>500 conversations/month</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#F25C6E] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>2 widgets</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#F25C6E] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Expanded crawl (10+ pages)</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#F25C6E] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Remove branding</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#F25C6E] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Email support</span>
                </li>
              </ul>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-2">Enterprise</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-semibold">Custom</span>
              </div>
              <p className="text-neutral-500 mb-8">
                For large organizations
              </p>
              <a
                href="mailto:hello@lilwidget.com"
                className="block w-full rounded-full border-2 border-neutral-200 hover:border-neutral-900 text-neutral-900 font-medium py-3 mb-8 transition-colors text-center"
              >
                Contact us
              </a>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-neutral-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-neutral-600">Unlimited conversations</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-neutral-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-neutral-600">Unlimited widgets</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-neutral-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-neutral-600">Custom development</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-neutral-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-neutral-600">Dedicated support</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-medium mb-6 tracking-tight">
              How it works
            </h2>
            <p className="text-lg text-neutral-500 max-w-2xl mx-auto leading-relaxed">
              Get your AI chat widget live in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F25C6E] to-[#FF8A65] text-white text-xl font-semibold mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">Create your widget</h3>
              <p className="text-neutral-500 leading-relaxed">
                Sign up and customize your widget's personality. Choose a tone,
                add your business info, and set up basic rules.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F25C6E] to-[#FF8A65] text-white text-xl font-semibold mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">Add to your site</h3>
              <p className="text-neutral-500 leading-relaxed">
                Copy one line of code and paste it into your website.
                Works with WordPress, Wix, Shopify, and custom sites.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F25C6E] to-[#FF8A65] text-white text-xl font-semibold mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">Watch it work</h3>
              <p className="text-neutral-500 leading-relaxed">
                Your widget starts helping visitors immediately. Monitor
                conversations and refine responses from your dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #ffd89b 100%)',
            backgroundSize: '400% 400%',
            animation: 'gradientShift 15s ease infinite',
          }}
        />
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-medium text-white mb-6 tracking-tight">
            Ready to get started?
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            Add an AI assistant to your website today.
            No credit card required.
          </p>
          <button
            onClick={() => setShowSignup(true)}
            className="rounded-full bg-white hover:bg-neutral-100 text-neutral-900 font-medium px-10 py-4 text-lg transition-all shadow-lg hover:shadow-xl"
          >
            Get started free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <svg width="28" height="28" viewBox="0 0 170.64 172.84" className="text-[#F25C6E]">
                  <path fill="currentColor" d="M170.07,71.44c-1.75-9.4-21.37-2.94-26.48-7.52-.63-.56-5.41-10.62-5.28-11.34.39-2.25,9.11-12.29,10.97-15.99,3.17-6.35,1.66-7.59-3.16-12.19-1.93-1.84-18.53-14.59-19.95-15.04-9.59-3.04-14.96,9.81-20.53,15.66l-1.8.66-13.22-3.78c-5.9-9.73-2.71-23.6-17.75-21.73-3.78.47-20.03,4.44-23.03,5.97-9.64,4.9-1.35,19.57-2.17,27.76l-10.04,7.63c-6.53-.99-19.04-9.1-24.77-4.63C10.25,38.9-.21,62.04,0,65.42c.39,6.33,15.69,12.02,20.11,16.19-.35,3.01.77,7.66-.51,10.3-1.34,2.76-14.37,8.72-17.2,11.31-3.46,3.17-2.34,7.1-1.08,10.96,1.29,3.96,7.04,16.09,9.21,19.79,6.57,11.23,22.21-5.24,29.11-1.13.84.5,8.14,7.16,8.28,7.76-.47,8.53-7.95,21.71,2.6,26.37,4.02,1.77,25.31,6.78,28.86,5.73,5.09-1.51,8.94-17.61,10.94-22.55l14.33-2.85c7.02,5.54,11.26,20.04,21.79,15.45,1.97-.86,19.93-14.43,21.7-16.28,7.74-8.1-6.62-18.92-9.84-26.23l4.99-12.13c7.03-3.15,25.51,2.76,26.86-7.64.61-4.71.73-24.68-.08-29.02ZM84.35,137.79c-28.75,0-52.05-23.3-52.05-52.05s23.3-52.05,52.05-52.05,52.05,23.3,52.05,52.05-23.30,52.05-52.05,52.05Z"/>
                </svg>
                <span className="text-lg font-bold">Lil' Widget</span>
              </div>
              <p className="text-neutral-400 text-sm leading-relaxed">
                AI-powered chat widgets for modern websites.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm">Product</h4>
              <ul className="space-y-3 text-sm text-neutral-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm">Company</h4>
              <ul className="space-y-3 text-sm text-neutral-400">
                <li><a href="mailto:hello@lilwidget.com" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm">Legal</h4>
              <ul className="space-y-3 text-sm text-neutral-400">
                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="/terms" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-neutral-800 pt-8 text-center text-sm text-neutral-500">
            © 2025 Lil' Widget. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {showLogin && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowLogin(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold">Welcome back</h2>
              <button
                onClick={() => setShowLogin(false)}
                className="text-neutral-400 hover:text-neutral-900 transition-colors p-1"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {loginError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  className="w-full rounded-xl border border-neutral-200 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 focus:outline-none px-4 py-3 text-sm transition-all"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  className="w-full rounded-xl border border-neutral-200 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 focus:outline-none px-4 py-3 text-sm transition-all"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full rounded-full bg-neutral-900 hover:bg-neutral-800 text-white font-medium px-6 py-3.5 transition-colors disabled:opacity-50"
              >
                {loginLoading ? "Logging in..." : "Log in"}
              </button>

              <div className="text-center text-sm text-neutral-500">
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowSignup(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold">Get started free</h2>
              <button
                onClick={() => setShowSignup(false)}
                className="text-neutral-400 hover:text-neutral-900 transition-colors p-1"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSignup} className="space-y-5">
              {signupError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {signupError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Full name
                </label>
                <input
                  type="text"
                  required
                  className="w-full rounded-xl border border-neutral-200 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 focus:outline-none px-4 py-3 text-sm transition-all"
                  placeholder="John Doe"
                  value={signupFullName}
                  onChange={(e) => setSignupFullName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  className="w-full rounded-xl border border-neutral-200 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 focus:outline-none px-4 py-3 text-sm transition-all"
                  placeholder="you@example.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-neutral-200 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 focus:outline-none px-4 py-3 text-sm transition-all"
                  placeholder="At least 6 characters"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={signupLoading}
                className="w-full rounded-full bg-neutral-900 hover:bg-neutral-800 text-white font-medium px-6 py-3.5 transition-colors disabled:opacity-50"
              >
                {signupLoading ? "Creating account..." : "Create account"}
              </button>

              <p className="text-xs text-neutral-400 text-center">
                By signing up, you agree to our Terms of Service and Privacy Policy
              </p>

              <div className="text-center text-sm text-neutral-500">
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
        src={`/widget.js?v=${Date.now()}`}
        data-id="6a811b29-68e7-423c-9163-e7ef316af1b1"
        data-base-url=""
        strategy="lazyOnload"
      />
    </div>
  );
}
